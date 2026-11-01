const express = require("express");
const pool = require("../Bd/db");
const { TOUTES_FACTURES, FILTRE, parametresFiltre } = require("./toutesFactures");
const recette = express.Router();

// Recettes des factures marchandise ET funéraires (voir toutesFactures.js).
// Filtres facultatifs : ?debut=2026-02-01&fin=2026-02-28&transport=Express
//   transport = tous, Express, Wagon complet ou Funéraire
// Le poids d'une facture funéraire est 0.


// 1) Recette et poids pour chaque date, chaque transport et chaque zone
//    Le front en déduit le total de chaque jour et de chaque mois,
//    et s'en sert pour l'export Excel.
recette.get("/parzone", (req, res) => {
  const query = `
    SELECT to_char(f.datefacture, 'YYYY-MM-DD') AS datefacture,
           f.transport,
           z.libellezone,
           COUNT(*)::int AS nombrefactures,
           SUM(f.recette)::float AS recette,
           SUM(f.poids)::float AS poids
    FROM (${TOUTES_FACTURES}) f
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    WHERE ${FILTRE}
    GROUP BY f.datefacture, f.transport, z.libellezone
    ORDER BY f.datefacture DESC, f.transport, z.libellezone`;

  pool.query(query, parametresFiltre(req), (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des recettes par zone",
        erreur: err.message,
      });
    }
    res.json(result.rows);
  });
});


// 2) Recette et poids de chaque mois ("2026-02"), séparés par transport
recette.get("/parmois", (req, res) => {
  const query = `
    SELECT to_char(f.datefacture, 'YYYY-MM') AS mois,
           f.transport,
           SUM(f.recette)::float AS recette,
           SUM(f.poids)::float AS poids
    FROM (${TOUTES_FACTURES}) f
    WHERE ${FILTRE}
    GROUP BY to_char(f.datefacture, 'YYYY-MM'), f.transport
    ORDER BY mois DESC, f.transport`;

  pool.query(query, parametresFiltre(req), (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des recettes par mois",
        erreur: err.message,
      });
    }
    res.json(result.rows);
  });
});


module.exports = recette;
