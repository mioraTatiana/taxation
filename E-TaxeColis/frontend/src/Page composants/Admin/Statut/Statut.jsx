import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Statut.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import CustomInput from "../../../Simple composants/Input/Input";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { bleu, vert } from "../../../Simple composants/Couleurs/couleur";
import {
  URL_API,
  messageErreur,
  utilisateurConnecte,
  mettreAJourUtilisateur,
} from "../../../Simple composants/Outils/api";

// Page admin "Statut" : tous les utilisateurs, avec un bouton Modifier.
// L'admin peut tout changer : nom, email, type d'utilisateur, statut et mot de passe
// (s'il le remplit). Il confirme avec SON PROPRE mot de passe d'administrateur.
// Routes du backend : GET /user/selectionnertout et PUT /user/admin/modifier/:iduser

const TYPES_UTILISATEUR = [
  { value: "admin", label: "Administrateur" },
  { value: "taxateur", label: "Taxateur" },
  { value: "directeur", label: "Directeur" },
  { value: "chef de division", label: "Chef de division" },
];

const STATUTS = [
  { value: "actif", label: "Actif", description: "Peut se connecter" },
  { value: "en attente", label: "En attente", description: "Demande pas encore acceptée" },
  { value: "desactive", label: "Désactivé", description: "Ne peut plus se connecter" },
];

const CLASSES_STATUT = { actif: "StatutActif", "en attente": "StatutAttente", desactive: "StatutDesactive" };

function libelle(liste, valeur) {
  const element = liste.find((e) => e.value === valeur);
  return element ? element.label : valeur;
}

const COLONNES = [
  { titre: "ID", cle: "iduser" },
  { titre: "Nom", cle: "nomutilisateur" },
  { titre: "Email", cle: "emailutilisateur" },
  { titre: "Type d’utilisateur", cle: "typeutilisateur", afficher: (valeur) => libelle(TYPES_UTILISATEUR, valeur) },
  {
    titre: "Statut",
    cle: "statut",
    afficher: (valeur) => (
      <span className={`StatutEtiquette ${CLASSES_STATUT[valeur] || ""}`}>{libelle(STATUTS, valeur)}</span>
    ),
  },
];

// Tailles de la base : nom 20, email 50
const SCHEMA = z.object({
  nomutilisateur: z.string().trim().min(3, "Nom : au moins 3 caractères").max(20, "Nom : 20 caractères maximum"),
  emailutilisateur: z.string().trim().email("Adresse email invalide").max(50, "Email : 50 caractères maximum"),
  typeutilisateur: z.string().min(1, "Choisissez le type d’utilisateur"),
  statut: z.string().min(1, "Choisissez le statut"),
  nouveaumotpasse: z.string().refine((v) => v === "" || v.length >= 8, "Nouveau mot de passe : au moins 8 caractères"),
  motpasseadmin: z.string().min(1, "Saisissez votre mot de passe d’administrateur pour confirmer"),
});

function Statut() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selection, setSelection] = useState(null); // utilisateur en cours de modification
  const [formulaire, setFormulaire] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const moi = utilisateurConnecte();

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

  function ouvrirModification(utilisateur) {
    setSelection(utilisateur);
    setFormulaire({
      nomutilisateur: utilisateur.nomutilisateur,
      emailutilisateur: utilisateur.emailutilisateur,
      typeutilisateur: utilisateur.typeutilisateur,
      statut: utilisateur.statut || "en attente",
      nouveaumotpasse: "",
      motpasseadmin: "",
    });
  }

  function fermerPopup() {
    setSelection(null);
    setFormulaire(null);
  }

  function changerChamp(nom, valeur) {
    setFormulaire({ ...formulaire, [nom]: valeur });
  }

  function boutonsDeLigne(utilisateur) {
    return [{ texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(utilisateur) }];
  }

  async function enregistrer() {
    if (enCours) return;
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }

    setEnCours(true);
    try {
      const donnees = { ...resultat.data };
      if (donnees.nouveaumotpasse === "") delete donnees.nouveaumotpasse; // garder l'ancien
      const reponse = await axios.put(`${URL_API}/user/admin/modifier/${selection.iduser}`, donnees);

      // L'admin a modifié son propre compte : on met à jour le nom affiché dans le menu
      if (moi && selection.iduser === moi.iduser) mettreAJourUtilisateur(reponse.data);

      toast.success(`Compte de ${reponse.data.nomutilisateur} modifié`);
      fermerPopup();
      chargerUtilisateurs();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
    setEnCours(false);
  }

  // L'admin ne peut pas retirer son propre rôle d'admin ni désactiver son compte
  const surMonCompte = moi && selection && selection.iduser === moi.iduser;

  return (
    <div>
      <h2 className="StatutTitre">Utilisateurs</h2>
    

      <TableDonnees
        colonnes={COLONNES}
        donnees={utilisateurs}
        cleLigne="iduser"
        actions={boutonsDeLigne}
        messageVide="Aucun utilisateur"
      />

      {selection && formulaire && (
        <Popup
          titre={`Modifier ${selection.nomutilisateur} (${selection.iduser})`}
          texteConfirmer={enCours ? "Enregistrement..." : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Nom d’utilisateur"
            name="nomutilisateur"
            value={formulaire.nomutilisateur}
            onChange={(e) => changerChamp("nomutilisateur", e.target.value)}
          />
          <CustomInput
            type="email"
            label="Email"
            name="emailutilisateur"
            value={formulaire.emailutilisateur}
            onChange={(e) => changerChamp("emailutilisateur", e.target.value)}
          />
          <SelectInput
            label="Type d’utilisateur"
            name="typeutilisateur"
            options={TYPES_UTILISATEUR}
            value={formulaire.typeutilisateur}
            onChange={(valeur) => changerChamp("typeutilisateur", valeur)}
            disabled={surMonCompte}
          />
          <SelectInput
            label="Statut"
            name="statut"
            options={STATUTS}
            value={formulaire.statut}
            onChange={(valeur) => changerChamp("statut", valeur)}
            disabled={surMonCompte}
          />
          <CustomInput
            type="password"
            label="Nouveau mot de passe (laisser vide pour le garder)"
            name="nouveaumotpasse"
            value={formulaire.nouveaumotpasse}
            onChange={(e) => changerChamp("nouveaumotpasse", e.target.value)}
          />

          <p className="StatutSeparateur">Confirmation</p>
          <CustomInput
            type="password"
            label="Votre mot de passe d’administrateur"
            name="motpasseadmin"
            value={formulaire.motpasseadmin}
            onChange={(e) => changerChamp("motpasseadmin", e.target.value)}
            required
          />
        </Popup>
      )}
    </div>
  );
}

export default Statut;
