import React, { useState } from "react";
import toast from "react-hot-toast";
import "./FormulaireLigne.css";
import CustomInput from "../Input/Input";
import SelectInput from "../SelectInput/SelectInput";
import GroupeRadio from "../GroupeRadio/GroupeRadio";
import BouttonNouveau from "../BouttonNouveau/BouttonNouveau";
import { bleu } from "../Couleurs/couleur";
import { trouverTarif, formaterMontant, creerLigne } from "../Outils/calculsFacture";

// Formulaire d'UNE ligne de facture (une marchandise).
// Utilisé par "Colis à expédier" (nouvelle facture) ET par le pop up "Modifier la facture" (Statistique).
//
//  Désignation : choisie dans la liste (type automatique) OU écrite à la main (on choisit le type)
//  Poids       : "Poids réglé"     = nombre de colis x poids d'un colis (table marchandise)
//                "Poids non réglé" = le taxateur écrit le poids réel ; poids facturé = poids réel
//
//  Props :
//   wagonComplet, avecTva, idzone, typeWagon, tarifWagon, idwagon : l'embarquement
//   marchandises, typesMarchandise, tarifs                       : les tables
//   ligneDepart     : ligne à modifier (ou null pour une nouvelle ligne)
//   onValider(ligne): appelé avec la ligne calculée ; renvoie true si elle est acceptée (le formulaire se vide)
//   texteBouton     : "Ajouter" / "Modifier"
//   onNouvelleMarchandise : facultatif, affiche le bouton "Nouvelle marchandise"
//  Pour vider le formulaire depuis le parent : changer sa "key".

const OPTIONS_DESIGNATION = [
  { value: "liste", label: "Choisir dans la liste" },
  { value: "libre", label: "Écrire la désignation" },
];

const OPTIONS_POIDS = [
  { value: "regle", label: "Poids réglé" },
  { value: "nonregle", label: "Poids non réglé" },
];

// Valeurs du formulaire à partir d'une ligne existante
function etatDepart(ligne) {
  if (!ligne) {
    return { modeDesignation: "liste", idmarchandise: "", designation: "", idtypemarchandise: "", modePoids: "regle", nombrecolis: "", poidsreel: "" };
  }
  const libre = !ligne.idmarchandise;
  // Une ligne venant de la base n'a pas "poidsregle" : on le retrouve avec le poids d'un colis
  const regle =
    ligne.poidsregle !== undefined
      ? ligne.poidsregle
      : !libre && ligne.poidscolis && Math.abs(ligne.nombrecolis * ligne.poidscolis - ligne.poidsreel) < 0.01;
  return {
    modeDesignation: libre ? "libre" : "liste",
    idmarchandise: libre ? "" : String(ligne.idmarchandise),
    designation: libre ? ligne.designation || "" : "",
    idtypemarchandise: ligne.idtypemarchandise || "",
    modePoids: regle && !libre ? "regle" : "nonregle",
    nombrecolis: String(ligne.nombrecolis ?? ""),
    poidsreel: String(ligne.poidsreel ?? ""),
  };
}

