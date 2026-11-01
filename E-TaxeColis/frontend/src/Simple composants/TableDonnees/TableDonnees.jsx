
import React from "react";
import "./TableDonnees.css";

// Table réutilisable
function TableDonnees({
  colonnes,
  donnees,
  cleLigne,
  actions,
  messageVide,
}) {
  const avecActions = Boolean(actions);

  return (
    <div className="TableDefilement">
      <table className="Table">
        <thead>
          <tr>
            {colonnes.map((colonne) => (
              <th key={colonne.cle}>{colonne.titre}</th>
            ))}
            {avecActions && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {donnees.length === 0 && (
            <tr>
              <td
                colSpan={colonnes.length + (avecActions ? 1 : 0)}
                className="TableVide"
              >
                {messageVide || "Aucune donnée"}
              </td>
            </tr>
          )}

          {donnees.map((ligne) => (
            <tr key={ligne[cleLigne]}>
              {colonnes.map((colonne) => (
                <td key={colonne.cle}>
                  {colonne.afficher
                    ? colonne.afficher(ligne[colonne.cle], ligne)
                    : ligne[colonne.cle]}
                </td>
              ))}

              {avecActions && (
                <td>
                  <div className="TableActions">
                    {actions(ligne).map((bouton) => (
                      <button
                        key={bouton.texte}
                        type="button"
                        className="TableBouton"
                        style={{ backgroundColor: bouton.couleur }}
                        onClick={bouton.onClick}
                      >
                        {bouton.texte}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableDonnees;
