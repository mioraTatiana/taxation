import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nombreEnLettres, complementMinimum, estLigneWagon } from "./calculsFacture";
import { formaterDate } from "./calculsStats";
import { nombre, chargerImageNoirBlanc, dessinerLogo } from "./pdfOutils";

// PDF des factures, créés dans le front (sans l'impression du navigateur).
//  enDouble = false : une facture en A4 portrait (page Facture, page Transport funéraire)
//  enDouble = true  : A4 PAYSAGE, la même facture deux fois (gauche et droite),
//                     séparées par un trait de coupe (Nouvelle facture)
//
// Présentation : NOIR ET BLANC seulement (aucune couleur, aucun fond),
// police assez grande, pas de zone de signature.
//  Express       : une seule colonne "Poids" (poids facturé = poids réel, il n'est pas répété)
//  Wagon complet : la ligne du wagon (PPN / Divers) PUIS toutes les marchandises chargées
// Si le tableau est long, la facture continue sur la page suivante : chaque page porte
// son numéro ("Page 1 / 2") sous chaque exemplaire.
//
// facture = les colonnes de la base, comme renvoyées par le backend :
//  marchandise : numfacturemarchandise, datefacturemarchandise, nomclient, telephone, adresse,
//                nomdestination, libellezone, libelletypewagon, modefacturation, details, totaux...
//  funéraire   : numfacturefuneraire, datefacturefuneraire, nomdefunt, nomclient, ...,
//                montanthttfuneraire, piquirefuneraire, montantttcfunerare (+ prixfixe, prixzone si connus)

const MARGE = 10;
const NOIR = [0, 0, 0];

function couper(texte, maximum) {
  const t = String(texte || "");
  return t.length > maximum ? t.slice(0, maximum - 3) + "..." : t;
}

function texte(doc, valeur, x, y, { taille = 10, gras = false, italique = false, align = "left" } = {}) {
  doc.setFont("helvetica", gras ? "bold" : italique ? "italic" : "normal");
  doc.setFontSize(taille);
  doc.setTextColor(...NOIR);
  doc.text(String(valeur ?? ""), x, y, { align });
}

// Passe à la page suivante s'il ne reste pas assez de place (la page existe peut-être déjà :
// en double, l'exemplaire de droite réutilise les pages de celui de gauche)
function placeOuPageSuivante(doc, y, besoin) {
  const hauteurPage = doc.internal.pageSize.getHeight();
  if (y + besoin <= hauteurPage - 14) return y;
  const suivante = doc.getCurrentPageInfo().pageNumber + 1;
  if (suivante > doc.getNumberOfPages()) doc.addPage();
  doc.setPage(suivante);
  return MARGE + 4;
}

// ----- En-tête : logo, titre, numéro et date. Renvoie la position y où continuer. -----
function dessinerEntete(doc, logo, x, largeur, titre, numero, date) {
  const hauteurLogo = dessinerLogo(doc, logo, x, MARGE, 20);

  // Titre long ("FACTURE FUNÉRAIRE") un peu plus petit pour ne pas toucher le cadre du numéro
  texte(doc, titre, x + 24, MARGE + 8, { taille: titre.length > 10 ? 14 : 18, gras: true });
  texte(doc, "Chemin de fer Fianarantsoa – Côte Est", x + 24, MARGE + 14, { taille: 9 });

  // Cadre à droite : numéro et date (trait noir, sans fond)
  const largeurCadre = 52;
  const xCadre = x + largeur - largeurCadre;
  doc.setDrawColor(...NOIR);
  doc.setLineWidth(0.3);
  doc.rect(xCadre, MARGE, largeurCadre, 17);
  texte(doc, "N° facture", xCadre + 2.5, MARGE + 6, { taille: 9 });
  texte(doc, "Date", xCadre + 2.5, MARGE + 13, { taille: 9 });
  texte(doc, numero || "-", xCadre + largeurCadre - 2.5, MARGE + 6, { taille: 10.5, gras: true, align: "right" });
  texte(doc, formaterDate(date), xCadre + largeurCadre - 2.5, MARGE + 13, { taille: 10.5, gras: true, align: "right" });

  const y = MARGE + Math.max(hauteurLogo, 18) + 3;
  doc.setLineWidth(0.5);
  doc.line(x, y, x + largeur, y);
  doc.setLineWidth(0.2);
  return y + 5;
}

