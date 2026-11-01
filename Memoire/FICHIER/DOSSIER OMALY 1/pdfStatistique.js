import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { grouperParDate, formaterDate, recetteDe, poidsDe } from "./calculsStats";
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

function texteDePeriode(debut, fin) {
  if (!debut) return "Toutes les dates";
  if (debut === fin) return `Le ${formaterDate(debut)}`;
  return `Du ${formaterDate(debut)} au ${formaterDate(fin)}`;
}

// Crée et télécharge le PDF des statistiques (aucune fenêtre d'impression du navigateur).
//  factures     : factures de la période, avec leurs lignes (facture.details)
//  destinataire : "Directeur", "Porter" ou "Chef de division"
//                 Pour "Porter", aucun montant n'est affiché : seulement les marchandises et les poids.
//  debut / fin  : dates "AAAA-MM-JJ" de la période (facultatives)
export async function genererPdfStatistique({ factures, destinataire, debut, fin }, urlLogo) {
  const masquerMontants = destinataire === "Porter";

  const logo = await chargerImage(urlLogo);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth();
  const marge = 14;
  const droite = largeurPage - marge;

  // ----- En-tête : logo + cadre (titre, destinataire, période, date) -----
  dessinerLogo(doc, logo, marge, 12, 22);
  dessinerCadre(doc, marge + 26, 10, droite - (marge + 26), 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...NOIR);
  doc.text("Statistiques des factures", marge + 31, 19);

  doc.setFontSize(10);
  ligneInfo(doc, "Destiné à :", destinataire, marge + 31, 26);
  ligneInfo(doc, "Période :", texteDePeriode(debut, fin), marge + 31, 31);
  ligneInfo(doc, "Édité le :", new Date().toLocaleDateString("fr-FR"), marge + 31, 36);

  let y = 52;

  // ----- Une date, puis les factures de cette date -----
  grouperParDate(factures).forEach((groupe) => {
    y = verifierPage(doc, y, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NOIR);
    doc.text(formaterDate(groupe.date), marge, y);
    doc.setDrawColor(...NOIR);
    doc.setLineWidth(0.4);
    doc.line(marge, y + 2, droite, y + 2);
    y += 9;

    groupe.factures.forEach((facture) => {
      y = verifierPage(doc, y, 55);

      // Cadre : zone, client, numéro, wagon
      dessinerCadre(doc, marge, y - 5, droite - marge, 14);
      doc.setFontSize(10);
      ligneInfo(doc, "Zone :", `${facture.destinationNom} (${facture.zoneLibelle})`, marge + 3, y);
      ligneInfo(doc, "Client :", facture.clientNom, largeurPage / 2 + 5, y);
      ligneInfo(doc, "Numéro :", facture.numfacture, marge + 3, y + 5);
      ligneInfo(doc, "Wagon :", facture.wagon, largeurPage / 2 + 5, y + 5);

      // Porter : seulement la désignation, la quantité et le poids
      const entetes = masquerMontants
        ? ["Désignation", "Qt", "Poids (kg)"]
        : ["Désignation", "Qt", "Poids (kg)", "Pu (Ar)", "Total (Ar)"];

      const lignes = facture.details.map((ligne) => {
        const debutLigne = [ligne.designation, ligne.nombrecolis, nombre(ligne.poidsreel)];
        return masquerMontants
          ? debutLigne
          : [...debutLigne, nombre(ligne.prixapplicable), nombre(ligne.montantht)];
      });

      autoTable(doc, {
        startY: y + 12,
        head: [entetes],
        body: lignes,
        theme: "grid",
        margin: { left: marge, right: marge },
        styles: {
          fontSize: 9,
          cellPadding: 1.5,
          textColor: NOIR,
          lineColor: NOIR,
          lineWidth: 0.2,
          fontStyle: STYLE_TEXTE,
        },
        headStyles: { fillColor: GRIS_ENTETE, textColor: NOIR, halign: "center", fontStyle: "bold" },
        columnStyles: {
          1: { halign: "center", cellWidth: 14 },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });
      y = doc.lastAutoTable.finalY + 5;

      y = verifierPage(doc, y, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(
        `Colis : ${nombre(facture.nombrecolistotal)}   Poids : ${nombre(facture.poidsreeltotal)} kg`,
        marge,
        y
      );
      if (!masquerMontants) {
        doc.text(
          `HT : ${nombre(facture.montanthttotal)}   TVA : ${nombre(facture.tva)}   Piquire : ${nombre(facture.piquire)}   TTC : ${nombre(facture.montantttc)} Ar`,
          droite,
          y + 5,
          { align: "right" }
        );
      }
      y += masquerMontants ? 10 : 14;
    });
  });

  // ----- Total général -----
  y = verifierPage(doc, y, 14);
  doc.setDrawColor(...NOIR);
  doc.setLineWidth(0.4);
  doc.line(marge, y - 3, droite, y - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NOIR);

  const resume = masquerMontants
    ? `${factures.length} facture(s) - Poids total : ${nombre(factures.reduce((t, f) => t + poidsDe(f), 0))} kg`
    : `${factures.length} facture(s) - Total TTC : ${nombre(factures.reduce((t, f) => t + recetteDe(f), 0))} Ar`;
  doc.text(resume, droite, y + 3, { align: "right" });

  ajouterNumerosDePage(doc);
  doc.save(`statistiques-${new Date().toISOString().slice(0, 10)}.pdf`);
}
