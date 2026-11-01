import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { grouperParDate, formaterDate } from "../../../Simple composants/Outils/calculsStats";
import { complementMinimum } from "../../../Simple composants/Outils/calculsFacture";
import {
  BLEU,
  nombre,
  chargerImage,
  dessinerLogo,
  ligneInfo,
  verifierPage,
  ajouterNumerosDePage,
} from "../../../Simple composants/Outils/pdfOutils";

// PDF des statistiques (aucune fenêtre d'impression du navigateur).
// Deux parties bien séparées : 1) factures des marchandises  2) factures des transports funéraires
//  marchandises : factures de /statistique/marchandise (avec leurs lignes "details")
//  funeraires   : factures de /statistique/funeraire
//  destinataire : "Directeur", "Porteur" ou "Chef de division" (le Porteur ne voit aucun montant)
//  debut / fin  : dates "AAAA-MM-JJ" de la période (facultatives)

function texteDePeriode(debut, fin) {
  if (!debut) return "Toutes les dates";
  if (debut === fin || !fin) return `Le ${formaterDate(debut)}`;
  return `Du ${formaterDate(debut)} au ${formaterDate(fin)}`;
}

// Titre d'une partie (ex: "Factures des marchandises")
function titrePartie(doc, texte, y, marge, droite) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BLEU);
  doc.text(texte, marge, y);
  doc.setDrawColor(...BLEU);
  doc.setLineWidth(0.6);
  doc.line(marge, y + 2, droite, y + 2);
  doc.setLineWidth(0.2);
  return y + 10;
}

// Date d'un groupe de factures
function titreDate(doc, date, y, marge) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BLEU);
  doc.text(formaterDate(date), marge, y);
  return y + 6;
}

function styleTableau(marge) {
  return {
    theme: "grid",
    margin: { left: marge, right: marge },
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { fillColor: BLEU, textColor: 255, halign: "center" },
  };
}

