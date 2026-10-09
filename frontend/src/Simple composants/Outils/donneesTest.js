// Données de test pour les selects (clés étrangères).
// Elles disparaissent quand UTILISER_DONNEES_TEST passe à false.

export const ZONES_TEST = [
  { idzone: "ZN01", libellezone: "Zone 1", kilometrage: 100 },
  { idzone: "ZN02", libellezone: "Zone 2", kilometrage: 163 },
];

export const TYPES_TRAIN_TEST = [
  { idtypetrain: "TRN01", libelletrain: "Omnibus", modefacturation: false, poidsfacturation: 0 },
  { idtypetrain: "TRN02", libelletrain: "Express", modefacturation: true, poidsfacturation: 100 },
];

export const TYPES_MARCHANDISE_TEST = [
  { idtypemarchandise: "TP01", libelletype: "Produits frais", soumistva: false },
  { idtypemarchandise: "TP02", libelletype: "Matériaux", soumistva: true },
  { idtypemarchandise: "TP03", libelletype: "Divers", soumistva: true },
];
