// Toute la logique de calcul de la facture est ici : si une règle change, on ne modifie que ce fichier.

export const TAUX_TVA = 0.2; // TODO : confirmer le taux de TVA
export const PIQUIRE = 0; // TODO : règle de calcul de la "piquire" à préciser
export const LIBELLE_TYPE_FUNERAIRE = "Transport funéraire"; // libellé du type dans la table typemarchandise

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

  const tva = avecTva ? Math.round(montanthttotal * TAUX_TVA) : 0;

  return {
    nombrecolistotal: somme(lignes, "nombrecolis"),
    poidsreeltotal: somme(lignes, "poidsreel"),
    poidsfacturetotal,
    montanthttotal,
    tva,
    piquire: PIQUIRE,
    montantttc: montanthttotal + tva + PIQUIRE,
  };
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
