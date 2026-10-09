import React from "react";
import { Plus } from "lucide-react";
import "./BouttonNouveau.css";
import { bleu } from "../Couleurs/couleur";

// Bouton bleu placé en haut à gauche de chaque page CRUD
function BouttonNouveau({ texte, onClick }) {
  return (
    <div className="BouttonNouveauBarre">
      <button
        type="button"
        className="BouttonNouveau"
        style={{ backgroundColor: bleu }}
        onClick={onClick}
      >
        <Plus size={16} />
        {texte}
      </button>
    </div>
  );
}

export default BouttonNouveau;
