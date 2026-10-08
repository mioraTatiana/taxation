import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Utilisateurs.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { vert, rouge } from "../../../Simple composants/Couleurs/couleur";

const URL_UTILISATEURS = "/api/utilisateurs"; // TODO : votre URL d'API
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// Noms des champs = colonnes de usertable (+ "statut", voir remarque)
const DONNEES_TEST = [
  { iduser: "USR03", nomutilisateur: "Miora", typeutilisateur: "taxateur", emailutilisateur: "ttnmiora@gmail.com", statut: "en_attente" },
  { iduser: "USR01", nomutilisateur: "Miora", typeutilisateur: "taxateur", emailutilisateur: "ttnmiora@gmail.com", statut: "actif" },
  { iduser: "USR02", nomutilisateur: "Rakoto", typeutilisateur: "directeur", emailutilisateur: "rakoto@gmail.com", statut: "inactif" },
];

const TYPES_UTILISATEUR = [
  { value: "admin", label: "Administrateur" },
  { value: "taxateur", label: "Taxateur" },
  { value: "directeur", label: "Directeur" },
  { value: "chef_division", label: "Chef de division" },
];

const LIBELLES_STATUT = {
  en_attente: "En attente",
  actif: "Actif",
  inactif: "Inactif",
};

// Texte et couleur de chaque pop up
const ACTIONS = {
  ajouter: {
    titre: "Ajouter l’utilisateur",
    message: "Choisissez le type de cet utilisateur puis confirmez.",
    texte: "Ajouter",
    couleur: vert,
  },
  refuser: {
    titre: "Refuser la demande",
    message: "Voulez-vous vraiment refuser cette demande ? Le compte sera supprimé.",
    texte: "Refuser",
    couleur: rouge,
  },
  activer: {
    titre: "Activer l’utilisateur",
    message: "Voulez-vous activer ce compte ?",
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
    if (UTILISER_DONNEES_TEST) {
      setUtilisateurs(DONNEES_TEST);
      return;
    }
    try {
      const reponse = await axios.get(URL_UTILISATEURS);
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
  function boutonsDeLigne(ligne) {
    if (ligne.statut === "en_attente") {
      return [
        { texte: "Ajouter", couleur: vert, onClick: () => ouvrirPopup("ajouter", ligne) },
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

  async function confirmer() {
    const id = selection.iduser;

    try {
      if (action === "refuser") {
        if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_UTILISATEURS}/${id}`);
        setUtilisateurs(utilisateurs.filter((u) => u.iduser !== id));
      } else {
        const changements =
          action === "ajouter"
            ? { statut: "actif", typeutilisateur: nouveauType }
            : { statut: action === "activer" ? "actif" : "inactif" };

        if (!UTILISER_DONNEES_TEST) await axios.patch(`${URL_UTILISATEURS}/${id}`, changements);
        setUtilisateurs(
          utilisateurs.map((u) => (u.iduser === id ? { ...u, ...changements } : u))
        );
      }
      toast.success("Opération effectuée");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
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

          {/* Pop up de changement de valeur : uniquement pour "Ajouter" */}
          {action === "ajouter" && (
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
