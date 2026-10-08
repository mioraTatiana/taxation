import React from "react";
import "./TableDonnees.css";

// Table réutilisable.
//  colonnes : [{ titre: "Nom", cle: "nomutilisateur" }]
//  donnees  : liste d'objets
//  cleLigne : nom du champ unique (ex: "iduser")
//  actions  : fonction(ligne) qui retourne 0, 1 ou 2 boutons :
//             [{ texte: "Ajouter", couleur: vert, onClick: function }]
function TableDonnees({ colonnes, donnees, cleLigne, actions, messageVide }) {
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
            <td colSpan={colonnes.length + 1} className="TableVide">
              {messageVide || "Aucune donnée"}
            </td>
          </tr>
        )}

        {donnees.map((ligne) => (
          <tr key={ligne[cleLigne]}>
            {colonnes.map((colonne) => (
              <td key={colonne.cle}>
                {colonne.afficher
                  ? colonne.afficher(ligne[colonne.cle])
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