import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nombreEnLettres, lignesImprimees, complementMinimum } from "./calculsFacture";
import { formaterDate } from "./calculsStats";
import { BLEU, nombre, chargerImage, dessinerLogo } from "./pdfOutils";

// PDF des factures, créés dans le front (sans l'impression du navigateur).
//  enDouble = false : une facture sur une page A4 (page Facture, page Transport funéraire)
//  enDouble = true  : une page A4 en PAYSAGE avec la même facture deux fois,
//                     à gauche et à droite, séparées par un trait de coupe (Nouvelle facture)
//
// facture = les colonnes de la base, comme renvoyées par le backend :
//  marchandise : numfacturemarchandise, datefacturemarchandise, nomclient, telephone, adresse,
//                nomdestination, libellezone, libelletypewagon, modefacturation, details, totaux...
//  funéraire   : numfacturefuneraire, datefacturefuneraire, nomdefunt, nomclient, ...,
//                montanthttfuneraire, piquirefuneraire, montantttcfunerare (+ prixfixe, prixzone si connus)
//
// Couleurs :
//  bleu  : titre, en-têtes du tableau, cadre NET A PAYER
//  noir  : toutes les données (client, lignes, montants)
//  gris  : les libellés ("Client :", "Date :" ...) et les traits

const MARGE = 8;

const NOIR = [33, 37, 41];
const GRIS = [107, 114, 128];
const GRIS_TRAIT = [209, 213, 219];
const GRIS_FOND = [243, 246, 250]; // fond des lignes paires du tableau et des encadrés
const BLANC = [255, 255, 255];

function couper(texte, maximum) {
  const t = String(texte || "");
  return t.length > maximum ? t.slice(0, maximum - 3) + "..." : t;
}

// "Libellé" en gris, puis la valeur en noir (gras)
function info(doc, libelle, valeur, x, y) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text(libelle, x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NOIR);
  doc.text(String(valeur || "-"), x, y + 4);
}

// ----- En-tête : logo, titre, numéro et date. Renvoie la position y où continuer. -----
function dessinerEntete(doc, logo, x, largeur, titre, numero, date) {
  const hauteurLogo = dessinerLogo(doc, logo, x, MARGE, 18);

  // Titre en bleu + sous-titre gris
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BLEU);
  doc.text(titre, x + 22, MARGE + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text("Chemin de fer Fianarantsoa – Côte Est", x + 22, MARGE + 13);

  // Encadré à droite : numéro et date
  const largeurCadre = 46;
  const xCadre = x + largeur - largeurCadre;
  doc.setFillColor(...GRIS_FOND);
  doc.setDrawColor(...GRIS_TRAIT);
  doc.roundedRect(xCadre, MARGE, largeurCadre, 15, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRIS);
  doc.text("N° facture", xCadre + 3, MARGE + 4.5);
  doc.text("Date", xCadre + 3, MARGE + 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NOIR);
  doc.text(String(numero || "-"), xCadre + largeurCadre - 3, MARGE + 4.5, { align: "right" });
  doc.text(formaterDate(date), xCadre + largeurCadre - 3, MARGE + 11, { align: "right" });

  // Trait bleu sous l'en-tête
  const y = MARGE + Math.max(hauteurLogo, 16) + 3;
  doc.setDrawColor(...BLEU);
  doc.setLineWidth(0.6);
  doc.line(x, y, x + largeur, y);
  doc.setLineWidth(0.2);
  return y + 5;
}

// ----- Bloc client / destination (encadré gris clair). Renvoie la position y où continuer. -----
function dessinerInfos(doc, f, x, largeur, y, troisieme) {
  const hauteur = 22;
  doc.setFillColor(...GRIS_FOND);
  doc.setDrawColor(...GRIS_TRAIT);
  doc.roundedRect(x, y, largeur, hauteur, 1.5, 1.5, "FD");

  const colonne = largeur / 2;
  info(doc, "Client", couper(f.nomclient, 34), x + 3, y + 5);
  info(doc, "Téléphone", f.telephone, x + colonne, y + 5);
  info(doc, "Destination", couper(`${f.nomdestination} – ${f.libellezone}`, 34), x + 3, y + 14);
  info(doc, troisieme.libelle, couper(troisieme.valeur, 30), x + colonne, y + 14);
  return y + hauteur + 4;
}