function FormulaireLigne({
  wagonComplet,
  avecTva,
  idzone,
  typeWagon,
  tarifWagon,
  idwagon,
  marchandises,
  typesMarchandise,
  tarifs,
  ligneDepart,
  onValider,
  texteBouton = "Ajouter",
  onNouvelleMarchandise,
  children,
}) {
  const [f, setF] = useState(() => etatDepart(ligneDepart));
  const libre = f.modeDesignation === "libre";

  function changer(champ, valeur) {
    setF((ancien) => ({ ...ancien, [champ]: valeur }));
  }

  // ----- Marchandises et types proposés -----
  //  Wagon complet : tout ; Express avec TVA : soumis à la TVA ; sans TVA : non soumis
  const marchandisesAutorisees = wagonComplet ? marchandises : marchandises.filter((m) => Boolean(m.soumistva) === avecTva);
  const typesAutorises = wagonComplet ? typesMarchandise : typesMarchandise.filter((t) => Boolean(t.soumistva) === avecTva);

  const optionsMarchandises = marchandisesAutorisees.map((m) => ({
    value: String(m.idmarchandise),
    label: m.designation,
    description: `${formaterMontant(m.poidscolis)} kg / colis – ${m.libelletype}`,
  }));
  const optionsTypes = typesAutorises.map((t) => ({
    value: String(t.idtypemarchandise),
    label: t.libelletype,
    description: t.soumistva ? "Soumis à la TVA" : "Non soumis à la TVA",
  }));

  // ----- La marchandise de la ligne (de la liste, ou écrite à la main) -----
  const marchandiseListe = marchandises.find((m) => String(m.idmarchandise) === f.idmarchandise);
  const typeLibre = typesMarchandise.find((t) => String(t.idtypemarchandise) === String(f.idtypemarchandise));
  const marchandise = libre
    ? f.designation.trim() && typeLibre
      ? { idmarchandise: null, designation: f.designation.trim(), idtypemarchandise: typeLibre.idtypemarchandise, libelletype: typeLibre.libelletype }
      : null
    : marchandiseListe || null;

  // ----- Tarif, poids, montant calculés automatiquement -----
  const tarif = wagonComplet
    ? tarifWagon
    : marchandise
      ? trouverTarif(tarifs, idzone, marchandise.idtypemarchandise, typeWagon.idtypewagon)
      : null;

  const poidsRegle = !libre && f.modePoids === "regle";
  const nombrecolis = Number(f.nombrecolis) || 0;
  const poidsSaisi = Number(String(f.poidsreel).replace(",", ".")) || 0;
  const ligneEnCours =
    marchandise && tarif && nombrecolis > 0 && (poidsRegle || poidsSaisi > 0)
      ? creerLigne({ marchandise, nombrecolis, poidsreel: poidsRegle ? undefined : poidsSaisi, tarif, typeWagon, idwagon })
      : null;

  function valider() {
    if (libre && !f.designation.trim()) return toast.error("Écrivez la désignation");
    if (libre && f.designation.trim().length > 100) return toast.error("Désignation : 100 caractères maximum");
    if (libre && !typeLibre) return toast.error("Choisissez le type de marchandise");
    if (!libre && !marchandiseListe) return toast.error("Choisissez une désignation");
    if (!Number.isInteger(nombrecolis) || nombrecolis <= 0 || nombrecolis > 999) {
      return toast.error("Nombre de colis : un nombre entier entre 1 et 999");
    }
    if (!poidsRegle && !(poidsSaisi > 0)) return toast.error("Saisissez le poids réel (kg)");
    if (!tarif) {
      return toast.error(
        wagonComplet
          ? "Aucun tarif pour cette destination, ce type de marchandise et ce wagon"
          : "Aucun tarif pour cette destination, ce type de marchandise et l’Express"
      );
    }
    if (onValider(ligneEnCours)) setF(etatDepart(null));
  }

  return (
    <div className="FormulaireLigne">
      <GroupeRadio
        label="Désignation"
        name="modeDesignation"
        options={OPTIONS_DESIGNATION}
        value={f.modeDesignation}
        onChange={(valeur) =>
          setF((ancien) => ({ ...ancien, modeDesignation: valeur, modePoids: valeur === "libre" ? "nonregle" : ancien.modePoids }))
        }
      />

      {libre ? (
        <>
          <CustomInput
            type="text"
            label="Désignation (écrite à la main) *"
            name="designation"
            value={f.designation}
            onChange={(e) => changer("designation", e.target.value)}
            placeholder="Ex : Sac de légumes"
          />
          <SelectInput
            label="Type de marchandise *"
            name="idtypemarchandise"
            options={optionsTypes}
            value={String(f.idtypemarchandise)}
            onChange={(valeur) => changer("idtypemarchandise", valeur)}
            placeholder="Sélectionner un type"
            searchPlaceholder="Rechercher un type..."
          />
        </>
      ) : (
        <>
          <SelectInput
            label="Désignation *"
            name="idmarchandise"
            options={optionsMarchandises}
            value={f.idmarchandise}
            onChange={(valeur) => changer("idmarchandise", valeur)}
            placeholder="Sélectionner une désignation"
            searchPlaceholder="Rechercher..."
          />

          {/* Marchandise absente de la liste : on l'ajoute dans la base (caché dès qu'une désignation est choisie) */}
          {onNouvelleMarchandise && !f.idmarchandise && (
            <div className="LigneNouvelleMarchandise">
              <span>La marchandise n’est pas dans la liste ?</span>
              <BouttonNouveau texte="Nouvelle marchandise" onClick={onNouvelleMarchandise} />
            </div>
          )}

          <CustomInput
            type="text"
            label="Type de marchandise (automatique)"
            name="libelletype"
            value={marchandiseListe ? marchandiseListe.libelletype : ""}
            readOnly
          />
        </>
      )}

      <CustomInput
        type="text"
        label={wagonComplet ? "Tarif (compris dans le wagon)" : "Tarif (automatique)"}
        name="tarif"
        value={wagonComplet ? (marchandise ? "0 Ar/kg" : "") : tarif ? `${formaterMontant(tarif.prixkg)} Ar/kg` : ""}
        readOnly
      />
      {marchandise && !wagonComplet && !tarif && (
        <p className="LigneErreur">Aucun tarif pour cette destination, ce type de marchandise et l’Express.</p>
      )}

      <CustomInput
        type="number"
        label="Nombre de colis *"
        name="nombrecolis"
        value={f.nombrecolis}
        onChange={(e) => changer("nombrecolis", e.target.value)}
      />

      {/* Poids réglé (poids d'un colis connu) ou non réglé (poids écrit par le taxateur) */}
      <GroupeRadio
        label="Poids"
        name="modePoids"
        options={libre ? OPTIONS_POIDS.filter((o) => o.value === "nonregle") : OPTIONS_POIDS}
        value={poidsRegle ? "regle" : "nonregle"}
        onChange={(valeur) => changer("modePoids", valeur)}
      />

      {poidsRegle ? (
        <CustomInput
          type="text"
          label="Poids réel (= nombre de colis × poids d’un colis)"
          name="poidsreel"
          value={ligneEnCours ? `${formaterMontant(ligneEnCours.poidsreel)} kg` : ""}
          readOnly
        />
      ) : (
        <CustomInput
          type="number"
          label="Poids réel (kg) *"
          name="poidsreel"
          value={f.poidsreel}
          onChange={(e) => changer("poidsreel", e.target.value)}
        />
      )}

      <CustomInput
        type="text"
        label={wagonComplet ? "Poids facturé (= poids facturé du wagon)" : "Poids facturé (= poids réel)"}
        name="poidsfacture"
        value={ligneEnCours ? `${formaterMontant(ligneEnCours.poidsfacture)} kg` : ""}
        readOnly
      />
      <CustomInput
        type="text"
        label="Prix applicable (= tarif)"
        name="prixapplicable"
        value={ligneEnCours ? formaterMontant(ligneEnCours.prixapplicable) : ""}
        readOnly
      />
      <CustomInput
        type="text"
        label="Montant (= prix applicable × poids facturé)"
        name="montant"
        value={ligneEnCours ? `${formaterMontant(ligneEnCours.montantht)} Ar` : ""}
        readOnly
      />

      <button type="button" className="LigneValider" style={{ backgroundColor: bleu }} onClick={valider}>
        {texteBouton}
      </button>

      {/* Boutons en plus (ex : Effacer, Annuler la modification) */}
      {children}
    </div>
  );
}

export default FormulaireLigne;
