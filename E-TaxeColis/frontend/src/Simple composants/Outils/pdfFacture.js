import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nombreEnLettres, lignesImprimees, complementMinimum } from "./calculsFacture";
import { formaterDate } from "./calculsStats";
import { BLEU, nombre, chargerImage, dessinerLogo, ligneInfo } from "./pdfOutils";

// PDF des factures, créés dans le front (sans l'impression du navigateur).
//  enDouble = false : une facture sur une page A4 (page Facture, page Transport funéraire)
//  enDouble = true  : une page A4 en PAYSAGE avec la même facture deux fois,
//                     à gauche et à droite, séparées par une ligne (Nouvelle facture)
//
// facture = les colonnes de la base, comme renvoyées par le backend :
//  marchandise : numfacturemarchandise, datefacturemarchandise, nomclient, telephone, adresse,
//                nomdestination, libellezone, libelletypewagon, modefacturation, details, totaux...
//  funéraire   : numfacturefuneraire, datefacturefuneraire, nomdefunt, nomclient, ...,
//                montanthttfuneraire, piquirefuneraire, montantttcfunerare (+ prixfixe, prixzone si connus)

const MARGE = 8;

function couper(texte, maximum) {
  const t = String(texte || "");
  return t.length > maximum ? t.slice(0, maximum - 3) + "..." : t;
}

// Logo, titre, numéro et date. Renvoie la position y où continuer.
function dessinerEntete(doc, logo, x, largeur, titre, numero, date) {
  const hauteurLogo = dessinerLogo(doc, logo, x, MARGE, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLEU);
  doc.text(titre, x + 22, MARGE + 9);

  doc.setFontSize(9);
  doc.text(`N° ${numero || "-"}`, x + largeur, MARGE + 5, { align: "right" });
  doc.text(`Date : ${formaterDate(date)}`, x + largeur, MARGE + 10, { align: "right" });

  return MARGE + Math.max(hauteurLogo, 14) + 3;
}

// Informations du client et de la destination. Renvoie la position y où continuer.
function dessinerInfos(doc, f, x, largeur, y, avecWagon) {
  const milieu = x + largeur * 0.6;
  doc.setFontSize(8.5);
  ligneInfo(doc, "Destination :", couper(`${f.nomdestination} - ${f.libellezone}`, 34), x, y + 5);
  if (avecWagon) ligneInfo(doc, "Wagon :", couper(f.libelletypewagon, 18), milieu, y + 5);
  ligneInfo(doc, "Client :", couper(f.nomclient, 34), x, y + 11);
  ligneInfo(doc, "Tél :", f.telephone, milieu, y + 11);
  ligneInfo(doc, "Adresse :", couper(f.adresse, 60), x, y + 17);
  return y + 22;
}

// Cadre des totaux, à droite. Renvoie la position y sous le cadre.
function dessinerTotaux(doc, x, largeur, y, lignes, montantttc) {
  const largeurCadre = 68;
  const gauche = x + largeur - largeurCadre;
  const droite = x + largeur - 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLEU);
  lignes.forEach(([libelle, valeur], index) => {
    doc.text(libelle, gauche + 2, y + 5 + index * 5);
    doc.text(nombre(valeur), droite, y + 5 + index * 5, { align: "right" });
  });

  const yNet = y + 5 + lignes.length * 5;
  doc.setDrawColor(...BLEU);
  doc.line(gauche + 2, yNet - 3, droite, yNet - 3);
  doc.setFontSize(10);
  doc.text("NET A PAYER", gauche + 2, yNet + 2);
  doc.text(`${nombre(montantttc)} Ar`, droite, yNet + 2, { align: "right" });
  return yNet + 6;
}

