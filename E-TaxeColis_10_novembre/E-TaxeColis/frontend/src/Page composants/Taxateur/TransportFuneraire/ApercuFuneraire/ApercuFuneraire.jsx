import React from "react";
import "./ApercuFuneraire.css";
import Fcelogo from "../../../../Image/logo.png";
import { formaterMontant, nombreEnLettres } from "../../../../Simple composants/Outils/calculsFacture";
import { formaterDate } from "../../../../Simple composants/Outils/calculsStats";

// Facture funéraire affichée à l'écran.
// Utilisée par Nouvelle facture (transport funéraire) et par la page Transport funéraire.
//  facture : colonnes de la table facturefuneraire + nomclient, telephone, adresse, nomdestination, libellezone
//            (+ prixfixe et prixzone, connus seulement pendant la création de la facture)
function ApercuFuneraire({ facture, texteAction, onAction, actionDesactivee }) {
  const dateAffichee = facture.datefacturefuneraire
    ? formaterDate(facture.datefacturefuneraire)
    : new Date().toLocaleDateString("fr-FR");
  const tarifConnu = facture.prixfixe !== undefined && facture.prixzone !== undefined;

  return (
    <div>
      <div className="FuneraireCarte">
        <div className="FuneraireCarteEntete">
          <img src={Fcelogo} alt="FCE" />
          <div>
            <strong>FACTURE FUNÉRAIRE</strong>
            <p>Num : {facture.numfacturefuneraire || "—"} &nbsp; {dateAffichee}</p>
          </div>
        </div>

        <p><strong>Destination :</strong> {facture.nomdestination} - {facture.libellezone}</p>
        <p><strong>Client :</strong> {facture.nomclient}</p>
        <p><strong>Tél :</strong> {facture.telephone}</p>
        <p><strong>Adresse :</strong> {facture.adresse}</p>
        <p><strong>Défunt :</strong> {facture.nomdefunt}</p>

        <div className="FuneraireTotaux">
          {tarifConnu && (
            <p>
              <span>Prix fixe × tarif</span>
              <strong>
                {formaterMontant(facture.prixfixe)} × {formaterMontant(facture.prixzone)}
              </strong>
            </p>
          )}
          <p><span>Montant HT</span><strong>{formaterMontant(facture.montanthttfuneraire)}</strong></p>
          <p><span>Piquire</span><strong>{formaterMontant(facture.piquirefuneraire)}</strong></p>
          <p><span>NET A PAYER</span><strong>{formaterMontant(facture.montantttcfunerare)}</strong></p>
        </div>

        <p className="FuneraireArrete">
          Arrêtée la présente facture à la somme de {nombreEnLettres(facture.montantttcfunerare)} ariary.
        </p>
      </div>

      {texteAction && (
        <button type="button" className="FuneraireBouton" onClick={onAction} disabled={actionDesactivee}>
          {texteAction}
        </button>
      )}
    </div>
  );
}

export default ApercuFuneraire;
