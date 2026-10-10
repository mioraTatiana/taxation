import React, { useState } from "react";
import "./ChampSuggestions.css";

// Champ de saisie avec liste de suggestions (ex: téléphone -> clients déjà enregistrés).
//  suggestions : [{ cle, titre, description }]
//  onSelectionner(cle) : appelé quand on clique sur une suggestion
//  erreur : message rouge affiché sous le champ
// Utilise les classes de votre Input.css (InputDiv, labelInput, inputCom)
function ChampSuggestions({
  label,
  name,
  value,
  onChange,
  suggestions = [],
  onSelectionner,
  erreur,
  placeholder,
}) {
  const [ouvert, setOuvert] = useState(false);

  function choisir(suggestion) {
    onSelectionner(suggestion.cle);
    setOuvert(false);
  }

  function saisir(e) {
    onChange(e.target.value);
    setOuvert(true);
  }

  return (
    <div className="InputDiv ChampSuggestions">
      <label htmlFor={name} className="labelInput">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="text"
        autoComplete="off"
        className="inputCom"
        value={value}
        placeholder={placeholder}
        onChange={saisir}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
      />

      {ouvert && suggestions.length > 0 && (
        <div className="suggestionsListe">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.cle}
              type="button"
              className="suggestionItem"
              onMouseDown={(e) => {
                e.preventDefault(); // garde le champ actif pendant le clic
                choisir(suggestion);
              }}
            >
              <span className="suggestionTitre">{suggestion.titre}</span>
              <span className="suggestionDescription">{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}

      {erreur && <p className="champSuggestionsErreur">{erreur}</p>}
    </div>
  );
}

export default ChampSuggestions;
