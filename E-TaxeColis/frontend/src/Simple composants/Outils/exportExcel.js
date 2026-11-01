import * as XLSX from "xlsx"; // npm install xlsx

// Crée un fichier Excel (.xlsx) et le télécharge.
//  lignes     : [{ "Colonne 1": valeur, "Colonne 2": valeur }, ...]
//  nomFeuille : nom de l'onglet dans Excel
//  nomFichier : ex. "recettes.xlsx"
export function exporterExcel(lignes, nomFeuille, nomFichier) {
  const feuille = XLSX.utils.json_to_sheet(lignes);

  // Largeur des colonnes : celle du texte le plus long de chaque colonne
  const colonnes = Object.keys(lignes[0] || {});
  feuille["!cols"] = colonnes.map((colonne) => ({
    wch: Math.max(colonne.length, ...lignes.map((ligne) => String(ligne[colonne] ?? "").length)) + 2,
  }));

  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, nomFeuille);
  XLSX.writeFile(classeur, nomFichier);
}
