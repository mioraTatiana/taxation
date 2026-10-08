import React, { useState, useEffect } from "react";
import "./Boutton.css";
import {
  bleu,
  vert,
  rouge,
  vertFonce,
  bleuFonce,
  rougeFonce,
} from "../Couleurs/couleur";

function Boutton({ type, text, name, onClick, couleur, disabled }) {
  const [texteDisable, setTexteDisable] = useState("");
  const [couleurBoutton, setCouleurBoutton] = useState(couleur);

  // Gère l'état désactivé : message + couleur foncée
  useEffect(() => {
    if (disabled) {
      setTexteDisable("Veuillez remplir tous les champs");

      if (couleur === bleu) {
        setCouleurBoutton(bleuFonce);
      } else if (couleur === vert) {
        setCouleurBoutton(vertFonce);
      } else if (couleur === rouge) {
        setCouleurBoutton(rougeFonce);
      }
    } else {
      setTexteDisable("");
      setCouleurBoutton(couleur);
    }
  }, [disabled, couleur]);

  return (
    <div className="BouttonDiv">
      <button
        type={type}
        onClick={onClick}
        name={name}
        className="boutton"
        style={{ backgroundColor: couleurBoutton }}
        disabled={disabled}
      >
        {text}
      </button>

      {disabled && <p className="texte">{texteDisable}</p>}
    </div>
  );
}

export default Boutton;
