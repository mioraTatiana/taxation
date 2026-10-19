import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  nombreEnLettres,
  MAX_LIGNES,
  TARIF_IMPOSE_FUNERAIRE,
  POIDS_MINIMUM_EXPRESS,
  complementMinimumExpress,
} from "./calculsFacture";
import { formaterDate } from "./calculsStats";
import {
  NOIR,
  GRIS_ENTETE,
  STYLE_TEXTE,
  nombre,
  chargerImage,
  dessinerLogo,
  dessinerCadre,
  ligneInfo,
} from "./pdfOutils";

// PDF créé dans le front (sans l'impression du navigateur) :
//  - une seule page A4 en PAYSAGE
//  - la même facture dessinée deux fois : à gauche et à droite, séparées par une ligne verticale
//  - 11 colis (lignes) au maximum

const LARGEUR_PAGE = 297;
const HAUTEUR_PAGE = 210;
const MARGE = 8;
const LARGEUR_COLONNE = 135;
const X_GAUCHE = MARGE;
const X_DROITE = LARGEUR_PAGE - MARGE - LARGEUR_COLONNE;

function couper(texte, maximum) {
  const t = String(texte || "");
  return t.length > maximum ? t.slice(0, maximum - 3) + "..." : t;
}

function tracerSeparation(doc) {
  doc.setDrawColor(...NOIR);
  doc.setLineWidth(0.4);
  doc.line(LARGEUR_PAGE / 2, MARGE, LARGEUR_PAGE / 2, HAUTEUR_PAGE - MARGE);
}

// Logo, titre, numéro et date. Renvoie la position y où continuer.
function dessinerEntete(doc, logo, x, titre, numfacture, datefacture) {
  const hauteurLogo = dessinerLogo(doc, logo, x, MARGE, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...NOIR);
  doc.text(titre, x + 22, MARGE + 9);

  doc.setFontSize(9);
  doc.text(`N° ${numfacture || "-"}`, x + LARGEUR_COLONNE, MARGE + 5, { align: "right" });
  doc.text(`Date : ${formaterDate(datefacture)}`, x + LARGEUR_COLONNE, MARGE + 10, { align: "right" });

  return MARGE + Math.max(hauteurLogo, 14) + 3;
}

// Cadre des totaux. Renvoie la position y sous le cadre.
function dessinerTotaux(doc, x, y, lignes, montantttc) {
  const largeur = 68;
  const boiteX = x + LARGEUR_COLONNE - largeur;
  const droite = x + LARGEUR_COLONNE - 3;
  const hauteur = lignes.length * 5 + 11;

  dessinerCadre(doc, boiteX, y, largeur, hauteur);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NOIR);
  lignes.forEach(([libelle, valeur], index) => {
    doc.text(libelle, boiteX + 3, y + 5 + index * 5);
    doc.text(nombre(valeur), droite, y + 5 + index * 5, { align: "right" });
  });

  const yNet = y + 5 + lignes.length * 5;
  doc.line(boiteX + 3, yNet - 3, droite, yNet - 3);
  doc.setFontSize(10);
  doc.text("NET A PAYER", boiteX + 3, yNet + 2);
  doc.text(`${nombre(montantttc)} Ar`, droite, yNet + 2, { align: "right" });
  return y + hauteur;
}

function styleTableau() {
  return {
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 1,
      textColor: NOIR,
      lineColor: NOIR,
      lineWidth: 0.2,
      fontStyle: STYLE_TEXTE,
      overflow: "ellipsize", // une ligne reste sur une seule ligne : la page ne déborde pas
    },
    headStyles: { fillColor: GRIS_ENTETE, textColor: NOIR, halign: "center", fontStyle: "bold" },
  };
}

