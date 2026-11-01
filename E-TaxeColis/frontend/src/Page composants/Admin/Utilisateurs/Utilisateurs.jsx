import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Utilisateurs.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur, utilisateurConnecte } from "../../../Simple composants/Outils/api";

// Table usertable : statut = "en attente", "actif" ou "desactive"
const TYPES_UTILISATEUR = [
  { value: "admin", label: "Administrateur" },
  { value: "taxateur", label: "Taxateur" },
  { value: "directeur", label: "Directeur" },
  { value: "chef de division", label: "Chef de division" },
];

const LIBELLES_STATUT = {
  "en attente": "En attente",
  actif: "Actif",
  desactive: "Désactivé",
};

// Texte et couleur de chaque pop up
const ACTIONS = {
  ajouter: {
    titre: "Accepter l’utilisateur",
    message: "Vérifiez le type de cet utilisateur puis confirmez : le compte sera actif et un email de confirmation lui sera envoyé.",
    texte: "Accepter",
    couleur: vert,
  },
  refuser: {
    titre: "Refuser la demande",
    message: "Voulez-vous vraiment refuser cette demande ? Le compte sera désactivé.",
    texte: "Refuser",
    couleur: rouge,
  },
  activer: {
    titre: "Activer l’utilisateur",
    message: "Voulez-vous activer ce compte ? Un email de confirmation sera envoyé à l’utilisateur.",
    texte: "Activer",
    couleur: vert,
  },
  desactiver: {
    titre: "Désactiver l’utilisateur",
    message: "Voulez-vous désactiver ce compte ? L’utilisateur ne pourra plus se connecter.",
    texte: "Désactiver",
    couleur: rouge,
  },
};

function libelleType(valeur) {
  const type = TYPES_UTILISATEUR.find((t) => t.value === valeur);
  return type ? type.label : valeur;
}

function libelleStatut(valeur) {
  return LIBELLES_STATUT[valeur] || valeur;
}

// Le mot de passe n'est jamais affiché
const COLONNES = [
  { titre: "ID", cle: "iduser" },
  { titre: "Nom", cle: "nomutilisateur" },
  { titre: "Type", cle: "typeutilisateur", afficher: libelleType },
  { titre: "Email", cle: "emailutilisateur" },
  { titre: "Statut", cle: "statut", afficher: libelleStatut },
];

function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [action, setAction] = useState(null); // "ajouter", "refuser", ...
  const [selection, setSelection] = useState(null); // utilisateur concerné
  const [nouveauType, setNouveauType] = useState("");

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  async function chargerUtilisateurs() {
    try {
      const reponse = await axios.get(`${URL_API}/user/selectionnertout`);
      setUtilisateurs(reponse.data);
    } catch {
      toast.error("Impossible de charger les utilisateurs");
    }
  }

  function ouvrirPopup(nomAction, utilisateur) {
    setAction(nomAction);
    setSelection(utilisateur);
    setNouveauType(utilisateur.typeutilisateur);
  }

  function fermerPopup() {
    setAction(null);
    setSelection(null);
  }

  // Boutons affichés selon le statut de la ligne (1 ou 2 boutons)
  const moi = utilisateurConnecte();

  function boutonsDeLigne(ligne) {
    // L'admin ne peut pas désactiver son propre compte
    if (moi && ligne.iduser === moi.iduser) {
      return [];
    }
    if (ligne.statut === "en attente") {
      return [
        { texte: "Accepter", couleur: vert, onClick: () => ouvrirPopup("ajouter", ligne) },
        { texte: "Refuser", couleur: rouge, onClick: () => ouvrirPopup("refuser", ligne) },
      ];
    }
    if (ligne.statut === "actif") {
      return [
        { texte: "Désactiver", couleur: rouge, onClick: () => ouvrirPopup("desactiver", ligne) },
      ];
    }
    return [
      { texte: "Activer", couleur: vert, onClick: () => ouvrirPopup("activer", ligne) },
    ];
  }

  // Accepter / Activer : PUT /user/activer/:iduser (avec le type choisi)
  // Refuser / Désactiver : PUT /user/desactiver/:iduser
  async function confirmer() {
    const id = selection.iduser;

    try {
      let reponse;
      if (action === "ajouter" || action === "activer") {
        reponse = await axios.put(`${URL_API}/user/activer/${id}`, { typeutilisateur: nouveauType });
      } else {
        reponse = await axios.put(`${URL_API}/user/desactiver/${id}`);
      }
      const { emailEnvoye, ...utilisateur } = reponse.data;
      setUtilisateurs(utilisateurs.map((u) => (u.iduser === id ? utilisateur : u)));

      if (action === "ajouter" || action === "activer") {
        // Le backend dit si l'email de confirmation est parti
        if (emailEnvoye) {
          toast.success(`Compte activé. Un email de confirmation a été envoyé à ${utilisateur.emailutilisateur}`);
        } else {
          toast.error("Compte activé, mais l’email n’a pas pu être envoyé (vérifiez SMTP dans le .env du backend)");
        }
      } else {
        toast.success("Compte désactivé");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="UtilisateursTitre">Utilisateurs</h2>

      <TableDonnees
        colonnes={COLONNES}
        donnees={utilisateurs}
        cleLigne="iduser"
        actions={boutonsDeLigne}
        messageVide="Aucun utilisateur"
      />

      {action && (
        <Popup
          titre={ACTIONS[action].titre}
          texteConfirmer={ACTIONS[action].texte}
          couleur={ACTIONS[action].couleur}
          onConfirmer={confirmer}
          onFermer={fermerPopup}
        >
          <p>
            {ACTIONS[action].message}
          </p>
          <p>
            <strong>{selection.nomutilisateur}</strong> – {selection.emailutilisateur}
          </p>

          {/* Pop up de changement de valeur : pour "Accepter" et "Activer" */}
          {(action === "ajouter" || action === "activer") && (
            <SelectInput
              label="Type d’utilisateur"
              name="nouveauType"
              options={TYPES_UTILISATEUR}
              value={nouveauType}
              onChange={setNouveauType}
            />
          )}
        </Popup>
      )}
    </div>
  );
}

export default Utilisateurs;
