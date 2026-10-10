import { calculerTotaux, trouverTarif } from "./calculsFacture";

// Données de test pour les selects et pour la facture (tant que l'API n'est pas branchée).
// Elles disparaissent quand UTILISER_DONNEES_TEST passe à false dans chaque page.

export const ZONES_TEST = [
  { idzone: "ZN01", libellezone: "Zone 1", kilometrage: 100 },
  { idzone: "ZN02", libellezone: "Zone 2", kilometrage: 163 },
];

// modefacturation = true  -> wagon complet (facturé sur poidsfacturation : 15 000 kg, 20 000 kg)
// modefacturation = false -> express (facturé sur le poids réel)
export const TYPES_TRAIN_TEST = [
  { idtypetrain: "TRN01", libelletrain: "Express", modefacturation: false, poidsfacturation: 0 },
  { idtypetrain: "TRN02", libelletrain: "Série 100", modefacturation: true, poidsfacturation: 15000 },
  { idtypetrain: "TRN03", libelletrain: "Série 400", modefacturation: true, poidsfacturation: 20000 },
];

export const TYPES_MARCHANDISE_TEST = [
  { idtypemarchandise: "TP01", libelletype: "Produits frais", soumistva: false },
  { idtypemarchandise: "TP02", libelletype: "Matériaux", soumistva: true },
  { idtypemarchandise: "TP03", libelletype: "Divers", soumistva: true },
  { idtypemarchandise: "TP04", libelletype: "Carburant", soumistva: false },
  { idtypemarchandise: "TP05", libelletype: "PPN", soumistva: false },
  { idtypemarchandise: "TP06", libelletype: "Transport funéraire", soumistva: false },
];

export const MARCHANDISES_TEST = [
  { idmarchandise: 1, designation: "Sac de riz", poidscolis: 50, idtypemarchandise: "TP05" },
  { idmarchandise: 2, designation: "Huile (bidon)", poidscolis: 20, idtypemarchandise: "TP05" },
  { idmarchandise: 3, designation: "Essence", poidscolis: 20, idtypemarchandise: "TP04" },
  { idmarchandise: 4, designation: "Gasoil", poidscolis: 20, idtypemarchandise: "TP04" },
  { idmarchandise: 5, designation: "Pétrole", poidscolis: 20, idtypemarchandise: "TP04" },
  { idmarchandise: 6, designation: "Sac de ciment", poidscolis: 25, idtypemarchandise: "TP02" },
  { idmarchandise: 7, designation: "Tôle", poidscolis: 30, idtypemarchandise: "TP02" },
  { idmarchandise: 8, designation: "Caisse de bananes", poidscolis: 15, idtypemarchandise: "TP01" },
  { idmarchandise: 9, designation: "Colis divers", poidscolis: 10, idtypemarchandise: "TP03" },
  { idmarchandise: 10, designation: "Cercueil", poidscolis: 80, idtypemarchandise: "TP06" },
  { idmarchandise: 11, designation: "Urne funéraire", poidscolis: 5, idtypemarchandise: "TP06" },
];

export const CLIENTS_TEST = [
  { idclient: "CLT01", nomclient: "Rakoto Jean", sigle: "RJ", cin: "101231456789", telephone: "034 12 345 67", adresse: "Fianarantsoa", email: "rakoto@gmail.com" },
  { idclient: "CLT02", nomclient: "Madagascar Fret", sigle: "MAFRET", cin: "", telephone: "032 98 765 43", adresse: "Manakara", email: "contact@mafret.mg" },
  { idclient: "CLT03", nomclient: "Miora Randria", sigle: "MR", cin: "", telephone: "034 31 568 75", adresse: "Ambositra", email: "" },
];

export const DESTINATIONS_TEST = [
  { iddestination: "DST01", nomdestination: "Fianarantsoa", typedestination: "Gare", codegare: "FIA", pointkilometrique: 0, idzone: "ZN01" },
  { iddestination: "DST02", nomdestination: "Manakara", typedestination: "Gare", codegare: "MKR", pointkilometrique: 163, idzone: "ZN02" },
  { iddestination: "DST03", nomdestination: "Manampatrana", typedestination: "Halte", codegare: "MNP", pointkilometrique: 120, idzone: "ZN02" },
];

// Un tarif pour chaque combinaison zone x type de marchandise x type de train
export const TARIFS_TEST = ZONES_TEST.flatMap((zone, z) =>
  TYPES_MARCHANDISE_TEST.flatMap((type, t) =>
    TYPES_TRAIN_TEST.map((train, k) => ({
      idtarif: `TRF${z}${t}${k}`,
      idzone: zone.idzone,
      idtypemarchandise: type.idtypemarchandise,
      idtypetrain: train.idtypetrain,
      prixkg: 100 + z * 50 + t * 25 + k * 10,
    }))
  )
);

// Factures de test : 3 par mois, de janvier à octobre 2026.
// Forme proche de la base : facture + ses lignes (details). Le type de wagon se retrouve via idtarif.
function construireFactures() {
  const factures = [];
  const compteur = {};
  let idDetail = 1;

  for (let i = 0; i < 30; i++) {
    const annee = 2026;
    const mois = String(Math.floor(i / 3) + 1).padStart(2, "0");
    const jour = String(3 + (i % 3) * 3).padStart(2, "0"); // 3, 6 ou 9 du mois

    const destination = DESTINATIONS_TEST[i % 3];
    const client = CLIENTS_TEST[(i + 1) % 3];
    const train = i % 7 === 6 ? TYPES_TRAIN_TEST[2] : i % 5 === 4 ? TYPES_TRAIN_TEST[1] : TYPES_TRAIN_TEST[0];
    const avecTva = i % 4 === 0;

    const candidats = MARCHANDISES_TEST.filter((m) => {
      const type = TYPES_MARCHANDISE_TEST.find((t) => t.idtypemarchandise === m.idtypemarchandise);
      return type.libelletype !== "Transport funéraire" && type.soumistva === avecTva;
    });

    const details = [];
    for (let k = 0; k <= i % 3; k++) {
      const m = candidats[(i + k) % candidats.length];
      const nombrecolis = 2 + ((i + k) % 5) * 3;
      const poidsreel = nombrecolis * m.poidscolis;
      const tarif = trouverTarif(TARIFS_TEST, destination.idzone, m.idtypemarchandise, train.idtypetrain);
      details.push({
        iddetailfacture: idDetail++,
        idmarchandise: m.idmarchandise,
        nombrecolis,
        poidsreel,
        poidsfacture: poidsreel,
        prixapplicable: tarif.prixkg,
        montantht: Math.round(poidsreel * tarif.prixkg),
        idtarif: tarif.idtarif,
      });
    }

    compteur[annee] = (compteur[annee] || 0) + 1;
    factures.push({
      idfacture: i + 1,
      numfacture: `${String(compteur[annee]).padStart(3, "0")}/${jour}-${mois}-${annee}`,
      datefacture: `${annee}-${mois}-${jour}`,
      idclient: client.idclient,
      iddestination: destination.iddestination,
      ...calculerTotaux(details, train, avecTva),
      details,
    });
  }
  return factures;
}

export const FACTURES_TEST = construireFactures();
