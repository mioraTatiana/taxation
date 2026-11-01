import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import Popup from "../Popup/Popup";
import CustomInput from "../Input/Input";
import { bleu } from "../Couleurs/couleur";
import { URL_API, messageErreur } from "../Outils/api";

// Pop up d'ajout / de modification d'un client.
// Utilisé par la page Client ET par la section Client de la nouvelle facture (bouton "Nouveau client").
//  client       : le client à modifier, ou null pour un nouveau client
//  valeursDepart: valeurs déjà tapées (ex: le nom saisi dans la facture)
//  onEnregistre : appelé avec le client renvoyé par la base (avec son idclient)
//  onFermer     : ferme le pop up

export const CLIENT_VIDE = {
  nomclient: "",
  sigle: "",
  cin: "",
  telephone: "",
  adresse: "",
  email: "",
};

// Obligatoires : nom et téléphone. Le sigle et le CIN sont facultatifs
// (un client peut être une personne ou une société).
// Tailles de la base : nom 100, sigle 10, CIN 12, téléphone 13, adresse 100, email 50
const SCHEMA = z.object({
  nomclient: z.string().trim().min(2, "Saisissez le nom du client").max(100, "Nom : 100 caractères maximum"),
  sigle: z.string().trim().max(10, "Sigle : 10 caractères maximum"),
  cin: z
    .string()
    .regex(/^(\d{12})?$/, "Le CIN doit contenir 12 chiffres"),
  telephone: z
    .string()
    .regex(/^(?:\+261\d{9}|0\d{9})$/, "Téléphone : +261 suivi de 9 chiffres, ou 10 chiffres commençant par 0"),
  adresse: z.string().trim().max(100, "Adresse : 100 caractères maximum"),
  email: z.string().trim().email("Adresse email invalide").max(50, "Email : 50 caractères maximum").or(z.literal("")),
});

// CIN : 201321654789 -> 201 321 654 789
export function formaterCIN(cin) {
  const chiffres = String(cin || "").replace(/\D/g, "");
  return chiffres.replace(/(\d{3})(?=\d)/g, "$1 ");
}

// Téléphone : +261346331923 -> +261 34 63 319 23 ; 0341234567 -> 034 12 345 67
export function formaterTelephone(telephone) {
  const valeur = String(telephone || "");
  const chiffres = valeur.replace(/\D/g, "");

  if (valeur.startsWith("+") && chiffres.startsWith("261")) {
    const numero = chiffres.slice(3);
    return ["+261", numero.slice(0, 2), numero.slice(2, 4), numero.slice(4, 7), numero.slice(7, 9)]
      .filter(Boolean)
      .join(" ");
  }

  return [chiffres.slice(0, 3), chiffres.slice(3, 5), chiffres.slice(5, 8), chiffres.slice(8, 10)]
    .filter(Boolean)
    .join(" ");
}

// Ce qui est gardé dans le formulaire : chiffres seulement (le + au début est permis pour le téléphone)
function nettoyer(name, value) {
  if (name === "cin") return value.replace(/\D/g, "").slice(0, 12);
  if (name === "telephone") {
    const commenceParPlus = value.trimStart().startsWith("+");
    const chiffres = value.replace(/\D/g, "").slice(0, 12);
    return (commenceParPlus ? `+${chiffres}` : chiffres).slice(0, 13);
  }
  return value;
}

// Les valeurs "null" de la base deviennent des textes vides dans le formulaire
function versFormulaire(client) {
  const formulaire = {};
  Object.keys(CLIENT_VIDE).forEach((cle) => {
    formulaire[cle] = client && client[cle] ? String(client[cle]) : "";
  });
  return formulaire;
}

function PopupClient({ client, valeursDepart, onEnregistre, onFermer }) {
  const [formulaire, setFormulaire] = useState({
    ...versFormulaire(client),
    ...valeursDepart,
  });
  const [enCours, setEnCours] = useState(false);

  function changerChamp(e) {
    const { name, value } = e.target;
    setFormulaire({ ...formulaire, [name]: nettoyer(name, value) });
  }

  async function enregistrer() {
    if (enCours) return;
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }

    // Les champs facultatifs vides sont envoyés à null
    const donnees = { ...resultat.data };
    ["sigle", "cin", "adresse", "email"].forEach((cle) => {
      if (donnees[cle] === "") donnees[cle] = null;
    });

    setEnCours(true);
    try {
      const reponse = client
        ? await axios.put(`${URL_API}/client/modifier/${client.idclient}`, donnees)
        : await axios.post(`${URL_API}/client/ajouter`, donnees);
      toast.success(client ? "Client modifié" : "Client ajouté");
      onEnregistre(reponse.data);
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
    setEnCours(false);
  }

  return (
    <Popup
      titre={client ? "Modifier le client" : "Nouveau client"}
      texteConfirmer={client ? "Enregistrer" : "Ajouter"}
      couleur={bleu}
      onConfirmer={enregistrer}
      onFermer={onFermer}
    >
      <CustomInput type="text" label="Nom du client" name="nomclient" value={formulaire.nomclient} onChange={changerChamp} required />
      <CustomInput type="text" label="Sigle" name="sigle" value={formulaire.sigle} onChange={changerChamp} />
      <CustomInput type="text" label="CIN" name="cin" value={formaterCIN(formulaire.cin)} onChange={changerChamp} />
      <CustomInput
        type="tel"
        label="Téléphone"
        name="telephone"
        value={formaterTelephone(formulaire.telephone)}
        onChange={changerChamp}
        placeholder="+261 34 12 345 67"
        required
      />
      <CustomInput type="text" label="Adresse" name="adresse" value={formulaire.adresse} onChange={changerChamp} />
      <CustomInput type="email" label="Email" name="email" value={formulaire.email} onChange={changerChamp} />
    </Popup>
  );
}

export default PopupClient;
