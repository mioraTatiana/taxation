import React, { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { Package } from "lucide-react";
import "./FactureColis.css";
import CustomInput from "../../../../Simple composants/Input/Input";
import SelectInput from "../../../../Simple composants/SelectInput/SelectInput";
import Popup from "../../../../Simple composants/Popup/Popup";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import BarreProgression from "../../../../Simple composants/BarreProgression/BarreProgression";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";
import { bleu, rouge } from "../../../../Simple composants/Couleurs/couleur";
import FactureApercu from "../../Facture/FactureApercu/FactureApercu";
import {
  trouverTarif,
  formaterMontant,
  creerLigne,
  ajouterLigne,
  remplacerLigne,
  estWagonComplet,
  poidsMaxWagon,
  MAX_LIGNES_EXPRESS,
  POIDS_MINIMUM_EXPRESS,
} from "../../../../Simple composants/Outils/calculsFacture";

// Section 3 : colis à expédier (marchandises).
//
//  Express (avec / sans TVA) :
//    - avec TVA : marchandises soumises à la TVA ; sans TVA : marchandises non soumises (TVA = 0)
//    - prix applicable = tarif ; poids facturé = poids réel ; montant = poids facturé x prix
//    - 11 marchandises au maximum ; minimum 20 kg facturés
//  Wagon complet (série 100 / 400) :
//    - la 1re ligne (le wagon) est calculée toute seule, c'est elle qui est imprimée
//    - les marchandises ajoutées ont un tarif 0 et augmentent les colis / le poids de la 1re ligne
//    - le poids chargé ne doit pas dépasser 10 000 kg (série 100) ou 15 000 kg (série 400)
//  Une marchandise ajoutée deux fois : ses colis et ses poids sont additionnés.

const FORMULAIRE_VIDE = { idmarchandise: "", nombrecolis: "" };

const SCHEMA = z.object({
  idmarchandise: z.string().min(1, "Choisissez une désignation"),
  nombrecolis: z.coerce
    .number()
    .int("Le nombre de colis doit être un nombre entier")
    .positive("Le nombre de colis doit être supérieur à 0")
    .max(999, "Nombre de colis : 3 chiffres maximum"),
});

function FactureColis({
  embarquement,
  destination,
  typeWagon,
  typeMarchandiseWagon,
  tarifWagon,
  marchandises,
  tarifs,
  lignes,
  facture,
  enregistrementEnCours,
  onChangeLignes,
  onRetour,
  onAnnuler,
  onEnregistrer,
}) {
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [idModif, setIdModif] = useState(null); // idmarchandise de la ligne en cours de modification
  const [confirmation, setConfirmation] = useState(null); // { type: "supprimer", idmarchandise } ou { type: "effacer" }

  const wagonComplet = estWagonComplet(typeWagon);
  const avecTva = embarquement.tva === "avec";
  const poidsMax = poidsMaxWagon(typeWagon);

  // ----- Marchandises proposées -----
  //  Wagon complet : toutes les marchandises (PPN / Divers ne sert qu'à la taxation)
  //  Express avec TVA : types soumis à la TVA ; sans TVA : types non soumis
  const marchandisesAutorisees = wagonComplet
    ? marchandises
    : marchandises.filter((m) => Boolean(m.soumistva) === avecTva);

  // ----- Valeurs calculées automatiquement pour la ligne en cours -----
  const marchandise = marchandises.find((m) => String(m.idmarchandise) === formulaire.idmarchandise);
  const tarifExpress =
    marchandise && !wagonComplet
      ? trouverTarif(tarifs, destination.idzone, marchandise.idtypemarchandise, typeWagon.idtypewagon)
      : null;
  const tarif = wagonComplet ? tarifWagon : tarifExpress;

  const nombrecolis = Number(formulaire.nombrecolis) || 0;
  const ligneEnCours =
    marchandise && tarif && nombrecolis > 0
      ? creerLigne({ marchandise, nombrecolis, tarif, typeWagon, idwagon: embarquement.idwagon })
      : null;

  // Poids déjà chargé (sans la ligne en cours de modification)
  const poidsCharge = lignes.reduce((total, ligne) => total + ligne.poidsreel, 0);
  const poidsAutresLignes = lignes
    .filter((ligne) => ligne.idmarchandise !== idModif)
    .reduce((total, ligne) => total + ligne.poidsreel, 0);
  const pourcentageWagon = poidsMax > 0 ? (poidsCharge / poidsMax) * 100 : 0;

  const optionsMarchandises = marchandisesAutorisees.map((m) => ({
    value: String(m.idmarchandise),
    label: m.designation,
    description: `${formaterMontant(m.poidscolis)} kg / colis – ${m.libelletype}`,
  }));

  // ----- Actions -----
  function reinitialiserFormulaire() {
    setFormulaire(FORMULAIRE_VIDE);
    setIdModif(null);
  }

  function ajouterOuModifier() {
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }
    if (!tarif) {
      toast.error(
        wagonComplet
          ? "Aucun tarif pour cette destination, ce type de marchandise et ce wagon"
          : "Aucun tarif pour cette destination, ce type de marchandise et l’Express"
      );
      return;
    }
    if (!(ligneEnCours.poidsreel > 0)) {
      toast.error("Le poids réel doit être supérieur à 0 : vérifiez le poids d’un colis de cette marchandise");
      return;
    }

    // Express : 11 marchandises au maximum (une marchandise déjà présente ne compte pas en plus)
    const dejaPresente = lignes.some((ligne) => ligne.idmarchandise === ligneEnCours.idmarchandise);
    if (!wagonComplet && idModif === null && !dejaPresente && lignes.length >= MAX_LIGNES_EXPRESS) {
      toast.error(`Une facture Express contient ${MAX_LIGNES_EXPRESS} marchandises au maximum`);
      return;
    }

    // Wagon complet : poids maximal du wagon
    if (wagonComplet && poidsAutresLignes + ligneEnCours.poidsreel > poidsMax) {
      const disponible = Math.max(0, poidsMax - poidsAutresLignes);
      toast.error(`Le wagon est plein : il reste ${formaterMontant(disponible)} kg (maximum ${formaterMontant(poidsMax)} kg)`);
      return;
    }

    if (idModif !== null) {
      const index = lignes.findIndex((ligne) => ligne.idmarchandise === idModif);
      onChangeLignes(remplacerLigne(lignes, index, ligneEnCours, wagonComplet));
      toast.success("Marchandise modifiée");
    } else {
      onChangeLignes(ajouterLigne(lignes, ligneEnCours, wagonComplet));
      toast.success(dejaPresente ? "Marchandise déjà présente : les poids ont été additionnés" : "Marchandise ajoutée");
    }
    reinitialiserFormulaire();
  }

  // Modifier : renvoie les données de la ligne dans le formulaire
  function commencerModification(idmarchandise) {
    const ligne = lignes.find((l) => l.idmarchandise === idmarchandise);
    if (!ligne) return;
    setFormulaire({ idmarchandise: String(ligne.idmarchandise), nombrecolis: String(ligne.nombrecolis) });
    setIdModif(idmarchandise);
  }

  function confirmerAction() {
    if (confirmation.type === "supprimer") {
      onChangeLignes(lignes.filter((ligne) => ligne.idmarchandise !== confirmation.idmarchandise));
      if (idModif === confirmation.idmarchandise) reinitialiserFormulaire();
      toast.success("Marchandise supprimée");
    } else {
      onChangeLignes([]); // Effacer : vide toutes les marchandises du stockage local
      reinitialiserFormulaire();
    }
    setConfirmation(null);
  }

  return (
    <div>
      <div className="ColisEntete">
        <EnteteSection
          icone={Package}
          titre="Colis à expédier"
          sousTitre={
            wagonComplet
              ? `${typeWagon.libelletypewagon} – taxé en ${typeMarchandiseWagon ? typeMarchandiseWagon.libelletype : ""}`
              : `Express ${avecTva ? "avec TVA" : "sans TVA"}`
          }
        />

        {/* Compteur : nombre de marchandises (express) ou poids chargé (wagon complet) */}
        <div className="ColisCompteur">
          {wagonComplet ? (
            <>
              <strong>Poids : {formaterMontant(poidsCharge)} kg</strong>
              <BarreProgression pourcentage={pourcentageWagon} afficherTexte={false} />
              <span className="ColisCompteurNote">sur {formaterMontant(poidsMax)} kg maximum</span>
            </>
          ) : (
            <>
              <strong>
                {lignes.length} / {MAX_LIGNES_EXPRESS} marchandises
              </strong>
              <span className="ColisCompteurNote">Minimum facturé : {POIDS_MINIMUM_EXPRESS} kg</span>
            </>
          )}
        </div>
      </div>

      {wagonComplet && !tarifWagon && (
        <p className="ColisErreur">
          Aucun tarif {typeMarchandiseWagon ? typeMarchandiseWagon.libelletype : ""} en {typeWagon.libelletypewagon} pour
          la zone de cette destination : ajoutez-le dans la page Tarif.
        </p>
      )}

      <div className="ColisCorps">
        {/* ===== 1er div : enregistrement des marchandises ===== */}
        <div className="ColisFormulaire">
          <SelectInput
            label="Désignation *"
            name="idmarchandise"
            options={optionsMarchandises}
            value={formulaire.idmarchandise}
            onChange={(valeur) => setFormulaire({ ...formulaire, idmarchandise: valeur })}
            placeholder="Sélectionner une désignation"
            searchPlaceholder="Rechercher..."
          />

          <CustomInput
            type="text"
            label="Type de marchandise (automatique)"
            name="libelletype"
            value={marchandise ? marchandise.libelletype : ""}
            readOnly
          />

          <CustomInput
            type="text"
            label={wagonComplet ? "Tarif (compris dans le wagon)" : "Tarif (automatique)"}
            name="tarif"
            value={wagonComplet ? (marchandise ? "0 Ar/kg" : "") : tarif ? `${formaterMontant(tarif.prixkg)} Ar/kg` : ""}
            readOnly
          />
          {marchandise && !wagonComplet && !tarif && (
            <p className="ColisErreur">Aucun tarif pour cette destination, ce type de marchandise et l’Express.</p>
          )}

          <CustomInput
            type="number"
            label="Nombre de colis *"
            name="nombrecolis"
            value={formulaire.nombrecolis}
            onChange={(e) => setFormulaire({ ...formulaire, nombrecolis: e.target.value })}
          />

          <CustomInput
            type="text"
            label="Poids réel (= nombre de colis × poids d’un colis)"
            name="poidsreel"
            value={ligneEnCours ? `${formaterMontant(ligneEnCours.poidsreel)} kg` : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label={wagonComplet ? "Poids facturé (= poids du wagon)" : "Poids facturé (= poids réel)"}
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

          <button
            type="button"
            className="ColisAjouter"
            style={{ backgroundColor: bleu }}
            onClick={ajouterOuModifier}
          >
            {idModif !== null ? "Modifier" : "Ajouter"}
          </button>

          <button
            type="button"
            className="ColisEffacer"
            style={{ borderColor: rouge, color: rouge }}
            onClick={() => setConfirmation({ type: "effacer" })}
            disabled={lignes.length === 0}
          >
            Effacer
          </button>
        </div>

        {/* ===== 2e div : facture avec les données enregistrées ===== */}
        <div className="ColisApercu">
          <FactureApercu
            facture={facture}
            onModifier={commencerModification}
            onSupprimer={(idmarchandise) => setConfirmation({ type: "supprimer", idmarchandise })}
            texteAction={enregistrementEnCours ? "Enregistrement..." : "Enregistrer et imprimer"}
            onAction={onEnregistrer}
            actionDesactivee={enregistrementEnCours || lignes.length === 0}
          />
        </div>
      </div>

      {/* Pas de bouton Suivant dans cette section */}
      <BarreNavigation onRetour={onRetour} onAnnuler={onAnnuler} />

      {confirmation && (
        <Popup
          titre={confirmation.type === "supprimer" ? "Supprimer la marchandise" : "Effacer les marchandises"}
          texteConfirmer={confirmation.type === "supprimer" ? "Supprimer" : "Effacer"}
          couleur={rouge}
          onConfirmer={confirmerAction}
          onFermer={() => setConfirmation(null)}
        >
          <p>
            {confirmation.type === "supprimer"
              ? "Voulez-vous vraiment supprimer cette marchandise ?"
              : "Voulez-vous vraiment effacer toutes les marchandises enregistrées ?"}
          </p>
        </Popup>
      )}
    </div>
  );
}

export default FactureColis;
