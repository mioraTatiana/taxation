// Regroupements et totaux utilisés par Statistique, Recette, Tableau de bord et Facture.

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Ce qui compte comme "recette" et comme "poids transporté" (à changer ici si besoin)
export function recetteDe(facture) {
  return Number(facture.montantttc || 0);
}

export function poidsDe(facture) {
  return Number(facture.poidsreeltotal || 0);
}

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

// Ajoute à chaque facture les noms liés (client, destination, zone, wagon) et la désignation de chaque ligne
export function enrichirFactures(factures, ref) {
  return factures.map((facture) => {
    const client = ref.clients.find((c) => c.idclient === facture.idclient);
    const destination = ref.destinations.find((d) => d.iddestination === facture.iddestination);
    const zone = destination ? ref.zones.find((z) => z.idzone === destination.idzone) : null;

    const details = (facture.details || []).map((detail) => {
      const marchandise = ref.marchandises.find((m) => m.idmarchandise === detail.idmarchandise);
      const type = marchandise
        ? ref.typesMarchandise.find((t) => t.idtypemarchandise === marchandise.idtypemarchandise)
        : null;
      return {
        ...detail,
        designation: marchandise ? marchandise.designation : "—",
        libelletype: type ? type.libelletype : "—",
      };
    });

    // Le type de wagon se retrouve par le tarif de la première ligne
    const premierTarif = details.length > 0 ? ref.tarifs.find((t) => t.idtarif === details[0].idtarif) : null;
    const typeTrain = premierTarif ? ref.typesTrain.find((t) => t.idtypetrain === premierTarif.idtypetrain) : null;

    return {
      ...facture,
      details,
      clientNom: client ? client.nomclient : "—",
      clientTelephone: client ? client.telephone : "",
      clientAdresse: client ? client.adresse : "",
      destinationNom: destination ? destination.nomdestination : "—",
      idzone: destination ? destination.idzone : "",
      zoneLibelle: zone ? zone.libellezone : "—",
      typeTrain,
      wagon: typeTrain ? typeTrain.libelletrain : "—",
      wagonComplet: Boolean(typeTrain && typeTrain.modefacturation),
    };
  });
}

// Les dates sont au format "AAAA-MM-JJ" : la comparaison de texte suffit
export function filtrerParDates(factures, debut, fin) {
  return factures.filter(
    (facture) => (!debut || facture.datefacture >= debut) && (!fin || facture.datefacture <= fin)
  );
}

// Statistique : [{ date, factures: [...] }], du plus récent au plus ancien
export function grouperParDate(factures) {
  const groupes = {};
  factures.forEach((facture) => {
    if (!groupes[facture.datefacture]) groupes[facture.datefacture] = [];
    groupes[facture.datefacture].push(facture);
  });
  return Object.keys(groupes)
    .sort()
    .reverse()
    .map((date) => ({ date, factures: groupes[date] }));
}

// Recette : mois -> jours -> zones (recette et poids transporté à chaque niveau)
export function grouperRecettes(factures) {
  const mois = {};

  factures.forEach((facture) => {
    const cleMois = facture.datefacture.slice(0, 7);
    if (!mois[cleMois]) mois[cleMois] = { recette: 0, poids: 0, jours: {} };
    const m = mois[cleMois];
    m.recette += recetteDe(facture);
    m.poids += poidsDe(facture);

    if (!m.jours[facture.datefacture]) m.jours[facture.datefacture] = { recette: 0, poids: 0, zones: {} };
    const j = m.jours[facture.datefacture];
    j.recette += recetteDe(facture);
    j.poids += poidsDe(facture);

    if (!j.zones[facture.zoneLibelle]) j.zones[facture.zoneLibelle] = { recette: 0, poids: 0 };
    const z = j.zones[facture.zoneLibelle];
    z.recette += recetteDe(facture);
    z.poids += poidsDe(facture);
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
            zones: Object.keys(jour.zones)
              .sort()
              .map((zone) => ({ zone, recette: jour.zones[zone].recette, poids: jour.zones[zone].poids })),
          };
        }),
    }));
}

// Somme d'une valeur par clé : [{ libelle, valeur }], du plus grand au plus petit
export function sommeParCle(liste, cleFn, valeurFn) {
  const totaux = {};
  liste.forEach((element) => {
    const cle = cleFn(element);
    totaux[cle] = (totaux[cle] || 0) + valeurFn(element);
  });
  return Object.keys(totaux)
    .map((libelle) => ({ libelle, valeur: totaux[libelle] }))
    .sort((a, b) => b.valeur - a.valeur);
}

// Recette par mois, du plus ancien au plus récent
export function recetteParMois(factures) {
  const totaux = {};
  factures.forEach((facture) => {
    const cle = facture.datefacture.slice(0, 7);
    totaux[cle] = (totaux[cle] || 0) + recetteDe(facture);
  });
  return Object.keys(totaux)
    .sort()
    .map((cle) => ({ libelle: libelleMois(cle), valeur: totaux[cle] }));
}

export function totauxGlobaux(factures) {
  return {
    nombreFactures: factures.length,
    recette: factures.reduce((total, f) => total + recetteDe(f), 0),
    poids: factures.reduce((total, f) => total + poidsDe(f), 0),
    colis: factures.reduce((total, f) => total + Number(f.nombrecolistotal || 0), 0),
  };
}

// Recette du mois en cours comparée au mois précédent
export function comparaisonMois(toutes, date = new Date()) {
  const cle = (annee, mois) => `${annee}-${String(mois + 1).padStart(2, "0")}`;
  const courant = cle(date.getFullYear(), date.getMonth());
  const precedentDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const precedent = cle(precedentDate.getFullYear(), precedentDate.getMonth());

  const somme = (cleMois) =>
    toutes.filter((f) => f.datefacture.startsWith(cleMois)).reduce((total, f) => total + recetteDe(f), 0);

  const recette = somme(courant);
  const recettePrecedente = somme(precedent);
  return {
    libelle: libelleMois(courant),
    recette,
    recettePrecedente,
    variation: recettePrecedente > 0 ? Math.round(((recette - recettePrecedente) / recettePrecedente) * 100) : null,
  };
}