// ----- Bloc client / destination (cadre sans fond). Renvoie la position y où continuer. -----
function dessinerInfos(doc, f, x, largeur, y, troisieme) {
  const hauteur = 25;
  doc.setDrawColor(...NOIR);
  doc.setLineWidth(0.3);
  doc.rect(x, y, largeur, hauteur);

  const colonne = largeur / 2;
  const nomClient = f.sigle ? `${f.nomclient} (${f.sigle})` : f.nomclient;
  const info = (libelle, valeur, xi, yi) => {
    texte(doc, libelle, xi, yi, { taille: 9 });
    texte(doc, valeur || "-", xi, yi + 5, { taille: 10.5, gras: true });
  };
  info("Client", couper(nomClient, 30), x + 3, y + 6);
  info("Téléphone", f.telephone, x + colonne, y + 6);
  info("Destination", couper(`${f.nomdestination} – ${f.libellezone}`, 30), x + 3, y + 17);
  info(troisieme.libelle, couper(troisieme.valeur, 26), x + colonne, y + 17);
  return y + hauteur + 4;
}

// Tableau noir et blanc : traits noirs, aucun fond
function styleTableau(x, largeur, largeurPage) {
  return {
    theme: "grid",
    margin: { left: x, right: largeurPage - (x + largeur), top: MARGE + 4, bottom: 16 },
    tableWidth: largeur,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 1.6,
      textColor: NOIR,
      lineColor: NOIR,
      lineWidth: 0.2,
      fillColor: false,
      overflow: "linebreak",
    },
    headStyles: { fillColor: false, textColor: NOIR, halign: "center", fontStyle: "bold" },
    alternateRowStyles: { fillColor: false },
    showHead: "everyPage",
    rowPageBreak: "avoid", // une ligne n'est jamais coupée entre deux pages
  };
}

// ----- Résumé à gauche + totaux à droite + NET A PAYER encadré. Renvoie la position y en bas. -----
function dessinerTotaux(doc, x, largeur, y, resume, lignes, montantttc) {
  const hauteur = Math.max(resume.length, lignes.length) * 6 + 14;
  y = placeOuPageSuivante(doc, y, hauteur + 20);

  resume.forEach(([libelle, valeur], index) => {
    const yLigne = y + 5 + index * 6;
    texte(doc, libelle, x, yLigne, { taille: 10 });
    texte(doc, valeur, x + 34, yLigne, { taille: 10, gras: true });
  });

  const largeurCadre = 66;
  const gauche = x + largeur - largeurCadre;
  const droite = x + largeur - 2;
  lignes.forEach(([libelle, valeur], index) => {
    const yLigne = y + 5 + index * 6;
    texte(doc, libelle, gauche + 2, yLigne, { taille: 10 });
    texte(doc, nombre(valeur), droite, yLigne, { taille: 10, gras: true, align: "right" });
  });

  // NET A PAYER : cadre noir épais, sans fond
  const yNet = y + 2 + lignes.length * 6;
  doc.setDrawColor(...NOIR);
  doc.setLineWidth(0.6);
  doc.rect(gauche, yNet, largeurCadre, 9);
  doc.setLineWidth(0.2);
  texte(doc, "NET A PAYER", gauche + 2, yNet + 6.2, { taille: 11.5, gras: true });
  texte(doc, `${nombre(montantttc)} Ar`, droite, yNet + 6.2, { taille: 11.5, gras: true, align: "right" });
  return Math.max(yNet + 13, y + resume.length * 6 + 6);
}