// ----- Une facture de marchandises (express ou wagon complet) dans une colonne -----
function dessinerFacture(doc, facture, logo, x) {
  let y = dessinerEntete(doc, logo, x, "FACTURE", facture.numfacture, facture.datefacture);

  dessinerCadre(doc, x, y, LARGEUR_COLONNE, 21);
  doc.setFontSize(8.5);
  ligneInfo(doc, "Destination :", couper(`${facture.destinationNom} - ${facture.zoneLibelle}`, 30), x + 3, y + 6);
  ligneInfo(doc, "Wagon :", couper(facture.wagon, 22), x + 80, y + 6);
  ligneInfo(doc, "Client :", couper(facture.clientNom, 30), x + 3, y + 12);
  ligneInfo(doc, "Tél :", facture.clientTelephone, x + 80, y + 12);
  ligneInfo(doc, "Adresse :", couper(facture.clientAdresse, 60), x + 3, y + 18);
  y += 24;

  // Wagon complet : le wagon est facturé une seule fois (ligne récapitulative sous le tableau)
  const wagonComplet = facture.wagonComplet;
  const entetes = wagonComplet
    ? ["N", "Qt", "Désignation", "Poids réel (kg)"]
    : ["N", "Qt", "Désignation", "Poids réel (kg)", "PU (Ar)", "Montant (Ar)"];

  const lignes = facture.details.map((ligne, index) => {
    const debutLigne = [index + 1, ligne.nombrecolis, ligne.designation, nombre(ligne.poidsreel)];
    return wagonComplet
      ? debutLigne
      : [...debutLigne, nombre(ligne.prixapplicable), nombre(ligne.montantht)];
  });

  // Express : ligne de complément si le poids total est sous le minimum de 20 kg
  const complement = complementMinimumExpress(facture.details, facture, wagonComplet);
  if (complement) {
    lignes.push(["", "", `Complément (minimum express ${POIDS_MINIMUM_EXPRESS} kg)`, nombre(complement.poids), "", nombre(complement.montant)]);
  }

  autoTable(doc, {
    ...styleTableau(),
    startY: y,
    head: [entetes],
    body: lignes,
    margin: { left: x, right: LARGEUR_PAGE - (x + LARGEUR_COLONNE) },
    tableWidth: LARGEUR_COLONNE,
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 10 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "right", cellWidth: 18 },
      5: { halign: "right", cellWidth: 24 },
    },
  });
  y = doc.lastAutoTable.finalY + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (wagonComplet) {
    const prixWagon =
      facture.poidsfacturetotal > 0 ? Math.round(facture.montanthttotal / facture.poidsfacturetotal) : 0;
    doc.text(
      `Wagon complet (${facture.wagon}) : ${nombre(facture.poidsfacturetotal)} kg x ${nombre(prixWagon)} Ar/kg = ${nombre(facture.montanthttotal)} Ar`,
      x,
      y + 2
    );
    y += 6;
  }

  doc.setFontSize(8.5);
  doc.text(`Nombre de colis : ${nombre(facture.nombrecolistotal)}`, x, y + 4);
  doc.text(`Poids total : ${nombre(facture.poidsreeltotal)} kg`, x, y + 9);

  const yFin = dessinerTotaux(
    doc,
    x,
    y,
    [
      ["TOTAL HT", facture.montanthttotal],
      ["TVA", facture.tva],
      ["Piquire", facture.piquire],
    ],
    facture.montantttc
  );

  doc.setFontSize(8.5);
  const phrase = `Arrêtée la présente facture à la somme de ${nombreEnLettres(facture.montantttc)} ariary.`;
  doc.text(doc.splitTextToSize(phrase, LARGEUR_COLONNE), x, yFin + 6);
}

// ----- Une facture de transport funéraire dans une colonne -----
function dessinerFuneraire(doc, f, logo, x) {
  let y = dessinerEntete(doc, logo, x, "FACTURE FUNERAIRE", f.numfacture, f.datefacture);

  dessinerCadre(doc, x, y, LARGEUR_COLONNE, 15);
  doc.setFontSize(8.5);
  ligneInfo(doc, "Destination :", couper(`${f.destinationNom} - ${f.zoneLibelle}`, 60), x + 3, y + 6);
  ligneInfo(doc, "Défunt :", couper(f.nomdefunt, 60), x + 3, y + 12);
  y += 19;

  autoTable(doc, {
    ...styleTableau(),
    startY: y,
    head: [["Désignation", "Poids imposé (kg)", "PU (Ar/kg)", "Montant HT (Ar)"]],
    body: [["Transport funéraire", nombre(TARIF_IMPOSE_FUNERAIRE), nombre(f.prixkg), nombre(f.montantht)]],
    margin: { left: x, right: LARGEUR_PAGE - (x + LARGEUR_COLONNE) },
    tableWidth: LARGEUR_COLONNE,
    columnStyles: {
      1: { halign: "right", cellWidth: 30 },
      2: { halign: "right", cellWidth: 24 },
      3: { halign: "right", cellWidth: 32 },
    },
  });
  y = doc.lastAutoTable.finalY + 6;

  const yFin = dessinerTotaux(
    doc,
    x,
    y,
    [
      ["MONTANT HT", f.montantht],
      ["Piquire", f.piquire],
    ],
    f.montantttc
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const phrase = `Arrêtée la présente facture à la somme de ${nombreEnLettres(f.montantttc)} ariary.`;
  doc.text(doc.splitTextToSize(phrase, LARGEUR_COLONNE), x, yFin + 6);
}

// ----- Création du PDF : deux exemplaires côte à côte -----
async function creerPdfDouble(dessiner, donnees, urlLogo, nomFichier) {
  const logo = await chargerImage(urlLogo);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  dessiner(doc, donnees, logo, X_GAUCHE);
  dessiner(doc, donnees, logo, X_DROITE);
  tracerSeparation(doc);

  if (doc.getNumberOfPages() > 1) {
    throw new Error("La facture ne tient pas sur une seule page");
  }
  doc.save(nomFichier);
}

function nomDeFichier(prefixe, numfacture) {
  return `${prefixe}-${String(numfacture).replace(/\//g, "-")}.pdf`;
}

//  facture : numfacture, datefacture ("AAAA-MM-JJ"), clientNom, clientTelephone, clientAdresse,
//            destinationNom, zoneLibelle, wagon, wagonComplet, details (lignes) et les totaux
export async function genererPdfFactureDouble(facture, urlLogo) {
  if (facture.details.length > MAX_LIGNES) {
    throw new Error(`Une facture contient ${MAX_LIGNES} colis au maximum`);
  }
  await creerPdfDouble(dessinerFacture, facture, urlLogo, nomDeFichier("facture", facture.numfacture));
}

//  facture : numfacture, datefacture, nomdefunt, destinationNom, zoneLibelle,
//            prixkg, montantht, piquire, montantttc
export async function genererPdfFuneraireDouble(facture, urlLogo) {
  await creerPdfDouble(dessinerFuneraire, facture, urlLogo, nomDeFichier("facture-funeraire", facture.numfacture));
}
