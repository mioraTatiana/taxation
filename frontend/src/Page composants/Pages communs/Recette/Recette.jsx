import React, { useState } from "react";
import "./Recette.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import { useFactures } from "../../../Simple composants/Outils/useFactures";
import { grouperRecettes, formaterDate } from "../../../Simple composants/Outils//calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils//calculsFacture";

function Recette() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const { factures, chargement } = useFactures(periode);

  // mois -> jours -> zones, avec la recette et le poids transporté à chaque niveau
  const mois = grouperRecettes(factures);

  return (
    <div>
      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      {chargement && <p className="RecetteMessage">Chargement...</p>}
      {!chargement && mois.length === 0 && (
        <p className="RecetteMessage">Aucune recette pour cette période</p>
      )}

      {mois.length > 0 && (
        <div className="RecetteEnteteColonnes">
          <span className="RecetteColLibelle" />
          <span className="RecetteColValeur">Recette</span>
          <span className="RecetteColValeur">Poids transporté</span>
        </div>
      )}

      {mois.map((m) => (
        <div key={m.cle} className="RecetteMois">
          {/* Mois : total de la recette et du poids */}
          <div className="RecetteLigne RecetteLigneMois">
            <span className="RecetteColLibelle">{m.libelle}</span>
            <span className="RecetteColValeur">{formaterMontant(m.recette)} Ar</span>
            <span className="RecetteColValeur">{formaterMontant(m.poids)} kg</span>
          </div>

          {m.jours.map((jour) => (
            <div key={jour.date} className="RecetteJour">
              {/* Date : total du jour */}
              <div className="RecetteLigne RecetteLigneJour">
                <span className="RecetteColLibelle">{formaterDate(jour.date)}</span>
                <span className="RecetteColValeur">{formaterMontant(jour.recette)} Ar</span>
                <span className="RecetteColValeur">{formaterMontant(jour.poids)} kg</span>
              </div>

              {/* Zones : recette et poids de chaque zone ce jour-là */}
              {jour.zones.map((zone) => (
                <div key={zone.zone} className="RecetteLigne RecetteLigneZone">
                  <span className="RecetteColLibelle">{zone.zone}</span>
                  <span className="RecetteColValeur">{formaterMontant(zone.recette)} Ar</span>
                  <span className="RecetteColValeur">{formaterMontant(zone.poids)} kg</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Recette;
