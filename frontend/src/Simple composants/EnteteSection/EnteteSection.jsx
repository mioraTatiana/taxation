import React from "react";
import "./EnteteSection.css";

// Petit en-tête d'une section : icône dans un carré bleu + titre + sous-titre
function EnteteSection({ icone: Icone, titre, sousTitre }) {
  return (
    <div className="EnteteSection">
      <div className="EnteteSectionIcone">
        <Icone size={26} />
      </div>
      <div>
        <h3 className="EnteteSectionTitre">{titre}</h3>
        <p className="EnteteSectionSousTitre">{sousTitre}</p>
      </div>
    </div>
  );
}

export default EnteteSection;
