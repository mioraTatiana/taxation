const express = require("express");
const pool = require("../Bd/db");
const { TOUTES_FACTURES } = require("../Direction/toutesFactures");
const enregistrement = express.Router();

// Page admin "Enregistrement facture" : QUI a enregistré les factures.
// Les factures marchandise et funéraires sont lues ensemble (voir Direction/toutesFactures.js),
// avec la colonne iduser = le taxateur connecté au moment de l'enregistrement.
// Accès : admin, directeur et chef de division (voir server.js).
// Dates facultatives : ?debut=2026-06-01&fin=2026-10-31

const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacture >= $1::date) AND ($2::date IS NULL OR f.datefacture <= $2::date)";


// 1) Une ligne par personne : nombre de factures enregistrées et montant total
//    Une facture sans iduser (enregistrée avant la connexion obligatoire) est comptée dans "Inconnu".
enregistrement.get("/parutilisateur", (req, res) => {
  const query = `
    SELECT COALESCE(f.iduser, '-') AS iduser,
           COALESCE(u.nomutilisateur, 'Inconnu') AS nomutilisateur,
           u.emailutilisateur,
           u.typeutilisateur,
           u.statut,
           COUNT(*)::int AS nombrefactures,
           COUNT(*) FILTER (WHERE f.transport = 'Express')::int AS nombreexpress,
           COUNT(*) FILTER (WHERE f.transport = 'Wagon complet')::int AS nombrewagon,
           COUNT(*) FILTER (WHERE f.transport = 'Funéraire')::int AS nombrefuneraire,
           SUM(f.recette)::float AS montanttotal,
           to_char(MIN(f.datefacture), 'YYYY-MM-DD') AS premierefacture,
           to_char(MAX(f.datefacture), 'YYYY-MM-DD') AS dernierefacture
    FROM (${TOUTES_FACTURES}) f
    LEFT JOIN public.usertable u ON u.iduser = f.iduser
    WHERE ${FILTRE_DATES}
    GROUP BY f.iduser, u.nomutilisateur, u.emailutilisateur, u.typeutilisateur, u.statut
    ORDER BY nombrefactures DESC`;

  pool.query(query, [req.query.debut || null, req.query.fin || null], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des enregistrements",
        erreur: err.message,
      });
    }
    res.json(result.rows);
  });
});


// 2) Les factures enregistrées par une personne (iduser), de la plus récente à la plus ancienne
//    iduser = "-" : les factures sans utilisateur
enregistrement.get("/factures/:iduser", (req, res) => {
  const iduser = req.params.iduser === "-" ? null : req.params.iduser;

  const query = `
    SELECT f.idfacture, f.numfacture, to_char(f.datefacture, 'YYYY-MM-DD') AS datefacture,
           f.transport, f.recette, c.nomclient, d.nomdestination
    FROM (${TOUTES_FACTURES}) f
    JOIN public.client c ON c.idclient = f.idclient
    JOIN public.destination d ON d.iddestination = f.iddestination
    WHERE f.iduser IS NOT DISTINCT FROM $3
      AND ${FILTRE_DATES}
    ORDER BY f.datefacture DESC, f.numfacture DESC`;

  pool.query(query, [req.query.debut || null, req.query.fin || null, iduser], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des factures de cet utilisateur",
        erreur: err.message,
      });
    }
    res.json(result.rows);
  });
});

module.exports = enregistrement;
