import React from "react";
import "./FactureApercu.css";
import Fcelogo from "../../../Image/logo.png";
import { formaterMontant, nombreEnLettres } from "./calculsFacture";

function FactureApercu({
  client,
  destinationNom,
  zoneLibelle,
  typeTrain,
  lignes,
  totaux,
  numfacture,
  wagonComplet,
  dateFacture,
  onModifier,
  onSupprimer,
  texteAction,
  onAction,
  actionDesactivee,
}) {
  // Sans onModifier : facture affichée en lecture seule (pas de colonne Actions)
  const avecActions = Boolean(onModifier);
  const nbColonnes = (wagonComplet ? 4 : 6) + (avecActions ? 1 : 0);
  // dateFacture = "2026-02-12" (facture déjà enregistrée), sinon la date du jour
  const dateAffichee = dateFacture
    ? dateFacture.split("-").reverse().join("/")
    : new Date().toLocaleDateString("fr-FR");
  const prixWagon =
    totaux.poidsfacturetotal > 0 ? Math.round(totaux.montanthttotal / totaux.poidsfacturetotal) : 0;

  function designationAffichee(ligne) {
    return ligne.nomdefunt ? `${ligne.designation} – ${ligne.nomdefunt}` : ligne.designation;
  }

  return (
    <div className="FactureApercu">
      {/* Tout ce qui est dans FactureImpression est imprimé */}
      <div className="FactureImpression">
        <div className="FactureEntete">
          <div className="FactureLogo">
            <img src={Fcelogo} alt="FCE" />
            <span>FACTURE</span>
          </div>

          <div className="FactureInfos">
            <p><strong>Destination :</strong> {destinationNom} - {zoneLibelle}</p>
            <p><strong>Wagon :</strong> {typeTrain ? typeTrain.libelletrain : ""}</p>
            <p><strong>Client :</strong> {client.nomclient}</p>
            <p><strong>Tél :</strong> {client.telephone}</p>
            <p><strong>Adresse :</strong> {client.adresse}</p>
            <p><strong>Num :</strong> {numfacture || "—"} &nbsp; {dateAffichee}</p>
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
                {!wagonComplet && <th>PU</th>}
                {!wagonComplet && <th>Montant</th>}
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

              {lignes.map((ligne, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{ligne.nombrecolis}</td>
                  <td>{designationAffichee(ligne)}</td>
                  <td>{formaterMontant(ligne.poidsreel)}</td>
                  {!wagonComplet && <td>{formaterMontant(ligne.prixapplicable)}</td>}
                  {!wagonComplet && <td>{formaterMontant(ligne.montantht)}</td>}
                  {avecActions && (
                    <td className="NePasImprimer">
                      <div className="FactureLigneActions">
                        <button type="button" className="FactureBtnModifier" onClick={() => onModifier(index)}>
                          Modifier
                        </button>
                        <button type="button" className="FactureBtnSupprimer" onClick={() => onSupprimer(index)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {/* Wagon complet : le wagon est facturé une seule fois, sur son poids de facturation */}
              {wagonComplet && lignes.length > 0 && (
                <tr className="FactureLigneWagon">
                  <td colSpan={2}>Wagon complet ({typeTrain.libelletrain})</td>
                  <td colSpan={nbColonnes - 2}>
                    {formaterMontant(totaux.poidsfacturetotal)} kg × {formaterMontant(prixWagon)} Ar/kg ={" "}
                    {formaterMontant(totaux.montanthttotal)} Ar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="FactureBas">
          <div className="FactureResume">
            <p>N colis : {formaterMontant(totaux.nombrecolistotal)}</p>
            <p>Poids total : {formaterMontant(totaux.poidsreeltotal)} kg</p>
          </div>

          <div className="FactureTotaux">
            <p><span>TOTAL HT</span><strong>{formaterMontant(totaux.montanthttotal)}</strong></p>
            <p><span>TVA</span><strong>{formaterMontant(totaux.tva)}</strong></p>
            <p><span>Piquire</span><strong>{formaterMontant(totaux.piquire)}</strong></p>
            <p><span>NET A PAYER</span><strong>{formaterMontant(totaux.montantttc)}</strong></p>
          </div>
        </div>

        <p className="FactureArrete">
          Arrêtée la présente facture à la somme de {nombreEnLettres(totaux.montantttc)} ariary.
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
