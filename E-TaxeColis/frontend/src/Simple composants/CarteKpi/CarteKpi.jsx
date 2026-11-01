import React from "react";
import "./CarteKpi.css";

// Carte d'un indicateur : icône, titre, grande valeur et petite note
function CarteKpi({ icone: Icone, titre, valeur, note }) {
  return (
    <div className="CarteKpi">
      <div className="CarteKpiIcone">
        <Icone size={22} />
      </div>
      <div className="CarteKpiTexte">
        <span className="CarteKpiTitre">{titre}</span>
        <strong className="CarteKpiValeur">{valeur}</strong>
        {note && <span className="CarteKpiNote">{note}</span>}
      </div>
    </div>
  );
}

export default CarteKpi;
