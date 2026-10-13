
import React from "react";
import "./FiltreDates.css";

function FiltreDates({
  debut,
  fin,
  onChange,
  afficherTitre = true,
}) {
  // Modifier la date de début
  function changerDebut(e) {
    const nouvelleDate = e.target.value;

    if (nouvelleDate === "") {
      onChange({ debut: "", fin: "" });
      return;
    }

    // Conserver la date de fin seulement si elle est après
    // ou égale à la nouvelle date de début.
    onChange({
      debut: nouvelleDate,
      fin: fin !== "" && fin >= nouvelleDate ? fin : nouvelleDate,
    });
  }

  // Modifier la date de fin
  function changerFin(e) {
    const nouvelleDate = e.target.value;

    if (nouvelleDate === "") {
      onChange({ debut, fin: debut });
      return;
    }

    // La date de fin ne peut pas être antérieure au début.
    onChange({
      debut,
      fin: nouvelleDate < debut ? debut : nouvelleDate,
    });
  }

  function formaterDate(date) {
    if (!date) return "";

    const [annee, mois, jour] = date.split("-");
    return `${jour}-${mois}-${annee}`;
  }

  // Réinitialiser les dates
  function reinitialiser() {
    onChange({ debut: "", fin: "" });
  }

  return (
    <div className="FiltreDates">
      {afficherTitre && (
        <p className="FiltreDatesTitre">Filtrer par période</p>
      )}

      <div className="FiltreDatesCalendrier">
        <div className="FiltreDatesCalendrierChamps">
          <div>
            <label htmlFor="dateDebut">Date de début</label>
            <input
              id="dateDebut"
              type="date"
              value={debut}
              max={fin || undefined}
              onChange={changerDebut}
            />
          </div>

          <div>
            <label htmlFor="dateFin">Date de fin</label>
            <input
              id="dateFin"
              type="date"
              value={fin}
              min={debut || undefined}
              disabled={debut === ""}
              onChange={changerFin}
            />
          </div>
        </div>

        <div className="FiltreDatesActions">
          <p className="FiltreDatesCalendrierInfo">
            {debut === ""
              ? "Choisissez une date de début pour commencer."
              : `Période sélectionnée : du ${formaterDate(debut)} au ${formaterDate(fin || debut)}`}
          </p>

          {debut !== "" && (
            <button
              type="button"
              className="FiltreDatesReinitialiser"
              onClick={reinitialiser}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FiltreDates;
