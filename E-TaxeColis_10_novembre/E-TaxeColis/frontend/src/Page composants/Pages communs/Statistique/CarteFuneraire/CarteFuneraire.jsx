import React from "react";
import "../CarteFacture/CarteFacture.css";
import { formaterMontant } from "../../../../Simple composants/Outils/calculsFacture";
import { PiedCarte } from "../CarteFacture/CarteFacture";

// Une facture funéraire dans la page Statistique (colonnes de la base, voir /statistique/funeraire)
// Même présentation que CarteFacture, avec une bande de couleur pour la reconnaître.
function CarteFuneraire({ facture }) {
  return (
    <div className="CarteFacture CarteFuneraire">
      <div className="CarteFactureEntete">
        <div>
          <p><strong>Destination :</strong> {facture.nomdestination} ({facture.libellezone})</p>
          <p><strong>Numéro :</strong> {facture.numfacturefuneraire}</p>
        </div>
        <div>
          <p><strong>Client :</strong> {facture.nomclient}</p>
          <p><strong>Défunt :</strong> {facture.nomdefunt}</p>
        </div>
      </div>

      <div className="CarteFactureBas">
        <div>
          <p><span>Transport funéraire</span><strong /></p>
        </div>
        <div>
          <p><span>MONTANT HT</span><strong>{formaterMontant(facture.montanthttfuneraire)}</strong></p>
          <p><span>Piquire</span><strong>{formaterMontant(facture.piquirefuneraire)}</strong></p>
          <p><span>TOTAL TTC</span><strong>{formaterMontant(facture.montantttcfunerare)}</strong></p>
        </div>
      </div>

      {/* Facture funéraire : pas de lignes à modifier, seulement "Enregistré par" */}
      <PiedCarte facture={facture} />
    </div>
  );
}

export default CarteFuneraire;
