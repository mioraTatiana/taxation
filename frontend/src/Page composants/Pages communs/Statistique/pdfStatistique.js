import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { grouperParDate, formaterDate, recetteDe } from "../../../Simple composants/Outils/calculsStats";
import {
  BLEU,
  nombre,
  chargerImage,
  dessinerLogo,
  ligneInfo,
  verifierPage,
  ajouterNumerosDePage,
} from "../../../Simple composants/Outils/pdfOutils";

function texteDePeriode(debut, fin) {
  if (!debut) return "Toutes les dates";
  if (debut === fin) return `Le ${formaterDate(debut)}`;
  return `Du ${formaterDate(debut)} au ${formaterDate(fin)}`;
}

// Crée et télécharge le PDF des statistiques (aucune fenêtre d'impression du navigateur).
//  factures     : factures de la période, avec leurs lignes (facture.details)
//  destinataire : "Directeur", "Porter" ou "Chef de division" (affiché en en-tête)
//  debut / fin  : dates "AAAA-MM-JJ" de la période (facultatives)
export async function genererPdfStatistique({ factures, destinataire, debut, fin }, urlLogo) {
  const logo = await chargerImage(urlLogo);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth();
  const marge = 14;
  const droite = largeurPage - marge;

  // ----- En-tête -----
  dessinerLogo(doc, logo, marge, 10, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BLEU);
  doc.text("Statistiques des factures", marge + 28, 20);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  ligneInfo(doc, "Destiné à :", destinataire, marge + 28, 27);
  ligneInfo(doc, "Période :", texteDePeriode(debut, fin), marge + 28, 32);
  ligneInfo(doc, "Édité le :", new Date().toLocaleDateString("fr-FR"), marge + 28, 37);

  let y = 48;

  // ----- Une date, puis les factures de cette date -----
  grouperParDate(factures).forEach((groupe) => {
    y = verifierPage(doc, y, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BLEU);
    doc.text(formaterDate(groupe.date), marge, y);
    doc.setDrawColor(...BLEU);
    doc.line(marge, y + 2, droite, y + 2);
    y += 9;

    groupe.factures.forEach((facture) => {
      y = verifierPage(doc, y, 55);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      ligneInfo(doc, "Zone :", `${facture.destinationNom} (${facture.zoneLibelle})`, marge, y);
      ligneInfo(doc, "Client :", facture.clientNom, largeurPage / 2 + 5, y);
      ligneInfo(doc, "Numéro :", facture.numfacture, marge, y + 5);
      ligneInfo(doc, "Wagon :", facture.wagon, largeurPage / 2 + 5, y + 5);

      autoTable(doc, {
        startY: y + 8,
        head: [["Désignation", "Qt", "Poids (kg)", "Pu (Ar)", "Total (Ar)"]],
        body: facture.details.map((ligne) => [
          ligne.designation,
          ligne.nombrecolis,
          nombre(ligne.poidsreel),
          nombre(ligne.prixapplicable),
          nombre(ligne.montantht),
        ]),
        theme: "grid",
        margin: { left: marge, right: marge },
        styles: { fontSize: 9, cellPadding: 1.5 },
        headStyles: { fillColor: BLEU, textColor: 255, halign: "center" },
        columnStyles: {
          1: { halign: "center", cellWidth: 14 },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });
      y = doc.lastAutoTable.finalY + 5;

      y = verifierPage(doc, y, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Colis : ${nombre(facture.nombrecolistotal)}   Poids : ${nombre(facture.poidsreeltotal)} kg`,
        marge,
        y
      );
      doc.setFont("helvetica", "bold");
      doc.text(
        `HT : ${nombre(facture.montanthttotal)}   TVA : ${nombre(facture.tva)}   Piquire : ${nombre(facture.piquire)}   TTC : ${nombre(facture.montantttc)} Ar`,
        droite,
        y + 5,
        { align: "right" }
      );
      y += 14;
    });
  });

  // ----- Total général -----
  y = verifierPage(doc, y, 14);
  const totalGeneral = factures.reduce((total, facture) => total + recetteDe(facture), 0);
  doc.setDrawColor(0, 0, 0);
  doc.line(marge, y - 3, droite, y - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`${factures.length} facture(s) - Total TTC : ${nombre(totalGeneral)} Ar`, droite, y + 3, {
    align: "right",
  });

  ajouterNumerosDePage(doc);
  doc.save(`statistiques-${new Date().toISOString().slice(0, 10)}.pdf`);
}
