import React from "react";
import "./ProgressionPopup.css";
import BarreProgression from "../BarreProgression/BarreProgression";

// Fenêtre affichée pendant une opération longue (enregistrement, avant l'impression)
function ProgressionPopup({ titre, message, pourcentage }) {
  return (
    <div className="ProgressionFond">
      <div className="ProgressionBoite">
        <h3 className="ProgressionTitre">{titre}</h3>
        <p className="ProgressionMessage">{message}</p>
        <BarreProgression pourcentage={pourcentage} />
      </div>
    </div>
  );
}

export default ProgressionPopup;
