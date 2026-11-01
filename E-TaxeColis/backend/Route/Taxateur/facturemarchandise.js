const express = require("express");
const pool = require("../Bd/db");
const facturemarchandise = express.Router();

// Tables facturemarchandise (l'en-tête de la facture) et detailfacture (les lignes).
// Les calculs (poids, montants, TVA, arrondi) sont faits dans le frontend.
// Le numéro (ex: 001/05-01-2027) est créé par le trigger trg_generer_num_facture de la base.
// Ce fichier n'a ni modification ni suppression : une facture enregistrée ne change plus.


// Réponse d'erreur commune : un message clair pour le front
// 23503 = clé étrangère inconnue (ex: un idclient qui n'existe pas)
// 23502 = champ obligatoire manquant
function erreurSql(res, err, messageParDefaut) {
  if (err.code === "23503") {
    return res.status(400).json({ message: "Client, destination, tarif, marchandise ou wagon inconnu", erreur: err.message });
  }
  if (err.code === "23502") {
    return res.status(400).json({ message: "Un champ obligatoire est manquant", erreur: err.message });
  }
  res.status(500).json({ message: messageParDefaut, erreur: err.message });
}

// Dates facultatives : /facturemarchandise/selectionnertout?debut=2026-02-01&fin=2026-02-28
const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacturemarchandise >= $1::date) AND ($2::date IS NULL OR f.datefacturemarchandise <= $2::date)";

// Colonnes de facturemarchandise + nom du client + nom de la destination
// to_char(...) renvoie la date en texte "2026-02-12" (évite un décalage d'un jour dans le JSON)
const SELECT_FACTURE = `
  SELECT f.idfacturemarchandise, f.numfacturemarchandise,
         to_char(f.datefacturemarchandise, 'YYYY-MM-DD') AS datefacturemarchandise,
         f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal, f.piquiremarchandise,
         f.tva, f.montanthttotal, f.montantttc, f.idclient, f.iddestination, f.iduser,
         c.nomclient, d.nomdestination
  FROM public.facturemarchandise f
  JOIN public.client c ON c.idclient = f.idclient
  JOIN public.destination d ON d.iddestination = f.iddestination`;

// Même chose + téléphone et adresse du client, zone, et type de wagon de la facture.
// Le type de wagon d'une facture = celui du tarif de sa première ligne.
const SELECT_FACTURE_COMPLETE = `
  SELECT f.idfacturemarchandise, f.numfacturemarchandise,
         to_char(f.datefacturemarchandise, 'YYYY-MM-DD') AS datefacturemarchandise,
         f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal, f.piquiremarchandise,
         f.tva, f.montanthttotal, f.montantttc, f.idclient, f.iddestination, f.iduser,
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
          LIMIT 1) w ON true`;

// Lignes de facture avec la désignation et le type.
// Wagon complet : la 1re ligne n'a pas de marchandise (idmarchandise vide) ;
// sa désignation est alors le type du tarif (PPN ou Divers).
const SELECT_DETAIL_COMPLET = `
  SELECT df.iddetailfacture, df.idfacturemarchandise, df.nombrecolis, df.poidsreel, df.poidsfacture,
         df.prixapplicable, df.montantht, df.idtarifmarchandise, df.idmarchandise, df.idwagon,
         COALESCE(m.designation, tt.libelletype) AS designation,
         COALESCE(tm.libelletype, tt.libelletype) AS libelletype,
         wg.libellewagon
  FROM public.detailfacture df
  JOIN public.tarifmarchandise t ON t.idtarifmarchandise = df.idtarifmarchandise
  JOIN public.typemarchandise tt ON tt.idtypemarchandise = t.idtypemarchandise
  LEFT JOIN public.marchandise m ON m.idmarchandise = df.idmarchandise
  LEFT JOIN public.typemarchandise tm ON tm.idtypemarchandise = m.idtypemarchandise
  LEFT JOIN public.wagon wg ON wg.idwagon = df.idwagon`;

// Ajoute à chaque facture la liste de ses lignes dans le champ "details"
async function ajouterDetails(factures) {
  if (factures.length === 0) return [];

  const ids = factures.map((f) => f.idfacturemarchandise);
  const result = await pool.query(
    `${SELECT_DETAIL_COMPLET} WHERE df.idfacturemarchandise = ANY($1::int[]) ORDER BY df.iddetailfacture`,
    [ids]
  );

  return factures.map((facture) => ({
    ...facture,
    details: result.rows.filter((ligne) => ligne.idfacturemarchandise === facture.idfacturemarchandise),
  }));
}


// ===================== AJOUT =====================