export async function genererPdfStatistique({ marchandises, funeraires, destinataire, debut, fin }, urlLogo) {
  const masquerMontants = destinataire === "Porteur";

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

  let y = 50;

  // ===================== 1) MARCHANDISES =====================
  if (marchandises.length > 0) {
    y = titrePartie(doc, "Factures des marchandises", y, marge, droite);

    grouperParDate(marchandises, "datefacturemarchandise").forEach((groupe) => {
      y = verifierPage(doc, y, 50);
      y = titreDate(doc, groupe.date, y, marge);

      groupe.factures.forEach((facture) => {
        y = verifierPage(doc, y, 45);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        ligneInfo(doc, "Destination :", `${facture.nomdestination} (${facture.libellezone})`, marge, y);
        ligneInfo(doc, "Client :", facture.nomclient, largeurPage / 2 + 5, y);
        ligneInfo(doc, "Numéro :", facture.numfacturemarchandise, marge, y + 5);
        ligneInfo(doc, "Wagon :", facture.libelletypewagon, largeurPage / 2 + 5, y + 5);

        // Porteur : seulement la désignation, la quantité et le poids
        const lignes = facture.details.map((ligne) => {
          const designation = ligne.idmarchandise ? ligne.designation : `${ligne.designation} (wagon)`;
          const debutLigne = [designation, nombre(ligne.nombrecolis), nombre(ligne.poidsreel)];
          return masquerMontants
            ? debutLigne
            : [...debutLigne, nombre(ligne.poidsfacture), nombre(ligne.prixapplicable), nombre(ligne.montantht)];
        });

        const complement = complementMinimum(facture);
        if (complement && !masquerMontants) {
          lignes.push(["Complément minimum 20 kg", "", "", nombre(complement.poids), "", nombre(complement.montant)]);
        }

        autoTable(doc, {
          ...styleTableau(marge),
          startY: y + 8,
          head: [
            masquerMontants
              ? ["Désignation", "Qt", "Poids (kg)"]
              : ["Désignation", "Qt", "Poids réel", "Poids fact.", "Pu (Ar)", "Total (Ar)"],
          ],
          body: lignes,
          columnStyles: {
            1: { halign: "center", cellWidth: 14 },
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "right" },
            5: { halign: "right" },
          },
        });
        y = doc.lastAutoTable.finalY + 5;

        y = verifierPage(doc, y, 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Colis : ${nombre(facture.nombrecolistotal)}   Poids : ${nombre(facture.poidsreeltotal)} kg`,
          marge,
          y
        );
        if (!masquerMontants) {
          doc.text(
            `HT : ${nombre(facture.montanthttotal)}   TVA : ${nombre(facture.tva)}   Piquire : ${nombre(facture.piquiremarchandise)}   TTC : ${nombre(facture.montantttc)} Ar`,
            droite,
            y + 5,
            { align: "right" }
          );
        }
        y += masquerMontants ? 10 : 14;
      });
    });

    // Total des marchandises
    y = verifierPage(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BLEU);
    const totalMarchandises = masquerMontants
      ? `${marchandises.length} facture(s) - Poids total : ${nombre(marchandises.reduce((t, f) => t + Number(f.poidsreeltotal), 0))} kg`
      : `${marchandises.length} facture(s) - Total TTC : ${nombre(marchandises.reduce((t, f) => t + Number(f.montantttc), 0))} Ar`;
    doc.text(totalMarchandises, droite, y, { align: "right" });
    y += 14;
  }

  // ===================== 2) TRANSPORTS FUNÉRAIRES =====================
  if (funeraires.length > 0) {
    y = verifierPage(doc, y, 40);
    y = titrePartie(doc, "Factures des transports funéraires", y, marge, droite);

    grouperParDate(funeraires, "datefacturefuneraire").forEach((groupe) => {
      y = verifierPage(doc, y, 30);
      y = titreDate(doc, groupe.date, y, marge);

      const lignes = groupe.factures.map((f) => {
        const debutLigne = [f.numfacturefuneraire, f.nomclient, f.nomdefunt, `${f.nomdestination} (${f.libellezone})`];
        return masquerMontants
          ? debutLigne
          : [...debutLigne, nombre(f.montanthttfuneraire), nombre(f.piquirefuneraire), nombre(f.montantttcfunerare)];
      });

      autoTable(doc, {
        ...styleTableau(marge),
        startY: y,
        head: [
          masquerMontants
            ? ["Numéro", "Client", "Défunt", "Destination"]
            : ["Numéro", "Client", "Défunt", "Destination", "HT", "Piquire", "TTC (Ar)"],
        ],
        body: lignes,
        columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
      });
      y = doc.lastAutoTable.finalY + 8;
    });

    // Total des transports funéraires
    y = verifierPage(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BLEU);
    const totalFuneraires = masquerMontants
      ? `${funeraires.length} facture(s) funéraire(s)`
      : `${funeraires.length} facture(s) - Total TTC : ${nombre(funeraires.reduce((t, f) => t + Number(f.montantttcfunerare), 0))} Ar`;
    doc.text(totalFuneraires, droite, y, { align: "right" });
    y += 12;
  }

  // ===================== TOTAL GÉNÉRAL =====================
  if (!masquerMontants && marchandises.length > 0 && funeraires.length > 0) {
    y = verifierPage(doc, y, 14);
    const total =
      marchandises.reduce((t, f) => t + Number(f.montantttc), 0) +
      funeraires.reduce((t, f) => t + Number(f.montantttcfunerare), 0);
    doc.setDrawColor(0, 0, 0);
    doc.line(marge, y - 4, droite, y - 4);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Total général : ${marchandises.length + funeraires.length} facture(s) - ${nombre(total)} Ar`,
      droite,
      y + 2,
      { align: "right" }
    );
  }

  ajouterNumerosDePage(doc);
  doc.save(`statistiques-${new Date().toISOString().slice(0, 10)}.pdf`);
}
