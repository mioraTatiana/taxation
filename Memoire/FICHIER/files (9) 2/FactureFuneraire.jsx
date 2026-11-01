import React from "react";
import { UserRound } from "lucide-react";
import "./FactureFuneraire.css";
import CustomInput from "../../../Simple composants/Input/Input";
import BarreNavigation from "../../../Simple composants/BarreNavigation/BarreNavigation";
import EnteteSection from "../../../Simple composants/EnteteSection/EnteteSection";
import Fcelogo from "../../../Image/logo.png";
import { formaterMontant, nombreEnLettres, TARIF_IMPOSE_FUNERAIRE } from "./calculsFacture";

// Transport funéraire : une seule facture, sans lignes de marchandises.
//  montantht   = poids imposé (7 267) x tarif du PPN en Express
//  montantttc  = montantht + piquire, arrondi à la centaine supérieure
function FactureFuneraire({
  destination,
  zoneLibelle,
  nomdefunt,
  tarif,
  calcul,
  numfacture,
  enregistrementEnCours,
  onChangeNomDefunt,
  onRetour,
  onAnnuler,
  onEnregistrer,
}) {
  const dateDuJour = new Date().toLocaleDateString("fr-FR");

  return (
    <div>
      <EnteteSection
        icone={UserRound}
        titre="Transport funéraire"
        sousTitre="Insérer le nom du défunt : le montant est calculé automatiquement"
      />

      <div className="FuneraireCorps">
        {/* ===== Formulaire ===== */}
        <div className="FuneraireFormulaire">
          <CustomInput
            type="text"
            label="Nom du défunt *"
            name="nomdefunt"
            value={nomdefunt}
            onChange={(e) => onChangeNomDefunt(e.target.value)}
          />
          <CustomInput
            type="text"
            label="Tarif (automatique : PPN en Express)"
            name="tarif"
            value={tarif ? `${formaterMontant(tarif.prixkg)} Ar/kg` : ""}
            readOnly
          />
          {!tarif && (
            <p className="FuneraireErreur">Aucun tarif PPN en Express pour la zone de cette destination.</p>
          )}
          <CustomInput
            type="text"
            label="Poids imposé"
            name="poidsimpose"
            value={`${formaterMontant(TARIF_IMPOSE_FUNERAIRE)} kg`}
            readOnly
          />
          <CustomInput
            type="text"
            label="Montant HT (= poids imposé × tarif)"
            name="montantht"
            value={tarif ? `${formaterMontant(calcul.montantht)} Ar` : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Piquire"
            name="piquire"
            value={tarif ? `${formaterMontant(calcul.piquire)} Ar` : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Montant TTC (= HT + piquire, arrondi à la centaine)"
            name="montantttc"
            value={tarif ? `${formaterMontant(calcul.montantttc)} Ar` : ""}
            readOnly
          />
        </div>

        {/* ===== Aperçu de la facture ===== */}
        <div className="FuneraireApercu">
          <div className="FuneraireCarte">
            <div className="FuneraireCarteEntete">
              <img src={Fcelogo} alt="FCE" />
              <div>
                <strong>FACTURE FUNÉRAIRE</strong>
                <p>Num : {numfacture || "—"} &nbsp; {dateDuJour}</p>
              </div>
            </div>

            <p><strong>Destination :</strong> {destination.nomdestination} - {zoneLibelle}</p>
            <p><strong>Défunt :</strong> {nomdefunt}</p>

            <div className="FuneraireTotaux">
              <p><span>Montant HT</span><strong>{formaterMontant(calcul.montantht)}</strong></p>
              <p><span>Piquire</span><strong>{formaterMontant(calcul.piquire)}</strong></p>
              <p><span>NET A PAYER</span><strong>{formaterMontant(calcul.montantttc)}</strong></p>
            </div>

            <p className="FuneraireArrete">
              Arrêtée la présente facture à la somme de {nombreEnLettres(calcul.montantttc)} ariary.
            </p>
          </div>

          <button
            type="button"
            className="FuneraireBouton"
            onClick={onEnregistrer}
            disabled={enregistrementEnCours}
          >
            Imprimer
          </button>
        </div>
      </div>

      <BarreNavigation onRetour={onRetour} onAnnuler={onAnnuler} />
    </div>
  );
}

export default FactureFuneraire;