function styleTableau(x, largeur, largeurPage) {
  return {
    theme: "grid",
    margin: { left: x, right: largeurPage - (x + largeur) },
    tableWidth: largeur,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.4,
      textColor: NOIR,
      lineColor: GRIS_TRAIT,
      lineWidth: 0.15,
      overflow: "ellipsize", // une ligne reste sur une seule ligne : la page ne déborde pas
    },
    headStyles: { fillColor: BLEU, textColor: BLANC, halign: "center", fontStyle: "bold" },
    alternateRowStyles: { fillColor: GRIS_FOND },
  };
}

// ----- Totaux à droite, avec le cadre bleu NET A PAYER. Renvoie la position y sous le cadre. -----
function dessinerTotaux(doc, x, largeur, y, lignes, montantttc) {
  const largeurCadre = 64;
  const gauche = x + largeur - largeurCadre;
  const droite = x + largeur - 2;

  lignes.forEach(([libelle, valeur], index) => {
    const yLigne = y + 4 + index * 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(libelle, gauche + 2, yLigne);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NOIR);
    doc.text(nombre(valeur), droite, yLigne, { align: "right" });
  });

  // Cadre bleu plein, texte blanc
  const yNet = y + 2 + lignes.length * 5;
  doc.setFillColor(...BLEU);
  doc.roundedRect(gauche, yNet, largeurCadre, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLANC);
  doc.text("NET A PAYER", gauche + 2, yNet + 5.4);
  doc.text(`${nombre(montantttc)} Ar`, droite, yNet + 5.4, { align: "right" });
  return yNet + 12;
}

// Résumé à gauche des totaux (libellés gris, valeurs noires)
function dessinerResume(doc, x, y, lignes) {
  lignes.forEach(([libelle, valeur], index) => {
    const yLigne = y + 4 + index * 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(libelle, x, yLigne);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NOIR);
    doc.text(valeur, x + 30, yLigne);
  });
}

// "Arrêtée la présente facture à la somme de ..." + zones de signature
function dessinerBas(doc, x, largeur, y, montant) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...NOIR);
  const phrase = `Arrêtée la présente facture à la somme de ${nombreEnLettres(montant)} ariary.`;
  const lignes = doc.splitTextToSize(phrase, largeur);
  doc.text(lignes, x, y);
  y += lignes.length * 4 + 6;

  // Deux zones de signature
  const moitie = largeur / 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text("Le taxateur", x + moitie / 2, y, { align: "center" });
  doc.text("Le client", x + moitie + moitie / 2, y, { align: "center" });
  doc.setDrawColor(...GRIS_TRAIT);
  doc.line(x + 8, y + 14, x + moitie - 8, y + 14);
  doc.line(x + moitie + 8, y + 14, x + largeur - 8, y + 14);
}


// ----- Une facture marchandise (express ou wagon complet) à la position x -----
function dessinerFacture(doc, f, logo, x, largeur) {
  const largeurPage = doc.internal.pageSize.getWidth();
  let y = dessinerEntete(doc, logo, x, largeur, "FACTURE", f.numfacturemarchandise, f.datefacturemarchandise);
  y = dessinerInfos(doc, f, x, largeur, y, { libelle: "Wagon", valeur: f.libelletypewagon });

  // Wagon complet : seule la 1re ligne (le wagon) est imprimée
  const lignes = lignesImprimees(f).map((ligne, index) => [
    index + 1,
    nombre(ligne.nombrecolis),
    ligne.designation,
    nombre(ligne.poidsreel),
    nombre(ligne.poidsfacture),
    nombre(ligne.prixapplicable),
    nombre(ligne.montantht),
  ]);

  // Express sous 20 kg : ligne de complément (en italique gris)
  const complement = complementMinimum(f);
  if (complement) {
    lignes.push([
      "",
      "",
      { content: "Complément minimum 20 kg", styles: { fontStyle: "italic", textColor: GRIS } },
      "",
      nombre(complement.poids),
      "",
      nombre(complement.montant),
    ]);
  }

  autoTable(doc, {
    ...styleTableau(x, largeur, largeurPage),
    startY: y,
    head: [["N", "Qté", "Désignation", "Poids réel", "Poids fact.", "PU (Ar)", "Montant (Ar)"]],
    body: lignes,
    columnStyles: {
      0: { halign: "center", cellWidth: 7 },
      1: { halign: "center", cellWidth: 10 },
      3: { halign: "right", cellWidth: 17 },
      4: { halign: "right", cellWidth: 17 },
      5: { halign: "right", cellWidth: 15 },
      6: { halign: "right", cellWidth: 22 },
    },
  });
  y = doc.lastAutoTable.finalY + 2;

  dessinerResume(doc, x, y, [
    ["Nombre de colis", nombre(f.nombrecolistotal)],
    ["Poids réel total", `${nombre(f.poidsreeltotal)} kg`],
    ["Poids facturé", `${nombre(f.poidsfacturetotal)} kg`],
  ]);

  const yFin = dessinerTotaux(
    doc,
    x,
    largeur,
    y,
    [
      ["Total HT", f.montanthttotal],
      ["TVA (20 %)", f.tva],
      ["Piquire", f.piquiremarchandise],
    ],
    f.montantttc
  );
  dessinerBas(doc, x, largeur, yFin + 2, f.montantttc);
}


