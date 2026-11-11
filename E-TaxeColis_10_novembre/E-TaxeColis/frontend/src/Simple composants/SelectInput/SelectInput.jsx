import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import "./SelectInput.css";

function SelectInput({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = "Sélectionner une option",
  searchPlaceholder = "Rechercher...",
  error,
  disabled = false,
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const conteneurRef = useRef(null);
  const rechercheRef = useRef(null);

  // Option actuellement sélectionnée (affichée dans le champ)
  const optionSelectionnee = options.find((option) => option.value === value);

  // Filtre sur le titre et la description
  const optionsFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return options;
    return options.filter((option) =>
      `${option.label} ${option.description || ""}`
        .toLowerCase()
        .includes(terme)
    );
  }, [options, recherche]);

  function ouvrir() {
    if (!disabled) setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    setRecherche("");
    if (onBlur) onBlur();
  }

  function basculer() {
    if (ouvert) {
      fermer();
    } else {
      ouvrir();
    }
  }

  function choisir(option) {
    onChange(option.value);
    fermer();
  }

  function gererTouche(e) {
    if (e.key === "Escape") fermer();
  }

  // Fermeture au clic en dehors du composant
  useEffect(() => {
    function clicExterieur(e) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target)) {
        fermer();
      }
    }
    if (ouvert) {
      document.addEventListener("mousedown", clicExterieur);
    }
    return () => document.removeEventListener("mousedown", clicExterieur);
  }, [ouvert]);

  // Focus automatique sur la recherche à l'ouverture
  useEffect(() => {
    if (ouvert && rechercheRef.current) rechercheRef.current.focus();
  }, [ouvert]);

  return (
    <div
      className="InputDiv SelectDiv"
      ref={conteneurRef}
      onKeyDown={gererTouche}
    >
      <label htmlFor={name} className="labelInput">
        {label}
      </label>

      <button
        id={name}
        name={name}
        type="button"
        className={`selectDeclencheur ${error ? "selectErreur" : ""}`}
        onClick={basculer}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
      >
        <span
          className={optionSelectionnee ? "selectValeur" : "selectPlaceholder"}
        >
          {optionSelectionnee ? optionSelectionnee.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`selectChevron ${ouvert ? "selectChevronOuvert" : ""}`}
        />
      </button>

      {ouvert && (
        <div className="selectMenu">
          <div className="selectRecherche">
            <Search size={16} className="selectRechercheIcone" />
            <input
              ref={rechercheRef}
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={searchPlaceholder}
              className="selectRechercheInput"
            />
          </div>

          <div className="selectListe" role="listbox">
            {optionsFiltrees.length === 0 && (
              <div className="selectVide">Aucun résultat</div>
            )}

            {optionsFiltrees.map((option) => {
              const estSelectionnee = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={estSelectionnee}
                  className={`selectOption ${
                    estSelectionnee ? "selectOptionActive" : ""
                  }`}
                  onClick={() => choisir(option)}
                >
                  <span className="selectOptionTexte">
                    <span className="selectOptionTitre">{option.label}</span>
                    {option.description && (
                      <span className="selectOptionDescription">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {estSelectionnee && (
                    <Check size={18} className="selectOptionCheck" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectInput;