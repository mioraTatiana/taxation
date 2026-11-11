const express = require("express");
const pool = require("../Bd/db");
const { TOUTES_FACTURES, FILTRE, parametresFiltre } = require("./toutesFactures");
const statistique = express.Router();

// Les statistiques séparent bien les deux tables :
//   /statistique/marchandise : factures de facturemarchandise (+ leurs lignes)
//   /statistique/funeraire   : factures de facturefuneraire
//   /statistique/totaux      : une ligne par transport (Express, Wagon complet, Funéraire)
//   /statistique/mensuelle   : statistique du mois par nature de marchandise (Express, gare de Fianarantsoa)
// Dates facultatives : ?debut=2026-02-01&fin=2026-02-28


// 1) Factures marchandise de la période, avec client, destination, zone, type de wagon
//    et leurs lignes dans le champ "details"
statistique.get("/marchandise", async (req, res) => {
  const debut = req.query.debut || null;
  const fin = req.query.fin || null;

  try {
    const factures = await pool.query(
      `SELECT f.idfacturemarchandise, f.numfacturemarchandise,
              to_char(f.datefacturemarchandise, 'YYYY-MM-DD') AS datefacturemarchandise,
              f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal,
              f.piquiremarchandise, f.tva, f.montanthttotal, f.montantttc,
              f.idclient, f.iddestination, f.iduser,
              c.nomclient, c.telephone, c.adresse, c.sigle,
              d.nomdestination, d.idzone, z.libellezone,
              w.idtypewagon, w.libelletypewagon, w.modefacturation, w.poidsfacturation, w.poidssupporte,
              u.nomutilisateur
       FROM public.facturemarchandise f
       JOIN public.client c ON c.idclient = f.idclient
       JOIN public.destination d ON d.iddestination = f.iddestination
       JOIN public.zonedestination z ON z.idzone = d.idzone
       LEFT JOIN public.usertable u ON u.iduser = f.iduser
       LEFT JOIN LATERAL (
              SELECT tw.idtypewagon, tw.libelletypewagon, tw.modefacturation, tw.poidsfacturation, tw.poidssupporte
                FROM public.detailfacture df
                JOIN public.tarifmarchandise t ON t.idtarifmarchandise = df.idtarifmarchandise
                JOIN public.typewagon tw ON tw.idtypewagon = t.idtypewagon
               WHERE df.idfacturemarchandise = f.idfacturemarchandise
               ORDER BY df.iddetailfacture
               LIMIT 1) w ON true
       WHERE ($1::date IS NULL OR f.datefacturemarchandise >= $1::date)
         AND ($2::date IS NULL OR f.datefacturemarchandise <= $2::date)
       ORDER BY f.datefacturemarchandise DESC, f.idfacturemarchandise DESC`,
      [debut, fin]
    );

    // Les lignes de toutes ces factures, en une seule requête
    const ids = factures.rows.map((f) => f.idfacturemarchandise);
    const lignes = await pool.query(
      `SELECT df.iddetailfacture, df.idfacturemarchandise, df.nombrecolis, df.poidsreel, df.poidsfacture,
              df.prixapplicable, df.montantht, df.idmarchandise, df.idtarifmarchandise, df.idwagon,
              COALESCE(m.designation, df.designation, tt.libelletype) AS designation,
              COALESCE(tm.libelletype, tt.libelletype) AS libelletype,
              t.idtypemarchandise, m.poidscolis
       FROM public.detailfacture df
       JOIN public.tarifmarchandise t ON t.idtarifmarchandise = df.idtarifmarchandise
       JOIN public.typemarchandise tt ON tt.idtypemarchandise = t.idtypemarchandise
       LEFT JOIN public.marchandise m ON m.idmarchandise = df.idmarchandise
       LEFT JOIN public.typemarchandise tm ON tm.idtypemarchandise = m.idtypemarchandise
       WHERE df.idfacturemarchandise = ANY($1::int[])
       ORDER BY df.iddetailfacture`,
      [ids]
    );

    // On range chaque ligne dans sa facture
    const resultat = factures.rows.map((facture) => ({
      ...facture,
      details: lignes.rows.filter((l) => l.idfacturemarchandise === facture.idfacturemarchandise),
    }));

    // Une liste vide n'est pas une erreur : la page affiche "Aucune facture"
    res.json(resultat);
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération des factures marchandise",
      erreur: err.message,
    });
  }
});