function styleTableau(x, largeur, largeurPage) {
  return {
    theme: "grid",
    margin: { left: x, right: largeurPage - (x + largeur) },
    tableWidth: largeur,
    styles: {
      fontSize: 8,
      cellPadding: 1,
      textColor: BLEU,
      lineColor: BLEU,
      lineWidth: 0.2,
      fontStyle: "bold",
      overflow: "ellipsize", // une ligne reste sur une seule ligne : la page ne déborde pas
    },
    headStyles: { fillColor: BLEU, textColor: 255, halign: "center", fontStyle: "bold" },
  };
}

function phraseMontant(doc, x, largeur, y, montant) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLEU);
  const phrase = `Arrêtée la présente facture à la somme de ${nombreEnLettres(montant)} ariary.`;
  doc.text(doc.splitTextToSize(phrase, largeur), x, y);
}


// ----- Une facture marchandise (express ou wagon complet) à la position x -----
function dessinerFacture(doc, f, logo, x, largeur) {
  const largeurPage = doc.internal.pageSize.getWidth();
  let y = dessinerEntete(doc, logo, x, largeur, "FACTURE", f.numfacturemarchandise, f.datefacturemarchandise);
  y = dessinerInfos(doc, f, x, largeur, y, true);

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

  // Express sous 20 kg : ligne de complément
  const complement = complementMinimum(f);
  if (complement) {
    lignes.push(["", "", "Complément minimum 20 kg", "", nombre(complement.poids), "", nombre(complement.montant)]);
  }

  autoTable(doc, {
    ...styleTableau(x, largeur, largeurPage),
    startY: y,
    head: [["N", "Qt", "Désignation", "Poids réel", "Poids fact.", "PU", "Montant"]],
    body: lignes,
    columnStyles: {
      0: { halign: "center", cellWidth: 7 },
      1: { halign: "center", cellWidth: 10 },
      3: { halign: "right", cellWidth: 17 },
      4: { halign: "right", cellWidth: 17 },
      5: { halign: "right", cellWidth: 12 },
      6: { halign: "right", cellWidth: 22 },
    },
  });
  y = doc.lastAutoTable.finalY + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLEU);
  doc.text(`Nombre de colis : ${nombre(f.nombrecolistotal)}`, x, y + 5);
  doc.text(`Poids réel total : ${nombre(f.poidsreeltotal)} kg`, x, y + 10);
  doc.text(`Poids facturé : ${nombre(f.poidsfacturetotal)} kg`, x, y + 15);

  const yFin = dessinerTotaux(
    doc,
    x,
    largeur,
    y,
    [
      ["TOTAL HT", f.montanthttotal],
      ["TVA", f.tva],
      ["Piquire", f.piquiremarchandise],
    ],
    f.montantttc
  );
  phraseMontant(doc, x, largeur, yFin + 4, f.montantttc);
}


// ----- Une facture funéraire à la position x -----
function dessinerFuneraire(doc, f, logo, x, largeur) {
  const largeurPage = doc.internal.pageSize.getWidth();
  let y = dessinerEntete(doc, logo, x, largeur, "FACTURE FUNERAIRE", f.numfacturefuneraire, f.datefacturefuneraire);
  y = dessinerInfos(doc, f, x, largeur, y, false);

  // Le prix fixe et le tarif ne sont connus qu'au moment de la création de la facture
  const connus = f.prixfixe !== undefined && f.prixzone !== undefined;

  autoTable(doc, {
    ...styleTableau(x, largeur, largeurPage),
    startY: y,
    head: [["Désignation", "Prix fixe", "Tarif", "Montant HT"]],
    body: [
      [
        `Transport funéraire - ${f.nomdefunt}`,
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
      ["MONTANT HT", f.montanthttfuneraire],
      ["Piquire", f.piquirefuneraire],
    ],
    f.montantttcfunerare
  );
  phraseMontant(doc, x, largeur, yFin + 4, f.montantttcfunerare);
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

    // Ligne verticale entre les deux exemplaires
    doc.setDrawColor(...BLEU);
    doc.setLineWidth(0.4);
    doc.line(largeurPage / 2, MARGE, largeurPage / 2, hauteurPage - MARGE);
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
