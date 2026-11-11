// Petits outils de dates et de regroupement utilisés par Facture, Statistique, Recette et Tableau de bord.

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Les 3 transports (colonne "transport" renvoyée par le backend)
export const TRANSPORTS = ["Express", "Wagon complet", "Funéraire"];

// "2026-02-12" -> "12/02/2026"
export function formaterDate(iso) {
  if (!iso) return "";
  const [annee, mois, jour] = iso.split("-");
  return `${jour}/${mois}/${annee}`;
}

// "2026-02" -> "Février 2026"
export function libelleMois(cle) {
  const [annee, mois] = cle.split("-");
  return `${MOIS[Number(mois) - 1]} ${annee}`;
}

// Adresse avec les dates facultatives : "?debut=2026-02-01&fin=2026-02-28"
export function parametresPeriode(periode) {
  const parametres = new URLSearchParams();
  if (periode.debut) parametres.append("debut", periode.debut);
  if (periode.fin) parametres.append("fin", periode.fin || periode.debut);
  const texte = parametres.toString();
  return texte ? `?${texte}` : "";
}

// Statistique : [{ date, factures: [...] }], du plus récent au plus ancien
//  cleDate = nom de la colonne date (datefacturemarchandise ou datefacturefuneraire)
export function grouperParDate(factures, cleDate) {
  const groupes = {};
  factures.forEach((facture) => {
    const date = facture[cleDate];
    if (!groupes[date]) groupes[date] = [];
    groupes[date].push(facture);
  });
  return Object.keys(groupes)
    .sort()
    .reverse()
    .map((date) => ({ date, factures: groupes[date] }));
}

// Recette : lignes de /recette/parzone -> mois -> jours -> transports -> zones
//  lignes = [{ datefacture, transport, libellezone, recette, poids }]
// Chaque niveau a sa recette et son poids.
export function grouperRecettes(lignes) {
  const mois = {};

  lignes.forEach((ligne) => {
    const recette = Number(ligne.recette || 0);
    const poids = Number(ligne.poids || 0);

    const cleMois = ligne.datefacture.slice(0, 7);
    if (!mois[cleMois]) mois[cleMois] = { recette: 0, poids: 0, jours: {} };
    const m = mois[cleMois];
    m.recette += recette;
    m.poids += poids;

    if (!m.jours[ligne.datefacture]) m.jours[ligne.datefacture] = { recette: 0, poids: 0, transports: {} };
    const j = m.jours[ligne.datefacture];
    j.recette += recette;
    j.poids += poids;

    if (!j.transports[ligne.transport]) j.transports[ligne.transport] = { recette: 0, poids: 0, zones: [] };
    const t = j.transports[ligne.transport];
    t.recette += recette;
    t.poids += poids;
    t.zones.push({ zone: ligne.libellezone, recette, poids });
  });

  return Object.keys(mois)
    .sort()
    .reverse()
    .map((cle) => ({
      cle,
      libelle: libelleMois(cle),
      recette: mois[cle].recette,
      poids: mois[cle].poids,
      jours: Object.keys(mois[cle].jours)
        .sort()
        .reverse()
        .map((date) => {
          const jour = mois[cle].jours[date];
          return {
            date,
            recette: jour.recette,
            poids: jour.poids,
            // Express, puis Wagon complet, puis Funéraire
            transports: TRANSPORTS.filter((nom) => jour.transports[nom]).map((nom) => ({
              transport: nom,
              ...jour.transports[nom],
            })),
          };
        }),
    }));
}

// Tableau de bord : "2026-02" -> "Février 2026" dans les données des graphiques
export function libellesDeMois(donnees) {
  return donnees.map((ligne) => ({ ...ligne, libelle: libelleMois(ligne.libelle) }));
}