// 2) Factures funéraires de la période, avec client, destination et zone
statistique.get("/funeraire", (req, res) => {
  const query = `
    SELECT f.idfacturefuneraire, f.numfacturefuneraire,
           to_char(f.datefacturefuneraire, 'YYYY-MM-DD') AS datefacturefuneraire,
           f.piquirefuneraire, f.montanthttfuneraire, f.montantttcfunerare, f.nomdefunt,
           c.nomclient, c.telephone, c.adresse, c.sigle,
           d.nomdestination, z.libellezone, u.nomutilisateur
    FROM public.facturefuneraire f
    JOIN public.client c ON c.idclient = f.idclient
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    LEFT JOIN public.usertable u ON u.iduser = f.iduser
    WHERE ($1::date IS NULL OR f.datefacturefuneraire >= $1::date)
      AND ($2::date IS NULL OR f.datefacturefuneraire <= $2::date)
    ORDER BY f.datefacturefuneraire DESC, f.idfacturefuneraire DESC`;

  pool.query(query, [req.query.debut || null, req.query.fin || null], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des factures funéraires",
        erreur: err.message,
      });
    }
    res.json(result.rows);
  });
});


// 3) Totaux par transport : [{ transport, nombrefactures, recette, poids, colis }]
statistique.get("/totaux", (req, res) => {
  const query = `
    SELECT f.transport,
           COUNT(*)::int AS nombrefactures,
           SUM(f.recette)::float AS recette,
           SUM(f.poids)::float AS poids,
           SUM(f.colis)::int AS colis
    FROM (${TOUTES_FACTURES}) f
    WHERE ${FILTRE}
    GROUP BY f.transport
    ORDER BY f.transport`;

  pool.query(query, parametresFiltre(req), (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Erreur lors du calcul des totaux", erreur: err.message });
    }
    res.json(result.rows);
  });
});



// 4) Statistique MENSUELLE des marchandises (modèle papier "Statistiques voyageurs et marchandises")
//    /statistique/mensuelle?mois=9&annee=2026
//    - seulement les factures marchandise en EXPRESS (pas de wagon complet, pas de funéraire)
//    - gare de départ : Fianarantsoa
//    - chaque ligne de facture est rangée dans une "nature" d'après sa désignation et son type :
//        HYDRO                       = type non soumis à la TVA (carburant sans TVA)
//        RIZ et PADDY, CAFE, MANGUE… = mot trouvé dans la désignation
//        AUTRES FRUITS ET LEGUMES    = légume, tomate, poireau, fruit… (et pas une nature déjà nommée)
//        P.ALIMENTAIRES et MERCERIE  = les PPN qui ne sont dans aucune nature ci-dessus
//        AUTRES                      = tout le reste
//    - tonnage = somme des poids réels (kg) ; tonnes/km = tonnes × point kilométrique de la destination ;
//      recette taxable = somme des montants HT des lignes

// Les natures, dans l'ordre de la fiche. "mots" = mots cherchés dans la désignation (sans accents)
const NATURES = [
  { nature: "CAFE", mots: ["cafe"] },
  { nature: "BANANE VERTE", mots: ["banane verte"] },
  { nature: "BANANE MURE", mots: ["banane mure", "banane"] },
  { nature: "LETCHI", mots: ["letchi", "litchi"] },
  { nature: "MANGUE", mots: ["mangue"] },
  { nature: "ORANGE", mots: ["orange"] },
  { nature: "AVOCAT", mots: ["avocat"] },
  { nature: "AUTRES FRUITS ET LEGUMES", mots: ["legume", "fruit", "tomate", "poireau", "carotte", "oignon", "pomme de terre", "haricot", "chou", "salade", "citron", "mandarine", "ananas", "papaye", "voatabia", "anana", "petsai", "concombre", "courgette", "aubergine", "piment"] },
  { nature: "RIZ et PADDY", mots: ["riz", "paddy", "vary"] },
  { nature: "P.ALIMENTAIRES et MERCERIE", mots: [] },
  { nature: "MANIOC SEC (Soanta)", mots: ["manioc sec", "soanta"] },
  { nature: "MANIOC FRAIS", mots: ["manioc"] },
  { nature: "GINGEMBRE", mots: ["gingembre", "sakamalao"] },
  { nature: "VANILLE", mots: ["vanille"] },
  { nature: "CANNELLE", mots: ["cannelle"] },
  { nature: "CHARBON DE BOIS", mots: ["charbon"] },
  { nature: "BOIS DE CHAUFFAGE", mots: ["bois de chauffage", "kitay"] },
  { nature: "PLANCHE", mots: ["planche"] },
  { nature: "MADRIER", mots: ["madrier"] },
  { nature: "BATTANE", mots: ["battane"] },
  { nature: "HYDRO", mots: [] },
  { nature: "AUTRES", mots: [] },
];

