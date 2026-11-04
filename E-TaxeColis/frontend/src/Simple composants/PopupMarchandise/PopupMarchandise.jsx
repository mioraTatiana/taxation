import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import Popup from "../Popup/Popup";
import CustomInput from "../Input/Input";
import SelectInput from "../SelectInput/SelectInput";
import { bleu } from "../Couleurs/couleur";
import { URL_API, messageErreur } from "../Outils/api";

// Pop up d'ajout / de modification d'une marchandise.
// Utilisé par la page Marchandise ET par la section "Colis à expédier" de la nouvelle facture
// (bouton "Nouvelle marchandise"), comme le pop up des clients.
//  marchandise      : la marchandise à modifier, ou null pour une nouvelle marchandise
//  typesMarchandise : les types proposés dans la liste
//  valeursDepart    : valeurs déjà connues (ex: le type déjà choisi)
//  onEnregistre     : appelé avec la marchandise renvoyée par la base (avec son idmarchandise)
//  onFermer         : ferme le pop up

export const MARCHANDISE_VIDE = { designation: "", poidscolis: "", idtypemarchandise: "" };

// designation = 50 caractères maximum ; poidscolis est un réel (décimales acceptées)
const SCHEMA = z.object({
  designation: z.string().trim().min(2, "Saisissez la désignation").max(50, "Désignation : 50 caractères maximum"),
  poidscolis: z.coerce.number().positive("Le poids du colis doit être supérieur à 0"),
  idtypemarchandise: z.string().min(1, "Choisissez un type de marchandise"),
});

function versFormulaire(marchandise) {
  if (!marchandise) return MARCHANDISE_VIDE;
  return {
    designation: marchandise.designation,
    poidscolis: String(marchandise.poidscolis),
    idtypemarchandise: String(marchandise.idtypemarchandise ?? ""),
  };
}

function PopupMarchandise({ marchandise, typesMarchandise, valeursDepart, onEnregistre, onFermer }) {
  const [formulaire, setFormulaire] = useState({ ...versFormulaire(marchandise), ...valeursDepart });
  const [enCours, setEnCours] = useState(false);

  const optionsTypes = typesMarchandise.map((type) => ({
    value: String(type.idtypemarchandise),
    label: type.libelletype,
    description: type.soumistva ? "Soumis à la TVA" : "Non soumis à la TVA",
  }));

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
      const reponse = marchandise
        ? await axios.put(`${URL_API}/marchandise/modifier/${marchandise.idmarchandise}`, resultat.data)
        : await axios.post(`${URL_API}/marchandise/ajouter`, resultat.data);
      toast.success(marchandise ? "Marchandise modifiée" : "Marchandise ajoutée");
      onEnregistre(reponse.data);
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
    setEnCours(false);
  }

  return (
    <Popup
      titre={marchandise ? "Modifier la marchandise" : "Nouvelle marchandise"}
      texteConfirmer={marchandise ? "Enregistrer" : "Ajouter"}
      couleur={bleu}
      onConfirmer={enregistrer}
      onFermer={onFermer}
    >
      <CustomInput type="text" label="Désignation" name="designation" value={formulaire.designation} onChange={changerChamp} />
      <CustomInput type="number" label="Poids du colis (kg)" name="poidscolis" value={formulaire.poidscolis} onChange={changerChamp} />
      <SelectInput
        label="Type de marchandise"
        name="idtypemarchandise"
        options={optionsTypes}
        value={formulaire.idtypemarchandise}
        onChange={(valeur) => setFormulaire({ ...formulaire, idtypemarchandise: valeur })}
        placeholder="Sélectionner un type"
        searchPlaceholder="Rechercher un type..."
      />
    </Popup>
  );
}

export default PopupMarchandise;
