import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import Popup from "../Popup/Popup";
import CustomInput from "../Input/Input";
import { bleu } from "../Couleurs/couleur";
import { URL_API, messageErreur, mettreAJourUtilisateur } from "../Outils/api";
import { libelleDuRole } from "../Layout/menus";

// Pop up "Mon profil", ouvert en cliquant sur son profil dans le menu de gauche (Layout).
// L'utilisateur peut changer : son nom, son email et son mot de passe.
// Il confirme TOUJOURS avec son mot de passe actuel.
// Son rôle et son statut sont seulement affichés : seul l'admin les change (page Statut).
// Route du backend : PUT /user/modifier/:iduser

const LIBELLES_STATUT = { "en attente": "En attente", actif: "Actif", desactive: "Désactivé" };

// Tailles de la base : nom 20, email 50
const SCHEMA = z
  .object({
    nomutilisateur: z.string().trim().min(3, "Nom : au moins 3 caractères").max(20, "Nom : 20 caractères maximum"),
    emailutilisateur: z.string().trim().email("Adresse email invalide").max(50, "Email : 50 caractères maximum"),
    nouveaumotpasse: z.string().refine((v) => v === "" || v.length >= 8, "Nouveau mot de passe : au moins 8 caractères"),
    confirmation: z.string(),
    motpasse: z.string().min(1, "Saisissez votre mot de passe actuel pour confirmer"),
  })
  .refine((v) => v.nouveaumotpasse === v.confirmation, {
    message: "Les deux nouveaux mots de passe ne sont pas identiques",
  });

function PopupProfil({ utilisateur, onFermer, onEnregistre }) {
  const [formulaire, setFormulaire] = useState({
    nomutilisateur: utilisateur.nomutilisateur,
    emailutilisateur: utilisateur.emailutilisateur || "",
    nouveaumotpasse: "",
    confirmation: "",
    motpasse: "",
  });
  const [enCours, setEnCours] = useState(false);

  function changerChamp(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
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
      const { confirmation, ...donnees } = resultat.data;
      if (donnees.nouveaumotpasse === "") delete donnees.nouveaumotpasse; // garder l'ancien
      const reponse = await axios.put(`${URL_API}/user/modifier/${utilisateur.iduser}`, donnees);

      mettreAJourUtilisateur(reponse.data); // le nouveau nom s'affiche dans le menu
      toast.success(
        donnees.nouveaumotpasse ? "Profil et mot de passe modifiés" : "Profil modifié"
      );
      onEnregistre(reponse.data);
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
    setEnCours(false);
  }

  return (
    <Popup
      titre="Mon profil"
      texteConfirmer={enCours ? "Enregistrement..." : "Enregistrer"}
      couleur={bleu}
      onConfirmer={enregistrer}
      onFermer={onFermer}
    >
      <CustomInput type="text" label="Nom d’utilisateur" name="nomutilisateur" value={formulaire.nomutilisateur} onChange={changerChamp} />
      <CustomInput type="email" label="Email" name="emailutilisateur" value={formulaire.emailutilisateur} onChange={changerChamp} />

      {/* Seulement affichés : l'admin les change dans la page Statut */}
      <CustomInput type="text" label="Type d’utilisateur (modifiable par l’admin)" name="type" value={libelleDuRole(utilisateur.typeutilisateur)} readOnly />
      <CustomInput type="text" label="Statut (modifiable par l’admin)" name="statut" value={LIBELLES_STATUT[utilisateur.statut] || utilisateur.statut || ""} readOnly />

      <CustomInput type="password" label="Nouveau mot de passe (laisser vide pour le garder)" name="nouveaumotpasse" value={formulaire.nouveaumotpasse} onChange={changerChamp} />
      <CustomInput type="password" label="Confirmer le nouveau mot de passe" name="confirmation" value={formulaire.confirmation} onChange={changerChamp} />

      <CustomInput type="password" label="Mot de passe actuel (confirmation)" name="motpasse" value={formulaire.motpasse} onChange={changerChamp} required />
    </Popup>
  );
}

export default PopupProfil;
