const express = require("express");
const pool = require("../db");
const recette = express.Router();

// Dates facultatives : /recette/parzone?debut=2026-02-01&fin=2026-02-28
const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacture >= $1::date) AND ($2::date IS NULL OR f.datefacture <= $2::date)";

// ::float transforme la somme en nombre (sinon Node la renvoie en texte, ex: "120000")


// Recette et poids transporté, pour chaque date et chaque zone
// (le front en déduit le total de chaque jour et de chaque mois)
recette.get("/parzone", (req, res) => {
  const debut = req.query.debut || null;
  const fin = req.query.fin || null;

  const query = `
    SELECT to_char(f.datefacture, 'YYYY-MM-DD') AS datefacture,
           z.libellezone,
           SUM(f.montantttc)::float AS recette,
           SUM(f.poidsreeltotal)::float AS poids
    FROM public.facture f
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    WHERE ${FILTRE_DATES}
    GROUP BY f.datefacture, z.libellezone
    ORDER BY f.datefacture DESC, z.libellezone`;

  pool.query(query, [debut, fin], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des recettes par zone",
        erreur: err.message,
      });
    }

    res.json(result.rows);
  });
});


// Recette et poids transporté de chaque mois : "2026-02" -> Février 2026
recette.get("/parmois", (req, res) => {
  const debut = req.query.debut || null;
  const fin = req.query.fin || null;

  const query = `
    SELECT to_char(f.datefacture, 'YYYY-MM') AS mois,
           SUM(f.montantttc)::float AS recette,
           SUM(f.poidsreeltotal)::float AS poids
    FROM public.facture f
    WHERE ${FILTRE_DATES}
    GROUP BY to_char(f.datefacture, 'YYYY-MM')
    ORDER BY mois DESC`;

  pool.query(query, [debut, fin], (err, result) => {
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
