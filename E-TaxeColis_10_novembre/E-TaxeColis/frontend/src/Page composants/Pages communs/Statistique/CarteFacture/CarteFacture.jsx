import React from "react";
import "./CarteFacture.css";
import { formaterMontant, complementMinimum, estLigneWagon } from "../../../../Simple composants/Outils/calculsFacture";

// Une facture marchandise dans la page Statistique (colonnes de la base, voir /statistique/marchandise)
//  onModifier : facultatif (chef de division et receveur) -> bouton "Modifier" en bas de la carte
function CarteFacture({ facture, onModifier }) {
  const complement = complementMinimum(facture);

  return (
    <div className="CarteFacture">
      <div className="CarteFactureEntete">
        <div>
          <p><strong>Destination :</strong> {facture.nomdestination} ({facture.libellezone})</p>
          <p><strong>Numéro :</strong> {facture.numfacturemarchandise}</p>
        </div>
        <div>
          <p><strong>Client :</strong> {facture.nomclient}</p>
          <p><strong>Wagon :</strong> {facture.libelletypewagon}</p>
        </div>
      </div>

      <div className="CarteFactureDefilement">
        <table className="CarteFactureTable">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Qt</th>
              <th>Poids réel</th>
              <th>Poids facturé</th>
              <th>Pu</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {facture.details.map((ligne, index) => (
              <tr key={ligne.iddetailfacture}>
                {/* Wagon complet : la 1re ligne est la ligne du wagon */}
                <td>{estLigneWagon(facture, index) ? <strong>{ligne.designation} (wagon)</strong> : ligne.designation}</td>
                <td>{formaterMontant(ligne.nombrecolis)}</td>
                <td>{formaterMontant(ligne.poidsreel)}</td>
                <td>{formaterMontant(ligne.poidsfacture)}</td>
                <td>{formaterMontant(ligne.prixapplicable)}</td>
                <td>{formaterMontant(ligne.montantht)}</td>
              </tr>
            ))}
            {complement && (
              <tr>
                <td>Complément minimum 20 kg</td>
                <td />
                <td />
                <td>{formaterMontant(complement.poids)}</td>
                <td />
                <td>{formaterMontant(complement.montant)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="CarteFactureBas">
        <div>
          <p><span>Nombre de colis</span><strong>{formaterMontant(facture.nombrecolistotal)}</strong></p>
          <p><span>Poids réel en kg</span><strong>{formaterMontant(facture.poidsreeltotal)}</strong></p>
          <p><span>Poids facturé en kg</span><strong>{formaterMontant(facture.poidsfacturetotal)}</strong></p>
        </div>
        <div>
          <p><span>TOTAL HT</span><strong>{formaterMontant(facture.montanthttotal)}</strong></p>
          <p><span>TVA</span><strong>{formaterMontant(facture.tva)}</strong></p>
          <p><span>Piquire</span><strong>{formaterMontant(facture.piquiremarchandise)}</strong></p>
          <p><span>TOTAL TTC</span><strong>{formaterMontant(facture.montantttc)}</strong></p>
        </div>
      </div>

      <PiedCarte facture={facture} onModifier={onModifier} />
    </div>
  );
}

// Bas de la carte, centré : bouton "Modifier" (si permis) puis "Enregistré par : nom"
export function PiedCarte({ facture, onModifier }) {
  return (
    <div className="CarteFacturePied">
      {onModifier && (
        <button type="button" className="CarteFactureModifier" onClick={() => onModifier(facture)}>
          Modifier
        </button>
      )}
      <p>
        Enregistré par : <strong>{facture.nomutilisateur || "-"}</strong>
      </p>
    </div>
  );
}

export default CarteFacture;