// ----- Une facture funéraire à la position x -----
function dessinerFuneraire(doc, f, logo, x, largeur) {
  const largeurPage = doc.internal.pageSize.getWidth();
  let y = dessinerEntete(doc, logo, x, largeur, "FACTURE FUNÉRAIRE", f.numfacturefuneraire, f.datefacturefuneraire);
  y = dessinerInfos(doc, f, x, largeur, y, { libelle: "Défunt", valeur: f.nomdefunt });

  // Le prix fixe et le tarif ne sont connus qu'au moment de la création de la facture
  const connus = f.prixfixe !== undefined && f.prixzone !== undefined;

  autoTable(doc, {
    ...styleTableau(x, largeur, largeurPage),
    startY: y,
    head: [["Désignation", "Prix fixe", "Tarif", "Montant HT (Ar)"]],
    body: [
      [
        `Transport funéraire – ${f.nomdefunt}`,
        connus ? nombre(f.prixfixe) : "-",
        connus ? nombre(f.prixzone) : "-",
        nombre(f.montanthttfuneraire),
      ],
    ],
    columnStyles: {
      1: { halign: "right", cellWidth: 20 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 28 },
    },
  });
  y = doc.lastAutoTable.finalY + 2;

  const yFin = dessinerTotaux(
    doc,
    x,
    largeur,
    y,
    [
      ["Montant HT", f.montanthttfuneraire],
      ["Piquire", f.piquirefuneraire],
    ],
    f.montantttcfunerare
  );
  dessinerBas(doc, x, largeur, yFin + 2, f.montantttcfunerare);
}


// ----- Création du PDF : une facture, ou deux exemplaires côte à côte -----
async function creerPdf(dessiner, facture, urlLogo, enDouble, nomFichier) {
  const logo = await chargerImage(urlLogo);

  if (enDouble) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const largeurPage = doc.internal.pageSize.getWidth(); // 297 mm
    const hauteurPage = doc.internal.pageSize.getHeight(); // 210 mm
    const largeur = 135;

    dessiner(doc, facture, logo, MARGE, largeur);
    dessiner(doc, facture, logo, largeurPage - MARGE - largeur, largeur);

    // Trait de coupe en pointillés entre les deux exemplaires
    doc.setDrawColor(...GRIS);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(largeurPage / 2, MARGE, largeurPage / 2, hauteurPage - MARGE);
    doc.setLineDashPattern([], 0);
    doc.save(nomFichier);
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth(); // 210 mm
  dessiner(doc, facture, logo, 14, largeurPage - 28);
  doc.save(nomFichier);
}

// Les "/" ne sont pas permis dans un nom de fichier : 001/09-10-2026 -> 001-09-10-2026
function nomDeFichier(prefixe, numero) {
  return `${prefixe}-${String(numero).replace(/\//g, "-")}.pdf`;
}

export async function genererPdfFacture(facture, urlLogo, enDouble = false) {
  await creerPdf(dessinerFacture, facture, urlLogo, enDouble, nomDeFichier("facture", facture.numfacturemarchandise));
}

export async function genererPdfFuneraire(facture, urlLogo, enDouble = false) {
  await creerPdf(
    dessinerFuneraire,
    facture,
    urlLogo,
    enDouble,
    nomDeFichier("facture-funeraire", facture.numfacturefuneraire)
  );
}
