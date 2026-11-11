const express = require("express");
const pool = require("../Bd/db");
const { TOUTES_FACTURES, FILTRE, parametresFiltre } = require("./toutesFactures");
const tableaudebord = express.Router();

// Tableau de bord : factures marchandise ET funéraires (voir toutesFactures.js).
// Dates facultatives : /tableaudebord/parzone?debut=2026-02-01&fin=2026-02-28

// Réponse commune : une liste (par défaut) ou une seule ligne (unSeulResultat = true)
function repondre(res, messageErreur, unSeulResultat) {
  return (err, result) => {
    if (err) {
      return res.status(500).json({ message: messageErreur, erreur: err.message });
    }
    res.json(unSeulResultat ? result.rows[0] : result.rows);
  };
}


// 1) Indicateurs : nombre de factures, recette, poids, colis
//    + le détail marchandise / funéraire
tableaudebord.get("/totaux", (req, res) => {
  const query = `
    SELECT COUNT(*)::int AS nombrefactures,
           COALESCE(SUM(f.recette), 0)::float AS recette,
           COALESCE(SUM(f.poids), 0)::float AS poids,
           COALESCE(SUM(f.colis), 0)::int AS colis,
           COUNT(*) FILTER (WHERE f.transport <> 'Funéraire')::int AS nombremarchandise,
           COUNT(*) FILTER (WHERE f.transport = 'Funéraire')::int AS nombrefuneraire,
           COALESCE(SUM(f.recette) FILTER (WHERE f.transport <> 'Funéraire'), 0)::float AS recettemarchandise,
           COALESCE(SUM(f.recette) FILTER (WHERE f.transport = 'Funéraire'), 0)::float AS recettefuneraire
    FROM (${TOUTES_FACTURES}) f
    WHERE ${FILTRE}`;

  pool.query(query, parametresFiltre(req), repondre(res, "Erreur lors du calcul des totaux", true));
});


// 2) Recette du mois en cours et du mois précédent (sans filtre de dates)
tableaudebord.get("/moiscourant", (req, res) => {
  const query = `
    SELECT COALESCE(SUM(f.recette) FILTER (WHERE f.datefacture >= date_trunc('month', CURRENT_DATE)), 0)::float AS moiscourant,
           COALESCE(SUM(f.recette) FILTER (WHERE f.datefacture <  date_trunc('month', CURRENT_DATE)), 0)::float AS moisprecedent,
           COALESCE(SUM(f.recette) FILTER (WHERE f.datefacture >= date_trunc('month', CURRENT_DATE)
                                             AND f.transport = 'Funéraire'), 0)::float AS funerairemoiscourant
    FROM (${TOUTES_FACTURES}) f
    WHERE f.datefacture >= date_trunc('month', CURRENT_DATE - interval '1 month')`;

  pool.query(query, repondre(res, "Erreur lors du calcul du mois en cours", true));
});


// Les routes suivantes renvoient [{ libelle, valeur }] : prêtes pour les graphiques

// 3) Recette par mois (du plus ancien au plus récent)
tableaudebord.get("/parmois", (req, res) => {
  const query = `
    SELECT to_char(f.datefacture, 'YYYY-MM') AS libelle,
           SUM(f.recette)::float AS valeur
    FROM (${TOUTES_FACTURES}) f
    WHERE ${FILTRE}
    GROUP BY to_char(f.datefacture, 'YYYY-MM')
    ORDER BY libelle`;

  pool.query(query, parametresFiltre(req), repondre(res, "Erreur lors de la récupération des recettes par mois"));
});


// 4) Recette par transport : Express, Wagon complet, Funéraire
tableaudebord.get("/partransport", (req, res) => {
  const query = `
    SELECT f.transport AS libelle,
           SUM(f.recette)::float AS valeur
    FROM (${TOUTES_FACTURES}) f
    WHERE ${FILTRE}
    GROUP BY f.transport
    ORDER BY valeur DESC`;

  pool.query(query, parametresFiltre(req), repondre(res, "Erreur lors de la récupération des recettes par transport"));
});


// 5) Recette par zone
tableaudebord.get("/parzone", (req, res) => {
  const query = `
    SELECT z.libellezone AS libelle,
           SUM(f.recette)::float AS valeur
    FROM (${TOUTES_FACTURES}) f
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    WHERE ${FILTRE}
    GROUP BY z.libellezone
    ORDER BY valeur DESC`;

  pool.query(query, parametresFiltre(req), repondre(res, "Erreur lors de la récupération des recettes par zone"));
});


// 6) Les 5 meilleurs clients
tableaudebord.get("/topclients", (req, res) => {
  const query = `
    SELECT c.nomclient AS libelle,
           SUM(f.recette)::float AS valeur
    FROM (${TOUTES_FACTURES}) f
    JOIN public.client c ON c.idclient = f.idclient
    WHERE ${FILTRE}
    GROUP BY c.nomclient
    ORDER BY valeur DESC
    LIMIT 5`;

  pool.query(query, parametresFiltre(req), repondre(res, "Erreur lors de la récupération des meilleurs clients"));
});


// 7) Poids transporté par type de marchandise (marchandises seulement)
//    Wagon complet : la ligne "wagon" (sans marchandise) n'est pas comptée,
//    sinon son poids serait compté deux fois.
tableaudebord.get("/parmarchandise", (req, res) => {
  const query = `
    SELECT tm.libelletype AS libelle,
           SUM(df.poidsreel)::float AS valeur
    FROM public.detailfacture df
    JOIN public.facturemarchandise f ON f.idfacturemarchandise = df.idfacturemarchandise
    JOIN public.marchandise m ON m.idmarchandise = df.idmarchandise
    JOIN public.typemarchandise tm ON tm.idtypemarchandise = m.idtypemarchandise
    WHERE ($1::date IS NULL OR f.datefacturemarchandise >= $1::date)
      AND ($2::date IS NULL OR f.datefacturemarchandise <= $2::date)
    GROUP BY tm.libelletype
    ORDER BY valeur DESC`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors de la récupération des poids par type de marchandise")
  );
});


module.exports = tableaudebord;
