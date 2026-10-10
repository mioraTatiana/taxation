import React from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import "./BarreNavigation.css";

// Boutons du bas : flèche retour (à gauche), Annuler et Suivant (à droite).
// Une action absente = bouton non affiché (ex: pas de Suivant dans "Colis à expédier").
function BarreNavigation({ onRetour, onAnnuler, onSuivant, texteSuivant = "Suivant" }) {
  return (
    <div className="BarreNavigation">
      <div>
        {onRetour && (
          <button type="button" className="NavRetour" onClick={onRetour} aria-label="Retour">
            <ArrowLeft size={18} />
          </button>
        )}
      </div>

      <div className="NavDroite">
        {onAnnuler && (
          <button type="button" className="NavAnnuler" onClick={onAnnuler}>
            Annuler
            <X size={16} />
          </button>
        )}
        {onSuivant && (
          <button type="button" className="NavSuivant" onClick={onSuivant}>
            {texteSuivant}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default BarreNavigation;
