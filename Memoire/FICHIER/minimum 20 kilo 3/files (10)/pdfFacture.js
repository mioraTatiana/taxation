import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nombreEnLettres, POIDS_MINIMUM_EXPRESS, complementMinimumExpress } from "./calculsFacture";
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
  verifierPage,
  ajouterNumerosDePage,
} from "./pdfOutils";

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
  doc.setTextColor(...NOIR);
  doc.text("FACTURE", marge + 32, 24);

  doc.setFontSize(11);
  doc.text(`N° ${facture.numfacture}`, droite, 18, { align: "right" });
  doc.text(`Date : ${formaterDate(facture.datefacture)}`, droite, 25, { align: "right" });

  // ----- Cadre des informations : destination, wagon, client... -----
  const yCadre = 40;
  dessinerCadre(doc, marge, yCadre, largeurPage - 2 * marge, 42);

  doc.setFontSize(11);
  let y = yCadre + 8;
  ligneInfo(doc, "Destination :", `${facture.destinationNom} - ${facture.zoneLibelle}`, marge + 4, y);
  y += 7;
  ligneInfo(doc, "Wagon :", facture.wagon, marge + 4, y);
  y += 7;
  ligneInfo(doc, "Client :", facture.clientNom, marge + 4, y);
  y += 7;
  ligneInfo(doc, "Tél :", facture.clientTelephone, marge + 4, y);
  y += 7;
  ligneInfo(doc, "Adresse :", facture.clientAdresse, marge + 4, y);

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

  // Express : ligne de complément si le poids total est sous le minimum de 20 kg
  const complement = complementMinimumExpress(facture.details, facture, wagonComplet);
  if (complement) {
    lignes.push(["", "", `Complément (minimum express ${POIDS_MINIMUM_EXPRESS} kg)`, nombre(complement.poids), "", nombre(complement.montant)]);
  }

  autoTable(doc, {
    startY: yCadre + 42 + 6,
    head: [entetes],
    body: lignes,
    theme: "grid",
    margin: { left: marge, right: marge },
    styles: {
      fontSize: 10,
      cellPadding: 2,
      textColor: NOIR,
      lineColor: NOIR,
      lineWidth: 0.2,
      fontStyle: STYLE_TEXTE,
    },
    headStyles: { fillColor: GRIS_ENTETE, textColor: NOIR, halign: "center", fontStyle: "bold" },
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

  // ----- Totaux dans un cadre -----
  y = verifierPage(doc, y, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Nombre de colis : ${nombre(facture.nombrecolistotal)}`, marge, y + 4);
  doc.text(`Poids total : ${nombre(facture.poidsreeltotal)} kg`, marge, y + 10);

  const boiteLargeur = 74;
  const boiteX = droite - boiteLargeur;
  dessinerCadre(doc, boiteX, y - 2, boiteLargeur, 36);

  const lignesTotaux = [
    ["TOTAL HT", facture.montanthttotal],
    ["TVA", facture.tva],
    ["Piquire", facture.piquire],
  ];
  lignesTotaux.forEach(([libelle, valeur], index) => {
    doc.text(libelle, boiteX + 4, y + 5 + index * 6);
    doc.text(nombre(valeur), droite - 4, y + 5 + index * 6, { align: "right" });
  });

  const yNet = y + 5 + lignesTotaux.length * 6;
  doc.line(boiteX + 4, yNet - 4, droite - 4, yNet - 4);
  doc.setFontSize(12);
  doc.text("NET A PAYER", boiteX + 4, yNet + 3);
  doc.text(`${nombre(facture.montantttc)} Ar`, droite - 4, yNet + 3, { align: "right" });
  y = y + 36 + 8;

  // ----- Montant en lettres -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const phrase = `Arrêtée la présente facture à la somme de ${nombreEnLettres(facture.montantttc)} ariary.`;
  doc.text(doc.splitTextToSize(phrase, largeurPage - 2 * marge), marge, y);

  ajouterNumerosDePage(doc);

  // Les "/" ne sont pas permis dans un nom de fichier : 001/09-10-2026 -> 001-09-10-2026
  doc.save(`facture-${String(facture.numfacture).replace(/\//g, "-")}.pdf`);
}
