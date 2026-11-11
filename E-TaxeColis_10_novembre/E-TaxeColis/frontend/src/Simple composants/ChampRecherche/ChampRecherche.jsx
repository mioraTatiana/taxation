import React from "react";
import { Search, X } from "lucide-react";
import "./ChampRecherche.css";

// Champ de recherche réutilisable (pages Client, Utilisateur...).
//  valeur / onChange(texte) : le texte cherché
//  placeholder : ex "Rechercher par nom..."
function ChampRecherche({ valeur, onChange, placeholder = "Rechercher..." }) {
  return (
    <div className="ChampRecherche">
      <Search size={18} className="ChampRechercheIcone" />
      <input
        type="text"
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {valeur && (
        <button type="button" title="Effacer" onClick={() => onChange("")}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Recherche "contient" sans tenir compte des majuscules ni des accents (comme %nom% en SQL)
export function contient(texte, recherche) {
  const normaliser = (v) =>
    String(v || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  return normaliser(texte).includes(normaliser(recherche));
}

export default ChampRecherche;
