const express = require("express");
const pool = require("../Bd/db");
const { TOUTES_FACTURES, FILTRE, parametresFiltre } = require("./toutesFactures");
const statistique = express.Router();

// Les statistiques séparent bien les deux tables :
//   /statistique/marchandise : factures de facturemarchandise (+ leurs lignes)
//   /statistique/funeraire   : factures de facturefuneraire
//   /statistique/totaux      : une ligne par transport (Express, Wagon complet, Funéraire)
// Dates facultatives : ?debut=2026-02-01&fin=2026-02-28


// 1) Factures marchandise de la période, avec client, destination, zone, type de wagon
//    et leurs lignes dans le champ "details"
statistique.get("/marchandise", async (req, res) => {
  const debut = req.query.debut || null; const fin = req.query.fin || null;

  try {
    const factures = await pool.query(
      `SELECT f.idfacturemarchandise, f.numfacturemarchandise,
              to_char(f.datefacturemarchandise, 'YYYY-MM-DD') AS datefacturemarchandise,
              f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal,
              f.piquiremarchandise, f.tva, f.montanthttotal, f.montantttc,
              c.nomclient, c.telephone, c.adresse,
              d.nomdestination, z.libellezone,
              w.libelletypewagon, w.modefacturation, w.poidsfacturation
       FROM public.facturemarchandise f
       JOIN public.client c ON c.idclient = f.idclient
       JOIN public.destination d ON d.iddestination = f.iddestination
       JOIN public.zonedestination z ON z.idzone = d.idzone
       LEFT JOIN LATERAL (
              SELECT tw.libelletypewagon, tw.modefacturation, tw.poidsfacturation
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
              df.prixapplicable, df.montantht, df.idmarchandise,
              COALESCE(m.designation, tt.libelletype) AS designation,
              COALESCE(tm.libelletype, tt.libelletype) AS libelletype
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
           c.nomclient, c.telephone, c.adresse,
           d.nomdestination, z.libellezone
    FROM public.facturefuneraire f
    JOIN public.client c ON c.idclient = f.idclient
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
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


module.exports = statistique;
