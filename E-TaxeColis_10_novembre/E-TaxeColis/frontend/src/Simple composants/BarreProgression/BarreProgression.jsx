import React from "react";
import "./BarreProgression.css";

// Barre de progression avec pourcentage (0 à 100)
function BarreProgression({ pourcentage, afficherTexte = true }) {
  const valeur = Math.max(0, Math.min(100, Math.round(pourcentage)));

  return (
    <div className="BarreProgression">
      <div className="BarreProgressionPiste">
        <div className="BarreProgressionRemplie" style={{ width: `${valeur}%` }} />
      </div>
      {afficherTexte && <span className="BarreProgressionTexte">{valeur} %</span>}
    </div>
  );
}

export default BarreProgression;
