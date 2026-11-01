import React from "react";
import "./CarteFacture.css";
import { formaterMontant, complementMinimum } from "../../../../Simple composants/Outils/calculsFacture";

// Une facture marchandise dans la page Statistique (colonnes de la base, voir /statistique/marchandise)
function CarteFacture({ facture }) {
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
            {facture.details.map((ligne) => (
              <tr key={ligne.iddetailfacture}>
                {/* Wagon complet : la ligne sans marchandise est la ligne du wagon */}
                <td>{ligne.idmarchandise ? ligne.designation : <strong>{ligne.designation} (wagon)</strong>}</td>
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
    </div>
  );
}

export default CarteFacture;
