const express = require("express");
const pool = require("../db");
const statistique = express.Router();

// Les dates sont facultatives : /statistique/factures?debut=2026-02-01&fin=2026-02-28
// Sans dates, $1 et $2 valent null et on prend toutes les factures.
const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacture >= $1::date) AND ($2::date IS NULL OR f.datefacture <= $2::date)";

// to_char(...) renvoie la date en texte "2026-02-12".
// Sans lui, Node la transforme en objet Date et la date peut reculer d'un jour dans le JSON.


// Factures de la période avec le client, la destination, la zone et le type de wagon
statistique.get("/factures", (req, res) => {
  const debut = req.query.debut || null;
  const fin = req.query.fin || null;

  const query = `
    SELECT f.idfacture, f.numfacture, to_char(f.datefacture, 'YYYY-MM-DD') AS datefacture,
           f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal,
           f.piquire, f.tva, f.montanthttotal, f.montantttc,
           c.nomclient, c.telephone, c.adresse,
           d.nomdestination, z.libellezone,
           (SELECT tt.libelletrain
              FROM public.detailfacture df
              JOIN public.tarif t ON t.idtarif = df.idtarif
              JOIN public.typetrain tt ON tt.idtypetrain = t.idtypetrain
             WHERE df.idfacture = f.idfacture
             LIMIT 1) AS wagon
    FROM public.facture f
    JOIN public.client c ON c.idclient = f.idclient
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    WHERE ${FILTRE_DATES}
    ORDER BY f.datefacture DESC, f.idfacture DESC`;

  pool.query(query, [debut, fin], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des factures",
        erreur: err.message,
      });
    }

    // Une liste vide n'est pas une erreur : la page affiche "Aucune facture"
    res.json(result.rows);
  });
});


// Lignes (marchandises) de toutes les factures de la période
// Le front les rattache à chaque facture avec idfacture
statistique.get("/details", (req, res) => {
  const debut = req.query.debut || null;
  const fin = req.query.fin || null;

  const query = `
    SELECT df.iddetailfacture, df.idfacture, m.designation,
           df.nombrecolis, df.poidsreel, df.poidsfacture,
           df.prixapplicable, df.montantht
    FROM public.detailfacture df
    JOIN public.facture f ON f.idfacture = df.idfacture
    LEFT JOIN public.marchandise m ON m.idmarchandise = df.idmarchandise
    WHERE ${FILTRE_DATES}
    ORDER BY df.idfacture, df.iddetailfacture`;

  pool.query(query, [debut, fin], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des lignes de facture",
        erreur: err.message,
      });
    }

    res.json(result.rows);
  });
});


module.exports = statistique;
