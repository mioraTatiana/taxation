import React from "react";
import "./FactureApercu.css";
import Fcelogo from "../../../../Image/logo.png";
import { formaterMontant, nombreEnLettres, complementMinimum } from "../../../../Simple composants/Outils/calculsFacture";
import { formaterDate } from "../../../../Simple composants/Outils/calculsStats";

// Facture marchandise affichée à l'écran.
// Utilisée par la page Facture (lecture seule) et par Nouvelle facture (avec Modifier / Supprimer).
//
//  facture : colonnes de la base (voir backend facturemarchandise /complet) :
//            numfacturemarchandise, datefacturemarchandise, nomclient, telephone, adresse,
//            nomdestination, libellezone, libelletypewagon, modefacturation,
//            details (lignes), nombrecolistotal, poidsreeltotal, poidsfacturetotal,
//            montanthttotal, tva, piquiremarchandise, montantttc
//  onModifier(idmarchandise) / onSupprimer(idmarchandise) : facultatifs (boutons de ligne)
//  texteAction / onAction : bouton du bas (ex: "Imprimer")
//
// Wagon complet : la 1re ligne (sans marchandise) est la ligne du wagon, la seule imprimée.
function FactureApercu({ facture, onModifier, onSupprimer, texteAction, onAction, actionDesactivee }) {
  const avecActions = Boolean(onModifier);
  const nbColonnes = 7 + (avecActions ? 1 : 0);
  const lignes = facture.details || [];
  const complement = complementMinimum(facture);

  // Date de la facture enregistrée, sinon la date du jour
  const dateAffichee = facture.datefacturemarchandise
    ? formaterDate(facture.datefacturemarchandise)
    : new Date().toLocaleDateString("fr-FR");

  return (
    <div className="FactureApercu">
      <div className="FactureImpression">
        <div className="FactureEntete">
          <div className="FactureLogo">
            <img src={Fcelogo} alt="FCE" />
            <span>FACTURE</span>
          </div>

          <div className="FactureInfos">
            <p><strong>Destination :</strong> {facture.nomdestination} - {facture.libellezone}</p>
            <p><strong>Wagon :</strong> {facture.libelletypewagon}</p>
            <p><strong>Client :</strong> {facture.nomclient}</p>
            <p><strong>Tél :</strong> {facture.telephone}</p>
            <p><strong>Adresse :</strong> {facture.adresse}</p>
            <p><strong>Num :</strong> {facture.numfacturemarchandise || "—"} &nbsp; {dateAffichee}</p>
          </div>
        </div>

        <div className="FactureTableauDefilement">
          <table className="FactureTableau">
            <thead>
              <tr>
                <th>N</th>
                <th>Qt</th>
                <th>Désignation</th>
                <th>Poids réel</th>
                <th>Poids facturé</th>
                <th>PU</th>
                <th>Montant</th>
                {avecActions && <th className="NePasImprimer">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={nbColonnes} className="FactureVide">
                    Aucune marchandise ajoutée
                  </td>
                </tr>
              )}

              {lignes.map((ligne, index) => {
                const ligneWagon = facture.modefacturation && !ligne.idmarchandise;

                return (
                  <tr key={ligne.idmarchandise || `wagon-${index}`} className={ligneWagon ? "FactureLigneWagon" : ""}>
                    <td>{index + 1}</td>
                    <td>{formaterMontant(ligne.nombrecolis)}</td>
                    <td>{ligne.designation}</td>
                    <td>{formaterMontant(ligne.poidsreel)}</td>
                    <td>{formaterMontant(ligne.poidsfacture)}</td>
                    <td>{formaterMontant(ligne.prixapplicable)}</td>
                    <td>{formaterMontant(ligne.montantht)}</td>
                    {avecActions && (
                      <td className="NePasImprimer">
                        {/* La ligne du wagon est calculée toute seule : pas de bouton */}
                        {!ligneWagon && (
                          <div className="FactureLigneActions">
                            <button type="button" className="FactureBtnModifier" onClick={() => onModifier(ligne.idmarchandise)}>
                              Modifier
                            </button>
                            <button type="button" className="FactureBtnSupprimer" onClick={() => onSupprimer(ligne.idmarchandise)}>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Express sous 20 kg : le client paie quand même 20 kg */}
              {complement && (
                <tr className="FactureLigneWagon">
                  <td colSpan={4}>Complément minimum 20 kg</td>
                  <td>{formaterMontant(complement.poids)}</td>
                  <td />
                  <td>{formaterMontant(complement.montant)}</td>
                  {avecActions && <td className="NePasImprimer" />}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="FactureBas">
          <div className="FactureResume">
            <p>N colis : {formaterMontant(facture.nombrecolistotal)}</p>
            <p>Poids réel : {formaterMontant(facture.poidsreeltotal)} kg</p>
            <p>Poids facturé : {formaterMontant(facture.poidsfacturetotal)} kg</p>
          </div>

          <div className="FactureTotaux">
            <p><span>TOTAL HT</span><strong>{formaterMontant(facture.montanthttotal)}</strong></p>
            <p><span>TVA</span><strong>{formaterMontant(facture.tva)}</strong></p>
            <p><span>Piquire</span><strong>{formaterMontant(facture.piquiremarchandise)}</strong></p>
            <p><span>NET A PAYER</span><strong>{formaterMontant(facture.montantttc)}</strong></p>
          </div>
        </div>

        <p className="FactureArrete">
          Arrêtée la présente facture à la somme de {nombreEnLettres(facture.montantttc)} ariary.
        </p>
      </div>

      {texteAction && (
        <button
          type="button"
          className="FactureBtnAction NePasImprimer"
          onClick={onAction}
          disabled={actionDesactivee}
        >
          {texteAction}
        </button>
      )}
    </div>
  );
}

export default FactureApercu;
