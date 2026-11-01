import React from "react";
import { Flower2 } from "lucide-react";
import "./FactureFuneraire.css";
import CustomInput from "../../../../Simple composants/Input/Input";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";
import ApercuFuneraire from "../../TransportFuneraire/ApercuFuneraire/ApercuFuneraire";
import { formaterMontant } from "../../../../Simple composants/Outils/calculsFacture";

// Section 3 du transport funéraire : une seule facture, sans lignes de marchandises.
//  Tarif      = prixzone de la table tariffuneraire (zone de la destination)
//  Prix fixe  = prixfixe de la table tariffuneraire
//  Montant HT = prix fixe x tarif ; Montant TTC = HT + piquire, arrondi. Pas de TVA.
function FactureFuneraire({
  tarif,
  facture,
  enregistrementEnCours,
  onChangeNomDefunt,
  onRetour,
  onAnnuler,
  onEnregistrer,
}) {
  return (
    <div>
      <EnteteSection
        icone={Flower2}
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
            value={facture.nomdefunt}
            onChange={(e) => onChangeNomDefunt(e.target.value)}
          />
          <CustomInput
            type="text"
            label="Tarif"
            name="prixzone"
            value={tarif ? `${formaterMontant(facture.prixzone)} Ar` : ""}
            readOnly
          />
          {!tarif && (
            <p className="FuneraireErreur">
              Aucun tarif funéraire pour la zone de cette destination : ajoutez-le dans la page Tarif funéraire.
            </p>
          )}
          <CustomInput
            type="text"
            label="Prix fixe"
            name="prixfixe"
            value={tarif ? formaterMontant(facture.prixfixe) : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Montant HT (= Prix fixe × tarif)"
            name="montanthttfuneraire"
            value={tarif ? `${formaterMontant(facture.montanthttfuneraire)} Ar` : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Piquire"
            name="piquirefuneraire"
            value={tarif ? `${formaterMontant(facture.piquirefuneraire)} Ar` : ""}
            readOnly
          />
          <CustomInput
            type="text"
            label="Montant TTC (= HT + piquire, arrondi)"
            name="montantttcfunerare"
            value={tarif ? `${formaterMontant(facture.montantttcfunerare)} Ar` : ""}
            readOnly
          />
        </div>

        {/* ===== Aperçu de la facture ===== */}
        <div className="FuneraireApercu">
          <ApercuFuneraire
            facture={facture}
            texteAction={enregistrementEnCours ? "Enregistrement..." : "Enregistrer et imprimer"}
            onAction={onEnregistrer}
            actionDesactivee={enregistrementEnCours || !tarif}
          />
        </div>
      </div>

      <BarreNavigation onRetour={onRetour} onAnnuler={onAnnuler} />
    </div>
  );
}

export default FactureFuneraire;
