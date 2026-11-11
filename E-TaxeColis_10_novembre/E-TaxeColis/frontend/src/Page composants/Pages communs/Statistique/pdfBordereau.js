import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formaterDate } from "../../../Simple composants/Outils/calculsStats";
import { nombre, chargerImageNoirBlanc, dessinerLogo, ajouterNumerosDePage } from "../../../Simple composants/Outils/pdfOutils";

// BORDEREAU EN PDF (bouton "Bordereau en PDF" de la page Statistique), en noir et blanc.
// Les factures sont rangées comme un tableau croisé :
//
//   ZONE
//     DESTINATION (gare / arrêt)
//       Express  ou  Wagon complet (Série 100 / 400)  ou  Funéraire
//         CLIENT
//           N° de facture
//             2 Bidon d'huile     poids   colis   montant
//       Total de la destination
//   Total de la zone
// TOTAL GÉNÉRAL
//
// Colonnes : Poids (kg), Nombre de colis, Montant (Ar).
//  - montant d'une ligne de marchandise = son montant HT
//  - montant d'une facture, d'un client, d'une destination... = montants TTC des factures (ce qui est encaissé)
//  - destinataire "Bagagiste" : la colonne Montant n'est pas imprimée
//
//  marchandises : factures de /statistique/marchandise (avec "details")
//  funeraires   : factures de /statistique/funeraire

const MARGE = 12;

function texteDePeriode(debut, fin) {
  if (!debut) return "Toutes les dates";
  if (debut === fin || !fin) return `Le ${formaterDate(debut)}`;
  return `Du ${formaterDate(debut)} au ${formaterDate(fin)}`;
}

// Transforme une facture (marchandise ou funéraire) en une forme commune
function versFactureCommune(facture, funeraire) {
  if (funeraire) {
    return {
      zone: facture.libellezone,
      destination: facture.nomdestination,
      transport: "Funéraire",
      client: facture.nomclient,
      numero: facture.numfacturefuneraire,
      poids: 0,
      colis: 0,
      montant: Number(facture.montantttcfunerare || 0),
      lignes: [{ texte: `Transport funéraire – ${facture.nomdefunt || ""}`, poids: 0, colis: 0, montant: Number(facture.montanthttfuneraire || 0) }],
    };
  }
  const wagonComplet = Boolean(facture.modefacturation);
  return {
    zone: facture.libellezone,
    destination: facture.nomdestination,
    transport: wagonComplet ? `Wagon complet – ${facture.libelletypewagon}` : "Express",
    client: facture.nomclient,
    numero: facture.numfacturemarchandise,
    poids: Number(facture.poidsreeltotal || 0),
    colis: Number(facture.nombrecolistotal || 0),
    montant: Number(facture.montantttc || 0),
    // Wagon complet : la 1re ligne est le wagon (son montant porte tout le prix)
    lignes: (facture.details || []).map((ligne, index) => ({
      texte: wagonComplet && index === 0 ? `Wagon ${facture.libelletypewagon} (${ligne.designation})` : `${nombre(ligne.nombrecolis)} ${ligne.designation}`,
      poids: wagonComplet && index === 0 ? null : Number(ligne.poidsreel || 0),
      colis: wagonComplet && index === 0 ? null : Number(ligne.nombrecolis || 0),
      // marchandise chargée dans un wagon complet : pas de prix (tout est sur la ligne du wagon)
      montant: wagonComplet && index > 0 ? null : Number(ligne.montantht || 0),
    })),
  };
}

// Regroupe une liste par une clé, dans l'ordre alphabétique : [{ cle, elements }]
function grouper(liste, cleDe) {
  const groupes = new Map();
  liste.forEach((element) => {
    const cle = cleDe(element) || "-";
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(element);
  });
  return [...groupes.entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b), "fr", { numeric: true }))
    .map(([cle, elements]) => ({ cle, elements }));
}

function sommes(factures) {
  return factures.reduce(
    (t, f) => ({ poids: t.poids + f.poids, colis: t.colis + f.colis, montant: t.montant + f.montant }),
    { poids: 0, colis: 0, montant: 0 }
  );
}

