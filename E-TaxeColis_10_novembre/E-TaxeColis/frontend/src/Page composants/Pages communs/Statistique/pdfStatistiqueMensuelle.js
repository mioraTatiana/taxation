import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nombre, chargerImageNoirBlanc, dessinerLogo } from "../../../Simple composants/Outils/pdfOutils";

// STATISTIQUE EN PDF (bouton "Statistique en PDF" de la page Statistique), en noir et blanc.
// Même présentation que la fiche papier "STATISTIQUES VOYAGEURS ET MARCHANDISES" :
//  1 - MARCHANDISES : une ligne par nature (café, banane... hydro, autres) avec
//      tonnage, tonnes/km et recettes taxables, puis le TOTAL (mensuel)
//  2 - VOYAGEURS : le cadre de la fiche, laissé vide (l'application ne gère pas les voyageurs)
//
//  stat = réponse de /statistique/mensuelle :
//   { mois, annee, gare, codegare, lignes: [{ nature, tonnage, tonneskm, recette }], total }
//  Seulement les factures EXPRESS de la gare de Fianarantsoa (calculé par le backend).

export const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Les natures sont imprimées par blocs, comme sur la fiche (un espace entre deux blocs)
const BLOCS = [
  ["CAFE", "BANANE VERTE", "BANANE MURE", "LETCHI", "MANGUE", "ORANGE", "AVOCAT", "AUTRES FRUITS ET LEGUMES"],
  ["RIZ et PADDY"],
  ["P.ALIMENTAIRES et MERCERIE"],
  ["MANIOC SEC (Soanta)", "MANIOC FRAIS", "GINGEMBRE", "VANILLE", "CANNELLE"],
  ["CHARBON DE BOIS", "BOIS DE CHAUFFAGE", "PLANCHE", "MADRIER", "BATTANE"],
  ["HYDRO"],
  ["AUTRES"],
];

// Une valeur à 0 reste vide, comme sur la fiche remplie à la main
function valeur(nombreAffiche) {
  return nombreAffiche ? nombre(Math.round(nombreAffiche)) : "";
}

export async function genererPdfStatistiqueMensuelle(stat, urlLogo) {
  const logo = await chargerImageNoirBlanc(urlLogo);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth(); // 297 mm
  const marge = 12;
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // ----- En-tête -----
  dessinerLogo(doc, logo, marge, 8, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("STATISTIQUES VOYAGEURS ET MARCHANDISES", largeurPage / 2 + 20, 14, { align: "center" });
  doc.setFontSize(11);
  doc.text(`MOIS DE : ${NOMS_MOIS[stat.mois - 1].toUpperCase()} ${stat.annee}`, largeurPage / 2 + 20, 21, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`GARE : ${String(stat.gare || "").toUpperCase()}`, largeurPage / 2 - 10, 28, { align: "center" });
  doc.text(`CODE GARE : ${stat.codegare || "........"}`, largeurPage / 2 + 50, 28, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Express seulement", largeurPage - marge, 10, { align: "right" });

  // ----- 1 - MARCHANDISES -----
  const yDebut = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1 - MARCHANDISES :", marge, yDebut - 2);

  const parNature = Object.fromEntries(stat.lignes.map((l) => [l.nature, l]));
  const corps = [];
  BLOCS.forEach((bloc, index) => {
    // petit espace entre deux blocs (comme sur la fiche)
    if (index > 0) corps.push([{ content: "", colSpan: 4, styles: { minCellHeight: 1.6, cellPadding: 0, fontSize: 1, lineWidth: 0 } }]);
    bloc.forEach((nature) => {
      const ligne = parNature[nature] || { tonnage: 0, tonneskm: 0, recette: 0 };
      corps.push([nature, valeur(ligne.tonnage), valeur(ligne.tonneskm), valeur(ligne.recette)]);
    });
  });
  corps.push([
    { content: "TOTAL (mensuel)", styles: { fontStyle: "bold" } },
    { content: valeur(stat.total.tonnage), styles: { fontStyle: "bold" } },
    { content: valeur(stat.total.tonneskm), styles: { fontStyle: "bold" } },
    { content: valeur(stat.total.recette), styles: { fontStyle: "bold" } },
  ]);

  autoTable(doc, {
    theme: "grid",
    startY: yDebut,
    margin: { left: marge },
    tableWidth: 150,
    head: [["NATURE DES MARCHANDISES", "TONNAGES (en kg)", "TONNES/KM (T.K)", "RECETTES TAXABLES (en Ariary)"]],
    body: corps,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 0.75, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, fillColor: false },
    headStyles: { fontStyle: "bold", halign: "center", valign: "middle", fillColor: false, fontSize: 7.5 },
    pageBreak: "avoid",
    columnStyles: {
      0: { cellWidth: 50, halign: "center" },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
  });

  // ----- 2 - VOYAGEURS (cadre de la fiche, vide), à droite sur la même page -----
  doc.setPage(1);
  const xVoyageurs = marge + 160;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2 - VOYAGEURS :", xVoyageurs, yDebut - 2);
  autoTable(doc, {
    theme: "grid",
    startY: yDebut,
    margin: { left: xVoyageurs },
    tableWidth: largeurPage - xVoyageurs - marge,
    head: [["Total mensuel (1-2-3 décade)", "Nombres", "Voyageurs/Km (VK)", "Recettes taxables (en Ariary)"]],
    body: [
      ["01ère CLASSE (Billets fixes et PPS)", "", "", ""],
      ["02ème CLASSE (Billets fixes et PPS)", "", "", ""],
      ["RÉSERVATION (Réservation, tarifs résidents et non résidents)", "", "", ""],
      [{ content: "TOTAL GÉNÉRAL", styles: { fontStyle: "bold" } }, "", "", ""],
    ],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, fillColor: false, minCellHeight: 10 },
    headStyles: { fontStyle: "bold", halign: "center", valign: "middle", fillColor: false, minCellHeight: 8 },
    columnStyles: { 0: { cellWidth: 40 } },
  });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("Partie voyageurs : non gérée par l'application (à remplir à la main).", xVoyageurs, doc.lastAutoTable.finalY + 5);

  // Bas de page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Édité le ${new Date().toLocaleDateString("fr-FR")} – E-TaxeColis – tonnes/km = tonnes × point kilométrique de la destination`,
    marge,
    doc.internal.pageSize.getHeight() - 7
  );

  doc.save(`statistique-${String(stat.mois).padStart(2, "0")}-${stat.annee}.pdf`);
}
