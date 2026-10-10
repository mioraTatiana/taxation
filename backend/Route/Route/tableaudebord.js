const express = require("express");
const pool = require("../db");
const tableaudebord = express.Router();

// Dates facultatives : /tableaudebord/parzone?debut=2026-02-01&fin=2026-02-28
const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacture >= $1::date) AND ($2::date IS NULL OR f.datefacture <= $2::date)";

// Réponse commune : une liste (par défaut) ou une seule ligne (unSeulResultat = true)
function repondre(res, messageErreur, unSeulResultat) {
  return (err, result) => {
    if (err) {
      return res.status(500).json({ message: messageErreur, erreur: err.message });
    }

    res.json(unSeulResultat ? result.rows[0] : result.rows);
  };
}


// Indicateurs : nombre de factures, recette, poids transporté, colis
tableaudebord.get("/totaux", (req, res) => {
  const query = `
    SELECT COUNT(*)::int AS nombrefactures,
           COALESCE(SUM(f.montantttc), 0)::float AS recette,
           COALESCE(SUM(f.poidsreeltotal), 0)::float AS poids,
           COALESCE(SUM(f.nombrecolistotal), 0)::int AS colis
    FROM public.facture f
    WHERE ${FILTRE_DATES}`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors du calcul des totaux", true)
  );
});


// Recette du mois en cours et du mois précédent (sans filtre de dates)
tableaudebord.get("/moiscourant", (req, res) => {
  const query = `
    SELECT COALESCE(SUM(montantttc) FILTER (WHERE datefacture >= date_trunc('month', CURRENT_DATE)), 0)::float AS moiscourant,
           COALESCE(SUM(montantttc) FILTER (WHERE datefacture <  date_trunc('month', CURRENT_DATE)), 0)::float AS moisprecedent
    FROM public.facture
    WHERE datefacture >= date_trunc('month', CURRENT_DATE - interval '1 month')`;

  pool.query(query, repondre(res, "Erreur lors du calcul du mois en cours", true));
});


// Les routes suivantes renvoient [{ libelle, valeur }] : prêtes pour les graphiques

// Recette par mois (du plus ancien au plus récent)
tableaudebord.get("/parmois", (req, res) => {
  const query = `
    SELECT to_char(f.datefacture, 'YYYY-MM') AS libelle,
           SUM(f.montantttc)::float AS valeur
    FROM public.facture f
    WHERE ${FILTRE_DATES}
    GROUP BY to_char(f.datefacture, 'YYYY-MM')
    ORDER BY libelle`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors de la récupération des recettes par mois")
  );
});


// Recette par zone
tableaudebord.get("/parzone", (req, res) => {
  const query = `
    SELECT z.libellezone AS libelle,
           SUM(f.montantttc)::float AS valeur
    FROM public.facture f
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    WHERE ${FILTRE_DATES}
    GROUP BY z.libellezone
    ORDER BY valeur DESC`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors de la récupération des recettes par zone")
  );
});


// Recette par type de wagon
// (le type de wagon d'une facture est celui du tarif de sa première ligne)
tableaudebord.get("/parwagon", (req, res) => {
  const query = `
    SELECT tt.libelletrain AS libelle,
           SUM(f.montantttc)::float AS valeur
    FROM public.facture f
    JOIN public.typetrain tt ON tt.idtypetrain = (
           SELECT t.idtypetrain
             FROM public.detailfacture df
             JOIN public.tarif t ON t.idtarif = df.idtarif
            WHERE df.idfacture = f.idfacture
            LIMIT 1)
    WHERE ${FILTRE_DATES}
    GROUP BY tt.libelletrain
    ORDER BY valeur DESC`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors de la récupération des recettes par wagon")
  );
});


// Les 5 meilleurs clients
tableaudebord.get("/topclients", (req, res) => {
  const query = `
    SELECT c.nomclient AS libelle,
           SUM(f.montantttc)::float AS valeur
    FROM public.facture f
    JOIN public.client c ON c.idclient = f.idclient
    WHERE ${FILTRE_DATES}
    GROUP BY c.nomclient
    ORDER BY valeur DESC
    LIMIT 5`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors de la récupération des meilleurs clients")
  );
});


// Poids transporté par type de marchandise (le type vient du tarif de chaque ligne)
tableaudebord.get("/parmarchandise", (req, res) => {
  const query = `
    SELECT tm.libelletype AS libelle,
           SUM(df.poidsreel)::float AS valeur
    FROM public.detailfacture df
    JOIN public.facture f ON f.idfacture = df.idfacture
    JOIN public.tarif t ON t.idtarif = df.idtarif
    JOIN public.typemarchandise tm ON tm.idtypemarchandise = t.idtypemarchandise
    WHERE ${FILTRE_DATES}
    GROUP BY tm.libelletype
    ORDER BY valeur DESC`;

  pool.query(
    query,
    [req.query.debut || null, req.query.fin || null],
    repondre(res, "Erreur lors de la récupération des poids par type de marchandise")
  );
});


module.exports = tableaudebord;
