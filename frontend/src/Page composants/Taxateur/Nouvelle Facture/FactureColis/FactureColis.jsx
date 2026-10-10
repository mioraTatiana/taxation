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
import FactureApercu from "../FactureApercu/FactureApercu";
import { trouverTarif, formaterMontant, LIBELLE_TYPE_FUNERAIRE } from "../calculsFacture";

const FORMULAIRE_VIDE = { idmarchandise: "", nombrecolis: "", poidsreel: "", nomdefunt: "" };

const SCHEMA = z.object({
  idmarchandise: z.string().min(1, "Choisissez une désignation"),
  nombrecolis: z.coerce
    .number()
    .int("Le nombre de colis doit être un nombre entier")
    .positive("Le nombre de colis doit être supérieur à 0"),
  poidsreel: z.number().positive("Le poids réel doit être supérieur à 0"),
});

function FactureColis({
  embarquement,
  client,
  destination,
  zoneLibelle,
  typeTrain,
  marchandises,
  typesMarchandise,
  tarifs,
  lignes,
  totaux,
  numfacture,
  enregistrementEnCours,
  onChangeLignes,
  onSupprimerLigne,
  onRetour,
  onAnnuler,
  onEnregistrer,
}) {
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [indexModif, setIndexModif] = useState(null); // ligne en cours de modification
  const [confirmation, setConfirmation] = useState(null); // { type: "supprimer", index } ou { type: "effacer" }

  const funeraire = embarquement.transport === "funeraire";
  const avecTva = embarquement.tva === "avec";
  const wagonComplet = Boolean(typeTrain && typeTrain.modefacturation);
  const capacite = wagonComplet ? typeTrain.poidsfacturation : 0;

  // ----- Ce que l'étape 2 autorise : transport funéraire, ou marchandise avec / sans TVA -----
  const typesAutorises = typesMarchandise.filter((type) => {
    if (funeraire) return type.libelletype === LIBELLE_TYPE_FUNERAIRE;
    return type.libelletype !== LIBELLE_TYPE_FUNERAIRE && type.soumistva === avecTva;
  });

  const marchandisesAutorisees = marchandises.filter((m) =>
    typesAutorises.some((type) => type.idtypemarchandise === m.idtypemarchandise)
  );

  // ----- Valeurs calculées automatiquement -----
  const marchandise = marchandises.find((m) => String(m.idmarchandise) === formulaire.idmarchandise);
  const tarif = marchandise
    ? trouverTarif(tarifs, destination.idzone, marchandise.idtypemarchandise, typeTrain.idtypetrain)
    : null;

  const nombrecolis = Number(formulaire.nombrecolis) || 0;
  // Wagon complet : poids réel = nombre de colis x poids d'un colis. Express : saisi à la main.
  const poidsreel = wagonComplet
    ? nombrecolis * (marchandise ? marchandise.poidscolis : 0)
    : Number(formulaire.poidsreel) || 0;
  const poidsfacture = wagonComplet ? capacite : poidsreel;
  const prix = tarif ? tarif.prixkg : 0;
  const montant = Math.round(poidsfacture * prix);

  // Poids déjà chargé dans le wagon (sans la ligne en cours de modification)
  const poidsAutresLignes = lignes
    .filter((ligne, index) => index !== indexModif)
    .reduce((total, ligne) => total + ligne.poidsreel, 0);

  const poidsChargeTotal = lignes.reduce((total, ligne) => total + ligne.poidsreel, 0);
  const pourcentageWagon = capacite > 0 ? (poidsChargeTotal / capacite) * 100 : 0;

  // ----- Options des selects -----
  const optionsMarchandises = marchandisesAutorisees.map((m) => ({
    value: String(m.idmarchandise),
    label: m.designation,
    description: `${m.poidscolis} kg / colis`,
  }));

  const optionsTypes = typesAutorises.map((type) => ({
    value: type.idtypemarchandise,
    label: type.libelletype,
    description: type.soumistva ? "Soumis à la TVA" : "Non soumis à la TVA",
  }));

  // ----- Actions -----
  function changerChamp(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  }

  function reinitialiserFormulaire() {
    setFormulaire(FORMULAIRE_VIDE);
    setIndexModif(null);
  }

  function ajouterOuModifier() {
    const resultat = SCHEMA.safeParse({
      idmarchandise: formulaire.idmarchandise,
      nombrecolis: formulaire.nombrecolis,
      poidsreel,
    });
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }
    if (funeraire && formulaire.nomdefunt.trim() === "") {
      toast.error("Saisissez le nom du défunt");
      return;
    }
    if (!tarif) {
      toast.error("Aucun tarif pour cette destination, ce type de marchandise et ce type de wagon");
      return;
    }
    if (wagonComplet && poidsAutresLignes + poidsreel > capacite) {
      const disponible = Math.max(0, capacite - poidsAutresLignes);
      toast.error(`Le wagon est plein : il reste ${formaterMontant(disponible)} kg`);
      return;
    }

    const ancienne = indexModif !== null ? lignes[indexModif] : null;
    const ligne = {
      iddetailfacture: ancienne ? ancienne.iddetailfacture : undefined, // présent seulement si déjà en base
      idmarchandise: marchandise.idmarchandise,
      designation: marchandise.designation,
      idtypemarchandise: marchandise.idtypemarchandise,
      idtarif: tarif.idtarif,
      nombrecolis,
      poidsreel,
      poidsfacture: poidsreel, // le poids du wagon complet est appliqué au niveau de la facture
      prixapplicable: prix,
      montantht: Math.round(poidsreel * prix),
      nomdefunt: funeraire ? formulaire.nomdefunt.trim() : "",
    };

    if (indexModif !== null) {
      onChangeLignes(lignes.map((l, index) => (index === indexModif ? ligne : l)));
      toast.success("Colis modifié");
    } else {
      onChangeLignes([...lignes, ligne]);
      toast.success("Colis ajouté");
    }
    reinitialiserFormulaire();
  }

  // Modifier : renvoie les données de la ligne dans le formulaire
  function commencerModification(index) {
    const ligne = lignes[index];
    setFormulaire({
      idmarchandise: String(ligne.idmarchandise),
      nombrecolis: String(ligne.nombrecolis),
      poidsreel: String(ligne.poidsreel),
      nomdefunt: ligne.nomdefunt || "",
    });
    setIndexModif(index);
  }

  function confirmerAction() {
    if (confirmation.type === "supprimer") {
      onSupprimerLigne(confirmation.index);
      if (indexModif === confirmation.index) reinitialiserFormulaire();
    } else {
      onChangeLignes([]); // Effacer : vide toutes les données enregistrées dans le stockage local
      reinitialiserFormulaire();
    }
    setConfirmation(null);
  }

  return (
    <div>
      <div className="ColisEntete">
        <EnteteSection
          icone={Package}
          titre={funeraire ? "Transport funéraire" : "Colis à expédier"}
          sousTitre="Insérer les informations sur le colis"
        />

        {/* Compteur : nombre de marchandises (express) ou poids chargé (wagon complet) */}
        <div className="ColisCompteur">
          {wagonComplet ? (
            <>
              <strong>Poids : {formaterMontant(poidsChargeTotal)} kg</strong>
              <BarreProgression pourcentage={pourcentageWagon} afficherTexte={false} />
              <span className="ColisCompteurNote">sur {formaterMontant(capacite)} kg</span>
            </>
          ) : (
            <strong>
              {lignes.length} marchandise{lignes.length > 1 ? "s" : ""}
            </strong>
          )}
        </div>
      </div>

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

          {funeraire ? (
            <CustomInput
              type="text"
              label="Nom du défunt *"
              name="nomdefunt"
              value={formulaire.nomdefunt}
              onChange={changerChamp}
            />
          ) : (
            <SelectInput
              label="Type de marchandise (automatique)"
              name="idtypemarchandise"
              options={optionsTypes}
              value={marchandise ? marchandise.idtypemarchandise : ""}
              onChange={() => {}}
              placeholder="Automatique"
              disabled
            />
          )}

          <CustomInput
            type="text"
            label="Tarif (automatique)"
            name="tarif"
            value={tarif ? `${formaterMontant(tarif.prixkg)} Ar/kg` : ""}
            readOnly
          />
          {marchandise && !tarif && (
            <p className="ColisErreur">
              Aucun tarif pour cette destination, ce type de marchandise et ce type de wagon.
            </p>
          )}

          <CustomInput
            type="number"
            label={funeraire ? "Nombre (cercueils, urnes) *" : "Nombre de colis *"}
            name="nombrecolis"
            value={formulaire.nombrecolis}
            onChange={changerChamp}
          />

          {wagonComplet ? (
            <CustomInput
              type="text"
              label="Poids réel (automatique)"
              name="poidsreel"
              value={poidsreel > 0 ? `${formaterMontant(poidsreel)} kg` : ""}
              readOnly
            />
          ) : (
            <CustomInput
              type="number"
              label="Poids réel (kg) *"
              name="poidsreel"
              value={formulaire.poidsreel}
              onChange={changerChamp}
            />
          )}

          <CustomInput
            type="text"
            label={wagonComplet ? "Poids facturé (= poids du wagon)" : "Poids facturé (= poids réel)"}
            name="poidsfacture"
            value={poidsfacture > 0 ? `${formaterMontant(poidsfacture)} kg` : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Prix applicable (= tarif)"
            name="prixapplicable"
            value={tarif ? formaterMontant(prix) : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Montant (= poids facturé × prix applicable)"
            name="montant"
            value={montant > 0 ? `${formaterMontant(montant)} Ar` : ""}
            readOnly
          />

          <button
            type="button"
            className="ColisAjouter"
            style={{ backgroundColor: bleu }}
            onClick={ajouterOuModifier}
          >
            {indexModif !== null ? "Modifier" : "Ajouter"}
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
            client={client}
            destinationNom={destination.nomdestination}
            zoneLibelle={zoneLibelle}
            typeTrain={typeTrain}
            lignes={lignes}
            totaux={totaux}
            numfacture={numfacture}
            wagonComplet={wagonComplet}
            onModifier={commencerModification}
            onSupprimer={(index) => setConfirmation({ type: "supprimer", index })}
            texteAction={wagonComplet ? "Enregistrer" : "Imprimer"}
            onAction={onEnregistrer}
            actionDesactivee={enregistrementEnCours}
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