// 1) Ajouter une facture et toutes ses lignes en une seule requête.
//
//  Le front envoie :
//  {
//    nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise,
//    tva, montanthttotal, montantttc, idclient, iddestination,
//    lignes: [ { nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht,
//                idtarifmarchandise, idmarchandise, idwagon }, ... ]
//  }
//
//  Étapes :
//   a) BEGIN : on ouvre une transaction
//   b) INSERT dans facturemarchandise ... RETURNING idfacturemarchandise
//      (la date est celle du serveur, le numéro est créé par le trigger)
//   c) on boucle sur "lignes" : un INSERT dans detailfacture par ligne, avec l'id de l'étape b
//   d) COMMIT : tout est enregistré
//  Si une étape échoue : ROLLBACK, rien n'est enregistré (pas de facture à moitié enregistrée).
facturemarchandise.post("/ajouter", async (req, res) => {
  const {
    nombrecolistotal,
    poidsreeltotal,
    poidsfacturetotal,
    piquiremarchandise,
    tva,
    montanthttotal,
    montantttc,
    idclient,
    iddestination,
    lignes,
  } = req.body;

  if (!Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ message: "La facture doit contenir au moins une ligne" });
  }

  // Une seule connexion pour toute la transaction
  const connexion = await pool.connect();

  try {
    await connexion.query("BEGIN");

    // b) L'en-tête de la facture
    const resultFacture = await connexion.query(
      `INSERT INTO public.facturemarchandise
         (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal,
          piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING idfacturemarchandise, numfacturemarchandise,
                 to_char(datefacturemarchandise, 'YYYY-MM-DD') AS datefacturemarchandise`,
      [
        nombrecolistotal,
        poidsreeltotal,
        poidsfacturetotal,
        piquiremarchandise,
        tva,
        montanthttotal,
        montantttc,
        idclient,
        iddestination,
        req.utilisateur.iduser, // le taxateur connecté (lu dans son jeton)
      ]
    );
    const facture = resultFacture.rows[0];

    // c) Les lignes, une par une, avec l'id de la facture
    const details = [];
    for (const ligne of lignes) {
      const resultLigne = await connexion.query(
        `INSERT INTO public.detailfacture
           (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht,
            idtarifmarchandise, idfacturemarchandise, idmarchandise, idwagon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          ligne.nombrecolis,
          ligne.poidsreel,
          ligne.poidsfacture,
          ligne.prixapplicable,
          ligne.montantht,
          ligne.idtarifmarchandise,
          facture.idfacturemarchandise,
          ligne.idmarchandise || null, // vide pour la ligne "wagon complet"
          ligne.idwagon || null,
        ]
      );
      details.push(resultLigne.rows[0]);
    }

    // d) Tout s'est bien passé
    await connexion.query("COMMIT");
    res.status(201).json({ ...facture, details });
  } catch (err) {
    await connexion.query("ROLLBACK");
    erreurSql(res, err, "Erreur lors de l'ajout de la facture marchandise");
  } finally {
    connexion.release(); // on rend la connexion au pool
  }
});


// ===================== SÉLECTIONS =====================
// Attention à l'ordre : les routes "/detail/..." et "/complet/..." sont placées
// avant "/:idfacturemarchandise" pour que Express ne les confonde pas.

// 2) Toutes les factures (seulement avec le nom du client et le nom de la destination)
facturemarchandise.get("/selectionnertout", (req, res) => {
  const query = `${SELECT_FACTURE}
    WHERE ${FILTRE_DATES}
    ORDER BY f.datefacturemarchandise DESC, f.idfacturemarchandise DESC`;

  pool.query(query, [req.query.debut || null, req.query.fin || null], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération des factures marchandise");
    }
    res.json(result.rows);
  });
});

// 3) Toutes les lignes de la table detailfacture (seulement)
facturemarchandise.get("/detail/selectionnertout", (req, res) => {
  const query = "SELECT * FROM public.detailfacture ORDER BY idfacturemarchandise, iddetailfacture";

  pool.query(query, (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération des lignes de facture");
    }
    res.json(result.rows);
  });
});

// 4) Une seule ligne de la table detailfacture (seulement)
facturemarchandise.get("/detail/:iddetailfacture", (req, res) => {
  const query = "SELECT * FROM public.detailfacture WHERE iddetailfacture = $1";

  pool.query(query, [req.params.iddetailfacture], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération de la ligne de facture");
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune ligne trouvée" });
    }
    res.json(result.rows[0]);
  });
});

// 5) Toutes les factures avec le nom du client, la destination ET toutes leurs lignes (champ "details")
facturemarchandise.get("/complet/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_FACTURE_COMPLETE}
       WHERE ${FILTRE_DATES}
       ORDER BY f.datefacturemarchandise DESC, f.idfacturemarchandise DESC`,
      [req.query.debut || null, req.query.fin || null]
    );
    res.json(await ajouterDetails(result.rows));
  } catch (err) {
    erreurSql(res, err, "Erreur lors de la récupération des factures complètes");
  }
});

// 6) Toutes les factures complètes d'un client (avec l'id du client)
facturemarchandise.get("/complet/client/:idclient", async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_FACTURE_COMPLETE}
       WHERE f.idclient = $1
       ORDER BY f.datefacturemarchandise DESC, f.idfacturemarchandise DESC`,
      [req.params.idclient]
    );
    res.json(await ajouterDetails(result.rows));
  } catch (err) {
    erreurSql(res, err, "Erreur lors de la récupération des factures du client");
  }
});

// 7) Une seule facture avec le nom du client, la destination ET ses lignes
facturemarchandise.get("/complet/:idfacturemarchandise", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_FACTURE_COMPLETE} WHERE f.idfacturemarchandise = $1`, [
      req.params.idfacturemarchandise,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune facture trouvée" });
    }
    const factures = await ajouterDetails(result.rows);
    res.json(factures[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur lors de la récupération de la facture complète");
  }
});

// 8) Une seule facture (seulement avec le nom du client et le nom de la destination)
facturemarchandise.get("/:idfacturemarchandise", (req, res) => {
  const query = `${SELECT_FACTURE} WHERE f.idfacturemarchandise = $1`;

  pool.query(query, [req.params.idfacturemarchandise], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération de la facture marchandise");
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune facture trouvée" });
    }
    res.json(result.rows[0]);
  });
});

module.exports = facturemarchandise;
