import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nombreEnLettres } from "../../../Simple composants/Outils/calculsFacture";
import { formaterDate } from "../../../Simple composants/Outils/calculsStats";
import {
  BLEU,
  nombre,
  chargerImage,
  dessinerLogo,
  ligneInfo,
  verifierPage,
  ajouterNumerosDePage,
} from "../../../Simple composants/Outils/pdfOutils";

// Crée et télécharge le PDF d'une facture (aucune fenêtre d'impression du navigateur).
//  facture : facture complète avec ses lignes (facture.details), le nom du client, la destination...
//  urlLogo : le logo importé (import Fcelogo from ".../logo.png")
export async function genererPdfFacture(facture, urlLogo) {
  const logo = await chargerImage(urlLogo);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth();
  const marge = 14;
  const droite = largeurPage - marge;

  // ----- En-tête : logo, titre, numéro et date -----
  dessinerLogo(doc, logo, marge, 10, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLEU);
  doc.text("FACTURE", marge + 32, 24);

  doc.setFontSize(11);
  doc.text(`N° ${facture.numfacture}`, droite, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Date : ${formaterDate(facture.datefacture)}`, droite, 25, { align: "right" });

  // ----- Informations -----
  doc.setFontSize(11);
  let y = 46;
  ligneInfo(doc, "Destination :", `${facture.destinationNom} - ${facture.zoneLibelle}`, marge, y);
  y += 7;
  ligneInfo(doc, "Wagon :", facture.wagon, marge, y);
  y += 7;
  ligneInfo(doc, "Client :", facture.clientNom, marge, y);
  y += 7;
  ligneInfo(doc, "Tél :", facture.clientTelephone, marge, y);
  y += 7;
  ligneInfo(doc, "Adresse :", facture.clientAdresse, marge, y);
  y += 4;

  // ----- Tableau des marchandises -----
  // Wagon complet : le wagon est facturé une seule fois (ligne récapitulative sous le tableau)
  const wagonComplet = facture.wagonComplet;
  const entetes = wagonComplet
    ? ["N", "Qt", "Désignation", "Poids réel (kg)"]
    : ["N", "Qt", "Désignation", "Poids réel (kg)", "PU (Ar)", "Montant (Ar)"];

  const lignes = facture.details.map((ligne, index) => {
    const designation = ligne.nomdefunt ? `${ligne.designation} - ${ligne.nomdefunt}` : ligne.designation;
    const debutLigne = [index + 1, ligne.nombrecolis, designation, nombre(ligne.poidsreel)];
    return wagonComplet
      ? debutLigne
      : [...debutLigne, nombre(ligne.prixapplicable), nombre(ligne.montantht)];
  });

  autoTable(doc, {
    startY: y + 2,
    head: [entetes],
    body: lignes,
    theme: "grid",
    margin: { left: marge, right: marge },
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: BLEU, textColor: 255, halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "center", cellWidth: 14 },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  if (wagonComplet) {
    const prixWagon =
      facture.poidsfacturetotal > 0 ? Math.round(facture.montanthttotal / facture.poidsfacturetotal) : 0;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `Wagon complet (${facture.wagon}) : ${nombre(facture.poidsfacturetotal)} kg x ${nombre(prixWagon)} Ar/kg = ${nombre(facture.montanthttotal)} Ar`,
      marge,
      y
    );
    y += 9;
  }

  // ----- Totaux -----
  y = verifierPage(doc, y, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nombre de colis : ${nombre(facture.nombrecolistotal)}`, marge, y);
  doc.text(`Poids total : ${nombre(facture.poidsreeltotal)} kg`, marge, y + 6);

  const lignesTotaux = [
    ["TOTAL HT", facture.montanthttotal],
    ["TVA", facture.tva],
    ["Piquire", facture.piquire],
  ];
  const xLibelle = droite - 70;
  lignesTotaux.forEach(([libelle, valeur], index) => {
    doc.text(libelle, xLibelle, y + index * 6);
    doc.text(nombre(valeur), droite, y + index * 6, { align: "right" });
  });

  y += lignesTotaux.length * 6;
  doc.setDrawColor(...BLEU);
  doc.line(xLibelle, y - 3.5, droite, y - 3.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("NET A PAYER", xLibelle, y + 2);
  doc.text(`${nombre(facture.montantttc)} Ar`, droite, y + 2, { align: "right" });
  y += 14;

  // ----- Montant en lettres -----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const phrase = `Arrêtée la présente facture à la somme de ${nombreEnLettres(facture.montantttc)} ariary.`;
  doc.text(doc.splitTextToSize(phrase, largeurPage - 2 * marge), marge, y);

  ajouterNumerosDePage(doc);

  // Les "/" ne sont pas permis dans un nom de fichier : 001/09-10-2026 -> 001-09-10-2026
  doc.save(`facture-${String(facture.numfacture).replace(/\//g, "-")}.pdf`);
}