export async function genererPdfBordereau({ marchandises, funeraires, destinataire, typeFactures, wagon, debut, fin }, urlLogo) {
  const masquerMontants = destinataire === "Bagagiste";
  const logo = await chargerImageNoirBlanc(urlLogo);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeurPage = doc.internal.pageSize.getWidth();

  // ----- En-tête -----
  const hauteurLogo = dessinerLogo(doc, logo, MARGE, 10, 22);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("BORDEREAU DES FACTURES", MARGE + 27, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Chemin de fer Fianarantsoa – Côte Est", MARGE + 27, 24);

  let y = 10 + Math.max(hauteurLogo, 18) + 6;
  const infos = [
    ["Destinataire", destinataire],
    ["Factures", typeFactures],
    ["Wagon", wagon],
    ["Période", texteDePeriode(debut, fin)],
    ["Édité le", new Date().toLocaleDateString("fr-FR")],
  ];
  infos.forEach(([libelle, valeur], index) => {
    const x = index % 2 === 0 ? MARGE : largeurPage / 2;
    const yi = y + Math.floor(index / 2) * 6;
    doc.setFont("helvetica", "normal");
    doc.text(`${libelle} :`, x, yi);
    doc.setFont("helvetica", "bold");
    doc.text(String(valeur || "-"), x + doc.getTextWidth(`${libelle} : `), yi);
  });
  y += Math.ceil(infos.length / 2) * 6 + 2;

  // ----- Lignes du tableau croisé -----
  const factures = [
    ...marchandises.map((f) => versFactureCommune(f, false)),
    ...funeraires.map((f) => versFactureCommune(f, true)),
  ];

  const corps = [];
  // Une ligne : niveau = retrait (0 à 5), style = "groupe" | "total" | "general" | null
  function ajouter(libelle, valeurs, niveau, style) {
    const gras = style === "groupe" || style === "total" || style === "general";
    const cellule = (contenu, align) => ({
      content: contenu,
      styles: {
        halign: align,
        fontStyle: gras ? "bold" : "normal",
        fontSize: style === "general" ? 11 : 10,
        cellPadding: { top: 1.3, bottom: 1.3, left: align === "left" ? 2 + niveau * 4.5 : 2, right: 2 },
        lineWidth: style === "total" || style === "general" ? { top: 0.4 } : 0,
      },
    });
    const ligne = [
      cellule(libelle, "left"),
      cellule(valeurs ? (valeurs.poids === null ? "" : nombre(valeurs.poids)) : "", "right"),
      cellule(valeurs ? (valeurs.colis === null ? "" : nombre(valeurs.colis)) : "", "right"),
    ];
    if (!masquerMontants) {
      ligne.push(cellule(valeurs && valeurs.montant !== null ? nombre(valeurs.montant) : "", "right"));
    }
    corps.push(ligne);
  }

  grouper(factures, (f) => f.zone).forEach((zone) => {
    ajouter(String(zone.cle).toUpperCase(), sommes(zone.elements), 0, "groupe");

    grouper(zone.elements, (f) => f.destination).forEach((destination) => {
      ajouter(String(destination.cle).toUpperCase(), null, 1, "groupe");

      grouper(destination.elements, (f) => f.transport).forEach((transport) => {
        ajouter(transport.cle, sommes(transport.elements), 2, "groupe");

        grouper(transport.elements, (f) => f.client).forEach((client) => {
          ajouter(client.cle, sommes(client.elements), 3, "groupe");

          client.elements.forEach((facture) => {
            ajouter(`Facture ${facture.numero}`, facture, 4, null);
            facture.lignes.forEach((ligne) => ajouter(ligne.texte, ligne, 5, null));
          });
        });
      });

      // Total à la fin de chaque gare / destination
      ajouter(`Total ${destination.cle}`, sommes(destination.elements), 1, "total");
    });

    ajouter(`Total ${zone.cle}`, sommes(zone.elements), 0, "total");
  });

  // Total général de toutes les factures
  ajouter("TOTAL GÉNÉRAL", sommes(factures), 0, "general");

  const entete = ["Étiquettes", "Poids (kg)", "Nombre colis"];
  if (!masquerMontants) entete.push("Montant (Ar)");

  autoTable(doc, {
    theme: "plain",
    startY: y,
    margin: { left: MARGE, right: MARGE, bottom: 16 },
    head: [entete],
    body: corps,
    showHead: "everyPage",
    styles: { font: "helvetica", fontSize: 10, textColor: [0, 0, 0], lineColor: [0, 0, 0], fillColor: false },
    headStyles: { fontStyle: "bold", halign: "center", lineWidth: { bottom: 0.5 }, fillColor: false },
    columnStyles: masquerMontants
      ? { 1: { cellWidth: 32 }, 2: { cellWidth: 32 } }
      : { 1: { cellWidth: 28 }, 2: { cellWidth: 28 }, 3: { cellWidth: 34 } },
  });

  if (masquerMontants) {
    const yNote = doc.lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Document destiné au bagagiste : les montants ne sont pas indiqués.", MARGE, yNote);
  }

  ajouterNumerosDePage(doc);
  doc.save(`bordereau-${debut || "toutes-dates"}${fin && fin !== debut ? `-au-${fin}` : ""}.pdf`);
}