// "Bidon d'huile Été" -> "bidon d'huile ete"
function sansAccents(texte) {
  return (texte || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Trouve la nature d'une ligne de facture
function natureDeLigne(ligne) {
  if (ligne.soumistva === false) return "HYDRO"; // carburant sans TVA
  const designation = sansAccents(ligne.designation);
  const trouvee = NATURES.find((n) => n.mots.some((mot) => designation.includes(mot)));
  if (trouvee) return trouvee.nature;
  if (sansAccents(ligne.libelletype) === "ppn") return "P.ALIMENTAIRES et MERCERIE";
  return "AUTRES";
}

statistique.get("/mensuelle", async (req, res) => {
  const mois = Number(req.query.mois);
  const annee = Number(req.query.annee);
  if (!mois || mois < 1 || mois > 12 || !annee) {
    return res.status(400).json({ message: "Choisissez un mois (1 à 12) et une année" });
  }

  try {
    const result = await pool.query(
      `SELECT COALESCE(m.designation, df.designation, tt.libelletype) AS designation,
              COALESCE(tm.libelletype, tt.libelletype) AS libelletype,
              COALESCE(tm.soumistva, tt.soumistva) AS soumistva,
              df.poidsreel::float AS poids, df.montantht::float AS montant,
              COALESCE(d.pointkilometrique, 0) AS pk
       FROM public.detailfacture df
       JOIN public.facturemarchandise f ON f.idfacturemarchandise = df.idfacturemarchandise
       JOIN public.destination d ON d.iddestination = f.iddestination
       JOIN public.tarifmarchandise t ON t.idtarifmarchandise = df.idtarifmarchandise
       JOIN public.typewagon tw ON tw.idtypewagon = t.idtypewagon
       JOIN public.typemarchandise tt ON tt.idtypemarchandise = t.idtypemarchandise
       LEFT JOIN public.marchandise m ON m.idmarchandise = df.idmarchandise
       LEFT JOIN public.typemarchandise tm ON tm.idtypemarchandise = m.idtypemarchandise
       WHERE tw.modefacturation = false
         AND EXTRACT(MONTH FROM f.datefacturemarchandise) = $1
         AND EXTRACT(YEAR FROM f.datefacturemarchandise) = $2`,
      [mois, annee]
    );

    // Une ligne par nature, à zéro au départ
    const lignes = NATURES.map((n) => ({ nature: n.nature, tonnage: 0, tonneskm: 0, recette: 0 }));
    for (const ligne of result.rows) {
      const cible = lignes.find((l) => l.nature === natureDeLigne(ligne));
      cible.tonnage += ligne.poids;
      cible.tonneskm += (ligne.poids / 1000) * ligne.pk;
      cible.recette += ligne.montant;
    }

    const total = lignes.reduce(
      (somme, l) => ({ tonnage: somme.tonnage + l.tonnage, tonneskm: somme.tonneskm + l.tonneskm, recette: somme.recette + l.recette }),
      { tonnage: 0, tonneskm: 0, recette: 0 }
    );

    // Code de la gare de Fianarantsoa (table destination), s'il est rempli
    const gare = await pool.query(
      "SELECT nomdestination, codegare FROM public.destination WHERE LOWER(nomdestination) = 'fianarantsoa' LIMIT 1"
    );
    const codegare = gare.rows.length > 0 ? gare.rows[0].codegare : null;

    res.json({ mois, annee, gare: "Fianarantsoa", codegare, lignes, total });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du calcul de la statistique mensuelle", erreur: err.message });
  }
});

module.exports = statistique;