// "Arrêtée la présente facture à la somme de ..." (plus de zone de signature)
function dessinerBas(doc, x, largeur, y, montant) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  const lignes = doc.splitTextToSize(`Arrêtée la présente facture à la somme de ${nombreEnLettres(montant)} ariary.`, largeur);
  y = placeOuPageSuivante(doc, y, lignes.length * 5);
  doc.setTextColor(...NOIR);
  doc.text(lignes, x, y);
}


// ----- Une facture marchandise (express ou wagon complet) à la position x -----
function dessinerFacture(doc, f, logo, x, largeur) {
  const largeurPage = doc.internal.pageSize.getWidth();
  const wagonComplet = Boolean(f.modefacturation);
  let y = dessinerEntete(doc, logo, x, largeur, "FACTURE", f.numfacturemarchandise, f.datefacturemarchandise);
  y = dessinerInfos(doc, f, x, largeur, y, { libelle: "Wagon", valeur: f.libelletypewagon });

  const details = f.details || [];
  let entete;
  let lignes;
  let colonnes;

  if (wagonComplet) {
    // Ligne du wagon (avec le prix) puis les marchandises chargées (sans prix)
    entete = ["N", "Qté", "Désignation", "Poids réel", "Poids fact.", "PU", "Montant"];
    lignes = details.map((ligne, index) => {
      const wagon = estLigneWagon(f, index);
      const cellule = (valeur) => (wagon ? { content: valeur, styles: { fontStyle: "bold" } } : valeur);
      return [
        cellule(wagon ? "" : index),
        cellule(nombre(ligne.nombrecolis)),
        cellule(wagon ? `Wagon ${f.libelletypewagon || ""} – ${ligne.designation}` : ligne.designation),
        cellule(nombre(ligne.poidsreel)),
        cellule(wagon ? nombre(ligne.poidsfacture) : ""),
        cellule(wagon ? nombre(ligne.prixapplicable) : ""),
        cellule(wagon ? nombre(ligne.montantht) : ""),
      ];
    });
    colonnes = {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 11 },
      3: { halign: "right", cellWidth: 19 },
      4: { halign: "right", cellWidth: 19 },
      5: { halign: "right", cellWidth: 14 },
      6: { halign: "right", cellWidth: 23 },
    };
  } else {
    // Express : une seule colonne "Poids"
    entete = ["N", "Qté", "Désignation", "Poids (kg)", "PU", "Montant"];
    lignes = details.map((ligne, index) => [
      index + 1,
      nombre(ligne.nombrecolis),
      ligne.designation,
      nombre(ligne.poidsreel),
      nombre(ligne.prixapplicable),
      nombre(ligne.montantht),
    ]);
    const complement = complementMinimum(f);
    if (complement) {
      lignes.push([
        "",
        "",
        { content: "Complément minimum 20 kg", styles: { fontStyle: "italic" } },
        nombre(complement.poids),
        "",
        nombre(complement.montant),
      ]);
    }
    colonnes = {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 11 },
      3: { halign: "right", cellWidth: 21 },
      4: { halign: "right", cellWidth: 15 },
      5: { halign: "right", cellWidth: 25 },
    };
  }

  autoTable(doc, {
    ...styleTableau(x, largeur, largeurPage),
    startY: y,
    head: [entete],
    body: lignes,
    columnStyles: colonnes,
  });
  y = doc.lastAutoTable.finalY + 3;

  const resume = wagonComplet
    ? [
        ["Nombre de colis", nombre(f.nombrecolistotal)],
        ["Poids réel", `${nombre(f.poidsreeltotal)} kg`],
        ["Poids facturé", `${nombre(f.poidsfacturetotal)} kg`],
      ]
    : [
        ["Nombre de colis", nombre(f.nombrecolistotal)],
        ["Poids", `${nombre(f.poidsreeltotal)} kg`],
      ];

  const yFin = dessinerTotaux(
    doc,
    x,
    largeur,
    y,
    resume,
    [
      ["Total HT", f.montanthttotal],
      ["TVA (20 %)", f.tva],
      ["Piquire", f.piquiremarchandise],
    ],
    f.montantttc
  );
  dessinerBas(doc, x, largeur, yFin + 3, f.montantttc);
}


