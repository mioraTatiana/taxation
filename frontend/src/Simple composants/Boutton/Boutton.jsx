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

const Boutton = ({ type, text, name, onClick, couleur, disabled }) => {
  const [texteDiseable, setTexteDiseable] = useState("");
  const [couleurBoutton, setCouleurBoutton] = useState(couleur);

  // Utilisation d'un useEffect pour gérer l'état disabled
  useEffect(() => {
    if (disabled) {
      setTexteDiseable("Veuillez remplir tous les champs");

      if (couleur === bleu) {
        setCouleurBoutton(bleuFonce); // Couleur pour le bouton désactivé
      } else if (couleur === vert) {
        setCouleurBoutton(vertFonce); // Si la couleur initiale est verte
      } else if (couleur === rouge) {
        setCouleurBoutton(rougeFonce); // Si la couleur initiale est rouge
      }
    } else {
      setTexteDiseable("");
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
      {disabled && (
        <div>
          <p className="texte">{texteDiseable}</p>
        </div>
      )}
    </div>
  );
};

export default Boutton;
