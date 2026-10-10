import React from "react";
import "./FiltreDates.css";

// Filtre "Date début / Date fin" avec les règles :
//  - pas de date de fin sans date de début (le champ est désactivé)
//  - choisir une date de début remplit la date de fin avec la même date
//  - la date de fin ne peut pas être avant la date de début
// Utilise les classes de votre Input.css (InputDiv, labelInput, inputCom)
function FiltreDates({ debut, fin, onChange, afficherTitre = true, vertical = false }) {
  function changerDebut(e) {
    const valeur = e.target.value;

    if (valeur === "") {
      onChange({ debut: "", fin: "" }); // sans début, pas de fin
      return;
    }
    // La fin devient égale au début (sauf si une fin valide existe déjà)
    onChange({ debut: valeur, fin: fin === "" || fin < valeur ? valeur : fin });
  }

  function changerFin(e) {
    const valeur = e.target.value;
    onChange({ debut, fin: valeur === "" || valeur < debut ? debut : valeur });
  }

  function reinitialiser() {
    onChange({ debut: "", fin: "" });
  }

  return (
    <div className="FiltreDates">
      {afficherTitre && <p className="FiltreDatesTitre">Filtre</p>}

      <div className={vertical ? "FiltreDatesChamps FiltreDatesVertical" : "FiltreDatesChamps"}>
        <div className="InputDiv FiltreDatesChamp">
          <label htmlFor="dateDebut" className="labelInput">
            Date début
          </label>
          <input
            id="dateDebut"
            type="date"
            className="inputCom"
            value={debut}
            onChange={changerDebut}
          />
        </div>

        <div className="InputDiv FiltreDatesChamp">
          <label htmlFor="dateFin" className="labelInput">
            Date fin
          </label>
          <input
            id="dateFin"
            type="date"
            className="inputCom"
            value={fin}
            min={debut}
            disabled={debut === ""}
            onChange={changerFin}
          />
        </div>

        {debut !== "" && (
          <button type="button" className="FiltreDatesReinitialiser" onClick={reinitialiser}>
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

export default FiltreDates;