// ----- Une facture funéraire à la position x -----
function dessinerFuneraire(doc, f, logo, x, largeur) {
  const largeurPage = doc.internal.pageSize.getWidth();
  let y = dessinerEntete(doc, logo, x, largeur, "FACTURE FUNÉRAIRE", f.numfacturefuneraire, f.datefacturefuneraire);
  y = dessinerInfos(doc, f, x, largeur, y, { libelle: "Défunt", valeur: f.nomdefunt });

  // Le prix fixe et la distance zone ne sont connus qu'au moment de la création de la facture
  const connus = f.prixfixe !== undefined && f.prixzone !== undefined;

  autoTable(doc, {
    ...styleTableau(x, largeur, largeurPage),
    startY: y,
    head: [["Désignation", "Prix fixe (Ar)", "Distance zone", "Montant HT"]],
    body: [
      [
        `Transport funéraire – ${f.nomdefunt}`,
        connus ? nombre(f.prixfixe) : "-",
        connus ? nombre(f.prixzone) : "-",
        nombre(f.montanthttfuneraire),
      ],
    ],
    columnStyles: {
      1: { halign: "right", cellWidth: 24 },
      2: { halign: "right", cellWidth: 22 },
      3: { halign: "right", cellWidth: 26 },
    },
  });
  y = doc.lastAutoTable.finalY + 3;

  const yFin = dessinerTotaux(
    doc,
    x,
    largeur,
    y,
    [],
    [
      ["Montant HT", f.montanthttfuneraire],
      ["Piquire", f.piquirefuneraire],
    ],
    f.montantttcfunerare
  );
  dessinerBas(doc, x, largeur, yFin + 3, f.montantttcfunerare);
}


// "Page 1 / 2" sous un exemplaire (x, largeur), sur toutes les pages
function numeroterPages(doc, x, largeur) {
  const total = doc.getNumberOfPages();
  const hauteur = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    texte(doc, `Page ${page} / ${total}`, x + largeur / 2, hauteur - 7, { taille: 9, align: "center" });
  }
}

// ----- Création du PDF : une facture, ou deux exemplaires côte à côte -----
async function creerPdf(dessiner, facture, urlLogo, enDouble, nomFichier) {
  const logo = await chargerImageNoirBlanc(urlLogo);

  if (enDouble) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const largeurPage = doc.internal.pageSize.getWidth(); // 297 mm
    const hauteurPage = doc.internal.pageSize.getHeight(); // 210 mm
    const largeur = 134;
    const xDroite = largeurPage - MARGE - largeur;

    // Exemplaire de gauche, puis celui de droite sur les MÊMES pages
    dessiner(doc, facture, logo, MARGE, largeur);
    doc.setPage(1);
    dessiner(doc, facture, logo, xDroite, largeur);

    // Trait de coupe en pointillés sur chaque page + numéros de page sous chaque exemplaire
    for (let page = 1; page <= doc.getNumberOfPages(); page++) {
      doc.setPage(page);
      doc.setDrawColor(...NOIR);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(largeurPage / 2, MARGE, largeurPage / 2, hauteurPage - MARGE);
      doc.setLineDashPattern([], 0);
    }
    numeroterPages(doc, MARGE, largeur);
    numeroterPages(doc, xDroite, largeur);
    doc.save(nomFichier);
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth(); // 210 mm
  dessiner(doc, facture, logo, 14, largeurPage - 28);
  numeroterPages(doc, 14, largeurPage - 28);
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
