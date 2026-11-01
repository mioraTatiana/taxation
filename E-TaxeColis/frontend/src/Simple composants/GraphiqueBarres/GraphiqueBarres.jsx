import React from "react";
import "./GraphiqueBarres.css";

// Barres horizontales faites avec des div (sans bibliothèque)
//  donnees = [{ libelle: "Zone 1", valeur: 120000 }]
//  format  = fonction qui écrit la valeur (ex: formaterMontant)
function GraphiqueBarres({ donnees, format, unite = "" }) {
  const maximum = Math.max(1, ...donnees.map((ligne) => ligne.valeur));

  if (donnees.length === 0) {
    return <p className="GraphiqueVide">Aucune donnée pour cette période</p>;
  }

  return (
    <div className="GraphiqueBarres">
      {donnees.map((ligne) => (
        <div key={ligne.libelle} className="GraphiqueLigne">
          <span className="GraphiqueLibelle">{ligne.libelle}</span>
          <div className="GraphiquePiste">
            <div
              className="GraphiqueBarre"
              style={{ width: `${(ligne.valeur / maximum) * 100}%` }}
            />
          </div>
          <span className="GraphiqueValeur">
            {format ? format(ligne.valeur) : ligne.valeur} {unite}
          </span>
        </div>
      ))}
    </div>
  );
}

export default GraphiqueBarres;
