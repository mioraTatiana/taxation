import { formaterMontant } from "./calculsFacture";

// Petits outils partagés par pdfFacture.js et pdfStatistique.js (jsPDF)

export const BLEU = [10, 108, 201]; // couleur des titres (même bleu que le site)
export const GRIS_LIGNE = [238, 243, 248]; // gris bleuté des lignes de tableau

// jsPDF affiche mal l'espace fine des nombres en français (ex: 1 500 000) :
// on la remplace par une espace normale.
export function nombre(valeur) {
  return formaterMontant(valeur).replace(/[\u00a0\u202f]/g, " ");
}

// Charge le logo. Si le logo ne se charge pas, le PDF est créé quand même (sans logo).
export function chargerImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

// Dessine le logo en gardant ses proportions et renvoie sa hauteur
export function dessinerLogo(doc, logo, x, y, largeur) {
  if (!logo) return 0;
  const hauteur = largeur * (logo.naturalHeight / logo.naturalWidth);
  doc.addImage(logo, "PNG", x, y, largeur, hauteur);
  return hauteur;
}

// "Libellé : valeur" avec le libellé en gras
export function ligneInfo(doc, libelle, valeur, x, y) {
  doc.setFont("helvetica", "bold");
  doc.text(libelle, x, y);
  const decalage = doc.getTextWidth(libelle) + 1.5;
  doc.setFont("helvetica", "normal");
  doc.text(String(valeur || ""), x + decalage, y);
}

// Passe à une nouvelle page s'il ne reste pas assez de place. Renvoie la position y à utiliser.
export function verifierPage(doc, y, besoin) {
  const hauteurPage = doc.internal.pageSize.getHeight();
  if (y + besoin > hauteurPage - 15) {
    doc.addPage();
    return 20;
  }
  return y;
}

// "Page 1 / 3" en bas de chaque page
export function ajouterNumerosDePage(doc) {
  const total = doc.getNumberOfPages();
  const largeur = doc.internal.pageSize.getWidth();
  const hauteur = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.text(`Page ${page} / ${total}`, largeur / 2, hauteur - 8, { align: "center" });
  }
  doc.setTextColor(0, 0, 0);
}
