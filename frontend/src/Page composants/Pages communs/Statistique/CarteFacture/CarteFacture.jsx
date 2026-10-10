import React from "react";
import "./CarteFacture.css";
import { formaterMontant } from "../../../../Simple composants/Outils/calculsFacture";

// Une facture affichée comme dans la maquette Statistique
function CarteFacture({ facture }) {
  return (
    <div className="CarteFacture">
      <div className="CarteFactureEntete">
        <div>
          <p><strong>Zone :</strong> {facture.destinationNom} ({facture.zoneLibelle})</p>
          <p><strong>Numéro :</strong> {facture.numfacture}</p>
        </div>
        <div>
          <p><strong>Client :</strong> {facture.clientNom}</p>
          <p><strong>Wagon :</strong> {facture.wagon}</p>
        </div>
      </div>

      <div className="CarteFactureDefilement">
        <table className="CarteFactureTable">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Qt</th>
              <th>Poids</th>
              <th>Pu</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {facture.details.map((ligne) => (
              <tr key={ligne.iddetailfacture}>
                <td>{ligne.designation}</td>
                <td>{ligne.nombrecolis}</td>
                <td>{formaterMontant(ligne.poidsreel)}</td>
                <td>{formaterMontant(ligne.prixapplicable)}</td>
                <td>{formaterMontant(ligne.montantht)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="CarteFactureBas">
        <div>
          <p><span>Nombre de colis</span><strong>{formaterMontant(facture.nombrecolistotal)}</strong></p>
          <p><span>Total des poids en kg</span><strong>{formaterMontant(facture.poidsreeltotal)}</strong></p>
        </div>
        <div>
          <p><span>TOTAL HT</span><strong>{formaterMontant(facture.montanthttotal)}</strong></p>
          <p><span>TVA</span><strong>{formaterMontant(facture.tva)}</strong></p>
          <p><span>Piquire</span><strong>{formaterMontant(facture.piquire)}</strong></p>
          <p><span>TOTAL TTC</span><strong>{formaterMontant(facture.montantttc)}</strong></p>
        </div>
      </div>
    </div>
  );
}

export default CarteFacture;
