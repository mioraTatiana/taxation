// Toute la logique de calcul des factures est ici : si une règle change, on ne modifie que ce fichier.

export const TAUX_TVA = 0.2; // TVA = 20 % du montant HT
export const PIQUIRE = 1000; // piquire : 1 000 Ar par facture
export const MAX_LIGNES_EXPRESS = 11; // une facture Express contient 11 marchandises au maximum
export const POIDS_MINIMUM_EXPRESS = 20; // une facture Express est facturée au minimum sur 20 kg

// Wagon complet : les poids viennent de la table typewagon (page "Type de wagon") :
//   poidsfacturation = poids FACTURÉ  (Série 100 : 20 000 kg, Série 400 : 25 000 kg)
//   poidssupporte    = poids SUPPORTÉ (Série 100 : 15 000 kg, Série 400 : 20 000 kg) = charge maximum

// Wagon complet : la taxation se fait en PPN ou en Divers
export const TYPES_WAGON_COMPLET = ["PPN", "Divers"];

function memeTexte(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function typeAutoriseEnWagonComplet(libelleType) {
  return TYPES_WAGON_COMPLET.some((libelle) => memeTexte(libelle, libelleType));
}

// true si le type de wagon est un wagon complet (série 100, série 400)
export function estWagonComplet(typeWagon) {
  return Boolean(typeWagon && typeWagon.modefacturation);
}

// Poids maximal des marchandises dans un wagon complet (= poids supporté)
export function poidsMaxWagon(typeWagon) {
  if (!typeWagon) return 0;
  return Number(typeWagon.poidssupporte) || Number(typeWagon.poidsfacturation) || 0;
}

// Le montant HT et la TVA peuvent avoir des virgules : on garde 2 chiffres après la virgule
export function arrondir2(nombre) {
  return Math.round(Number(nombre || 0) * 100) / 100;
}

// Montant TTC :
//  1) on enlève les virgules (arrondi à l'unité)
//  2) s'il reste quelque chose après les centaines, on passe à la centaine suivante
//     16 250 -> 16 300 ; 16 205 -> 16 300 ; 16 200 reste 16 200
export function arrondirTTC(montant) {
  const entier = Math.round(Number(montant || 0));
  return Math.ceil(entier / 100) * 100;
}

// 1500000 -> "1 500 000" ; 1234.5 -> "1 234,5"
export function formaterMontant(nombre) {
  return Number(nombre || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

// Le tarif dépend de la zone de la destination, du type de marchandise et du type de wagon
export function trouverTarif(tarifs, idzone, idtypemarchandise, idtypewagon) {
  return (
    tarifs.find(
      (tarif) =>
        tarif.idzone === idzone &&
        tarif.idtypemarchandise === idtypemarchandise &&
        tarif.idtypewagon === idtypewagon
    ) || null
  );
}

// Le tarif funéraire dépend de la zone de la destination
export function trouverTarifFuneraire(tarifsFuneraires, idzone) {
  return tarifsFuneraires.find((tarif) => tarif.idzone === idzone) || null;
}

function somme(lignes, champ) {
  return lignes.reduce((total, ligne) => total + Number(ligne[champ] || 0), 0);
}


// ===================== LIGNES DE MARCHANDISES =====================

// Clé d'une ligne : l'id de la marchandise, ou la désignation écrite à la main + son type.
// Deux lignes avec la même clé sont la même marchandise (on additionne).
export function cleLigne(ligne) {
  if (ligne.idmarchandise) return `m${ligne.idmarchandise}`;
  return `d${String(ligne.designation || "").trim().toLowerCase()}|${ligne.idtypemarchandise || ""}`;
}

// Crée la ligne d'une marchandise.
//  marchandise : une ligne de la table marchandise, OU une désignation écrite à la main :
//                { idmarchandise: null, designation, idtypemarchandise, libelletype }
//  poidsreel   : facultatif. Rempli = "Poids non réglé" (le taxateur écrit le poids réel).
//                Vide = "Poids réglé" : poids réel = nombre de colis x poids d'un colis (table marchandise)
//  Express       : poids facturé = poids réel, prix applicable = tarif, montant = poids facturé x prix
//  Wagon complet : tarif 0, prix 0, montant 0, poids facturé = poids facturé du wagon
//                  (c'est la 1re ligne, la ligne "wagon", qui porte le prix)
export function creerLigne({ marchandise, nombrecolis, poidsreel: poidsSaisi, tarif, typeWagon, idwagon }) {
  const wagonComplet = estWagonComplet(typeWagon);
  const poidsregle = poidsSaisi === undefined || poidsSaisi === null;
  const poidsreel = poidsregle
    ? arrondir2(nombrecolis * Number(marchandise.poidscolis || 0)) // nombre de colis x poids d'un colis
    : arrondir2(poidsSaisi);
  const poidsfacture = wagonComplet ? Number(typeWagon.poidsfacturation) : poidsreel;
  const prixapplicable = wagonComplet ? 0 : tarif.prixkg;

  const ligne = {
    idmarchandise: marchandise.idmarchandise || null,
    designation: marchandise.designation,
    idtypemarchandise: marchandise.idtypemarchandise,
    libelletype: marchandise.libelletype,
    idtarifmarchandise: tarif.idtarifmarchandise,
    idwagon: idwagon || null,
    nombrecolis,
    poidsreel,
    poidsfacture,
    prixapplicable,
    montantht: arrondir2(poidsfacture * prixapplicable),
    poidsregle,
  };
  return { ...ligne, cle: cleLigne(ligne) };
}

// Deux lignes de la même marchandise -> une seule ligne : on additionne les colis et les poids
function fusionner(ancienne, nouvelle, wagonComplet) {
  const nombrecolis = ancienne.nombrecolis + nouvelle.nombrecolis;
  const poidsreel = arrondir2(ancienne.poidsreel + nouvelle.poidsreel);
  const poidsfacture = wagonComplet ? ancienne.poidsfacture : poidsreel;

  return {
    ...ancienne,
    nombrecolis,
    poidsreel,
    poidsfacture,
    montantht: arrondir2(poidsfacture * ancienne.prixapplicable),
  };
}

// Ajoute une ligne à la facture.
// Si la marchandise y est déjà, on additionne ses colis et ses poids (comme une modification).
export function ajouterLigne(lignes, nouvelle, wagonComplet) {
  const index = lignes.findIndex((ligne) => cleLigne(ligne) === cleLigne(nouvelle));
  if (index === -1) return [...lignes, nouvelle];
  return lignes.map((ligne, i) => (i === index ? fusionner(ligne, nouvelle, wagonComplet) : ligne));
}

// Remplace la ligne "index" (bouton Modifier).
// Si on choisit une marchandise qui est déjà sur une autre ligne, les deux lignes sont additionnées.
export function remplacerLigne(lignes, index, nouvelle, wagonComplet) {
  if (index < 0) return ajouterLigne(lignes, nouvelle, wagonComplet);
  const autres = lignes.filter((ligne, i) => i !== index);
  const doublon = autres.findIndex((ligne) => cleLigne(ligne) === cleLigne(nouvelle));
  if (doublon !== -1) return ajouterLigne(autres, nouvelle, wagonComplet);
  return lignes.map((ligne, i) => (i === index ? nouvelle : ligne));
}


// ===================== WAGON COMPLET =====================

// Contrôles avant d'ajouter / modifier une ligne. Renvoie un message d'erreur, ou null si tout va bien.
//  lignes   : les lignes déjà sur la facture
//  cleModif : clé de la ligne en cours de modification (ou null)
export function verifierLigne(lignes, ligne, cleModif, typeWagon) {
  const wagonComplet = estWagonComplet(typeWagon);
  if (!(ligne.poidsreel > 0)) {
    return "Le poids réel doit être supérieur à 0";
  }

  // Express : 11 marchandises au maximum (une marchandise déjà présente ne compte pas en plus)
  const dejaPresente = lignes.some((l) => cleLigne(l) === cleLigne(ligne));
  if (!wagonComplet && cleModif === null && !dejaPresente && lignes.length >= MAX_LIGNES_EXPRESS) {
    return `Une facture Express contient ${MAX_LIGNES_EXPRESS} marchandises au maximum`;
  }

  // Wagon complet : poids supporté par le wagon
  if (wagonComplet) {
    const poidsMax = poidsMaxWagon(typeWagon);
    const poidsAutres = lignes.filter((l) => cleLigne(l) !== cleModif).reduce((t, l) => t + Number(l.poidsreel), 0);
    if (poidsAutres + ligne.poidsreel > poidsMax) {
      const disponible = Math.max(0, poidsMax - poidsAutres);
      return `Le wagon est plein : il reste ${formaterMontant(disponible)} kg (maximum supporté ${formaterMontant(poidsMax)} kg)`;
    }
  }
  return null;
}


// 1re ligne d'une facture wagon complet :
//  désignation et type = le type choisi dans le détail d'embarquement (PPN ou Divers)
//  nombre de colis et poids réel = somme des marchandises ajoutées
//  poids facturé = poids facturé du wagon (table typewagon : 20 000 / 25 000 kg)
//  prix applicable = tarif ; montant = prix applicable x poids facturé
export function creerLigneWagon(lignes, typeMarchandise, tarif, typeWagon, idwagon) {
  const prixapplicable = tarif ? tarif.prixkg : 0;
  const poidsfacture = typeWagon ? Number(typeWagon.poidsfacturation) : 0;

  return {
    idmarchandise: null, // pas de marchandise : c'est la ligne du wagon
    designation: typeMarchandise ? typeMarchandise.libelletype : "",
    idtypemarchandise: typeMarchandise ? typeMarchandise.idtypemarchandise : "",
    libelletype: typeMarchandise ? typeMarchandise.libelletype : "",
    idtarifmarchandise: tarif ? tarif.idtarifmarchandise : "",
    idwagon: idwagon || null,
    nombrecolis: somme(lignes, "nombrecolis"),
    poidsreel: arrondir2(somme(lignes, "poidsreel")),
    poidsfacture,
    prixapplicable,
    montantht: arrondir2(prixapplicable * poidsfacture),
    cle: "wagon",
  };
}

// Wagon complet : la ligne du wagon est toujours la 1re ligne de la facture ;
// les suivantes sont les marchandises chargées (prix 0).
export function estLigneWagon(facture, index) {
  return Boolean(facture.modefacturation) && index === 0;
}


// Lignes envoyées au backend (colonnes de la table detailfacture)
export function lignesPourEnvoi(lignes) {
  return lignes.map((ligne) => ({
    nombrecolis: ligne.nombrecolis,
    poidsreel: ligne.poidsreel,
    poidsfacture: ligne.poidsfacture,
    prixapplicable: ligne.prixapplicable,
    montantht: ligne.montantht,
    idtarifmarchandise: ligne.idtarifmarchandise,
    idmarchandise: ligne.idmarchandise || null, // null : ligne "wagon complet" ou désignation écrite à la main
    idwagon: ligne.idwagon || null,
    designation: ligne.designation || null, // gardée dans detailfacture.designation
  }));
}


// ===================== TOTAUX =====================

// Totaux de la facture (noms des colonnes de la table facturemarchandise).
//  lignesFacturees : Express = toutes les lignes ; wagon complet = [ligne du wagon]
//  Express : minimum 20 kg. En dessous, les kilos manquants sont facturés au prix le plus élevé des lignes.
export function calculerTotaux(lignesFacturees, wagonComplet, avecTva) {
  const nombrecolistotal = somme(lignesFacturees, "nombrecolis");
  const poidsreeltotal = arrondir2(somme(lignesFacturees, "poidsreel"));
  let poidsfacturetotal = arrondir2(somme(lignesFacturees, "poidsfacture"));
  let montanthttotal = somme(lignesFacturees, "montantht");

  if (!wagonComplet && lignesFacturees.length > 0 && poidsreeltotal < POIDS_MINIMUM_EXPRESS) {
    const prixMax = Math.max(...lignesFacturees.map((ligne) => ligne.prixapplicable));
    montanthttotal += (POIDS_MINIMUM_EXPRESS - poidsreeltotal) * prixMax;
    poidsfacturetotal = POIDS_MINIMUM_EXPRESS;
  }

  montanthttotal = arrondir2(montanthttotal);
  const tva = avecTva ? arrondir2(montanthttotal * TAUX_TVA) : 0;
  const piquiremarchandise = lignesFacturees.length > 0 ? PIQUIRE : 0;

  return {
    nombrecolistotal,
    poidsreeltotal,
    poidsfacturetotal,
    montanthttotal,
    tva,
    piquiremarchandise,
    // montantttc = montant HT + TVA + piquire, arrondi (voir arrondirTTC)
    montantttc: arrondirTTC(montanthttotal + tva + piquiremarchandise),
  };
}

// Complément du minimum de 20 kg (Express), pour l'afficher sur la facture :
// { poids, montant } ou null s'il n'y en a pas. Marche aussi pour une facture déjà en base.
export function complementMinimum(facture) {
  if (facture.modefacturation) return null;
  const poids = arrondir2(facture.poidsfacturetotal - facture.poidsreeltotal);
  if (poids <= 0) return null;
  const montant = arrondir2(facture.montanthttotal - somme(facture.details || [], "montantht"));
  return { poids, montant };
}


// ===================== TRANSPORT FUNÉRAIRE =====================

// Montant HT = prix fixe x tarif (prixzone) ; TTC = HT + piquire, arrondi. Pas de TVA.
export function calculerFuneraire(tarif) {
  const prixzone = tarif ? Number(tarif.prixzone || 0) : 0;
  const prixfixe = tarif ? Number(tarif.prixfixe || 0) : 0;
  const montanthttfuneraire = arrondir2(prixfixe * prixzone);
  const piquirefuneraire = tarif ? PIQUIRE : 0;

  return {
    prixzone,
    prixfixe,
    montanthttfuneraire,
    piquirefuneraire,
    montantttcfunerare: arrondirTTC(montanthttfuneraire + piquirefuneraire),
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
