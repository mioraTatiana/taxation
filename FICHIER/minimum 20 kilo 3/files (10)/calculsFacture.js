// Toute la logique de calcul de la facture est ici : si une règle change, on ne modifie que ce fichier.

export const TAUX_TVA = 0.2; // TVA = 20 % du montant HT
export const PIQUIRE = 1000; // piquire : 1 000 Ar par facture
export const POIDS_MINIMUM_EXPRESS = 20; // une facture Express est facturée au minimum sur 20 kg
export const MAX_LIGNES = 11; // une facture imprimée tient sur une page : 11 colis (lignes) au maximum

// Transport funéraire : facturé comme un poids imposé de PPN en Express (pas de lignes de marchandises)
export const TARIF_IMPOSE_FUNERAIRE = 7267; // poids imposé (kg)
export const LIBELLE_TYPE_PPN = "PPN";
export const LIBELLE_EXPRESS = "Express";
export const LIBELLE_TYPE_FUNERAIRE = "Transport funéraire"; // ce type n'est jamais proposé dans les marchandises

// Wagon complet : seuls ces types de marchandise sont autorisés
export const TYPES_WAGON_COMPLET = ["Divers", "PPN"];

function memeTexte(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function typeAutoriseEnWagonComplet(libelleType) {
  return TYPES_WAGON_COMPLET.some((libelle) => memeTexte(libelle, libelleType));
}

// Montant TTC arrondi à la centaine supérieure : 150 050 -> 150 100 ; 158 190 -> 158 200 ; 150 000 reste 150 000
export function arrondirCentaine(montant) {
  return Math.ceil(Math.round(montant) / 100) * 100;
}

export function formaterMontant(nombre) {
  return Number(nombre || 0).toLocaleString("fr-FR");
}

// Le tarif dépend de la zone de la destination, du type de marchandise et du type de train
export function trouverTarif(tarifs, idzone, idtypemarchandise, idtypetrain) {
  return tarifs.find(
    (tarif) =>
      tarif.idzone === idzone &&
      tarif.idtypemarchandise === idtypemarchandise &&
      tarif.idtypetrain === idtypetrain
  );
}

function somme(lignes, champ) {
  return lignes.reduce((total, ligne) => total + Number(ligne[champ] || 0), 0);
}

// Totaux de la facture.
//  Express       : poids facturé = poids réel, montant = somme des lignes.
//  Wagon complet : poids facturé = poids du wagon (15 000 / 20 000 kg), facturé une seule fois,
//                  au prix le plus élevé des lignes.
export function calculerTotaux(lignes, typeTrain, avecTva) {
  const wagonComplet = Boolean(typeTrain && typeTrain.modefacturation);

  let poidsfacturetotal = somme(lignes, "poidsfacture");
  let montanthttotal = somme(lignes, "montantht");

  if (wagonComplet) {
    const prixMax = lignes.reduce((max, ligne) => Math.max(max, ligne.prixapplicable), 0);
    poidsfacturetotal = lignes.length > 0 ? typeTrain.poidsfacturation : 0;
    montanthttotal = poidsfacturetotal * prixMax;
  }

  // Express : si le poids total est inférieur à 20 kg, la facture est quand même calculée sur 20 kg.
  // Les kg manquants sont facturés au prix le plus élevé des lignes (comme pour le wagon complet).
  const poidsreeltotal = somme(lignes, "poidsreel");
  if (!wagonComplet && lignes.length > 0 && poidsreeltotal < POIDS_MINIMUM_EXPRESS) {
    const prixMax = lignes.reduce((max, ligne) => Math.max(max, ligne.prixapplicable), 0);
    montanthttotal += Math.round((POIDS_MINIMUM_EXPRESS - poidsreeltotal) * prixMax);
    poidsfacturetotal = POIDS_MINIMUM_EXPRESS;
  }

  // TVA = 20 % du montant HT, sauf "Carburant sans TVA" (avecTva = false) : TVA = 0
  const tva = avecTva ? Math.round(montanthttotal * TAUX_TVA) : 0;
  const piquire = lignes.length > 0 ? PIQUIRE : 0;

  return {
    nombrecolistotal: somme(lignes, "nombrecolis"),
    poidsreeltotal,
    poidsfacturetotal,
    montanthttotal,
    tva,
    piquire,
    // montantttc = montantht + piquire + tva, arrondi à la centaine supérieure
    montantttc: arrondirCentaine(montanthttotal + tva + piquire),
  };
}

// Le tarif du transport funéraire est celui du PPN en Express, pour la zone de la destination
export function trouverTarifFuneraire(tarifs, typesMarchandise, typesTrain, idzone) {
  const ppn = typesMarchandise.find((type) => memeTexte(type.libelletype, LIBELLE_TYPE_PPN));
  const express = typesTrain.find((type) => memeTexte(type.libelletrain, LIBELLE_EXPRESS));
  if (!ppn || !express) return null;
  return trouverTarif(tarifs, idzone, ppn.idtypemarchandise, express.idtypetrain) || null;
}

// Transport funéraire : montantht = poids imposé (7267) x tarif ; montantttc = montantht + piquire (arrondi)
export function calculerFuneraire(tarif) {
  const prixkg = tarif ? tarif.prixkg : 0;
  const montantht = TARIF_IMPOSE_FUNERAIRE * prixkg;
  const piquire = tarif ? PIQUIRE : 0;
  return { prixkg, montantht, piquire, montantttc: arrondirCentaine(montantht + piquire) };
}

// ---------- Montant en lettres (français) : 600 -> "six cents" ----------
const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

function moinsDeCent(n, finDeNombre) {
  if (n < 20) return UNITES[n];

  if (n < 70) {
    const dizaine = Math.floor(n / 10);
    const unite = n % 10;
    if (unite === 0) return DIZAINES[dizaine];
    return DIZAINES[dizaine] + (unite === 1 ? " et un" : "-" + UNITES[unite]);
  }

  if (n < 80) {
    const reste = n - 60; // 10 à 19
    return "soixante" + (reste === 11 ? " et onze" : "-" + UNITES[reste]);
  }

  if (n === 80) return finDeNombre ? "quatre-vingts" : "quatre-vingt";
  return "quatre-vingt-" + UNITES[n - 80];
}

function moinsDeMille(n, finDeNombre) {
  const centaines = Math.floor(n / 100);
  const reste = n % 100;
  let texte = "";

  if (centaines > 0) {
    texte = centaines === 1 ? "cent" : UNITES[centaines] + " cent";
    if (reste === 0 && centaines > 1 && finDeNombre) texte += "s";
  }
  if (reste > 0) {
    texte += (texte ? " " : "") + moinsDeCent(reste, finDeNombre);
  }
  return texte;
}

export function nombreEnLettres(nombre) {
  let n = Math.floor(Math.abs(Number(nombre) || 0));
  if (n === 0) return "zéro";

  const milliards = Math.floor(n / 1e9);
  n %= 1e9;
  const millions = Math.floor(n / 1e6);
  n %= 1e6;
  const milliers = Math.floor(n / 1000);
  const unites = n % 1000;

  const parties = [];
  if (milliards > 0) {
    parties.push(moinsDeMille(milliards, true) + (milliards > 1 ? " milliards" : " milliard"));
  }
  if (millions > 0) {
    parties.push(moinsDeMille(millions, true) + (millions > 1 ? " millions" : " million"));
  }
  if (milliers > 0) {
    parties.push(milliers === 1 ? "mille" : moinsDeMille(milliers, false) + " mille");
  }
  if (unites > 0) {
    parties.push(moinsDeMille(unites, true));
  }
  return parties.join(" ");
}

// Complément ajouté par le minimum de 20 kg en Express : { poids, montant }, ou null s'il n'y en a pas.
// Calculé à partir des lignes et des totaux : fonctionne aussi pour une facture déjà enregistrée.
export function complementMinimumExpress(lignes, totaux, wagonComplet) {
  if (wagonComplet) return null;
  const sommeLignes = lignes.reduce((total, ligne) => total + Number(ligne.montantht || 0), 0);
  const montant = Math.round(Number(totaux.montanthttotal || 0) - sommeLignes);
  const poids = Number(totaux.poidsfacturetotal || 0) - Number(totaux.poidsreeltotal || 0);
  if (montant <= 0 || poids <= 0) return null;
  return { poids, montant };
}
