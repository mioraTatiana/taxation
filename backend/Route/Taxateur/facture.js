const express = require("express");
const pool = require("../Bd/db");
const facture = express.Router();

// Réponse d'erreur commune : un message clair pour le front
// 23503 = clé étrangère inconnue (ex: un idclient qui n'existe pas)
// 23502 = champ obligatoire manquant
function erreurSql(res, err, messageParDefaut) {
  if (err.code === "23503") {
    return res.status(400).json({ message: "Client, destination ou tarif inconnu", erreur: err.message });
  }
  if (err.code === "23502") {
    return res.status(400).json({ message: "Un champ obligatoire est manquant", erreur: err.message });
  }
  res.status(500).json({ message: messageParDefaut, erreur: err.message });
}


// 1) Ajouter la facture
//    La date est celle du serveur et le numéro (ex: 001/09-10-2026) est créé tout seul
//    par le trigger trg_generer_num_facture de la base.
facture.post("/ajouter", (req, res) => {
  const {
    idclient,
    iddestination,
    nombrecolistotal,
    poidsreeltotal,
    poidsfacturetotal,
    piquire,
    tva,
    montanthttotal,
    montantttc,
  } = req.body;

  const query = `
    INSERT INTO public.facture
      (datefacture, idclient, iddestination, nombrecolistotal, poidsreeltotal,
       poidsfacturetotal, piquire, tva, montanthttotal, montantttc)
    VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING idfacture, numfacture, to_char(datefacture, 'YYYY-MM-DD') AS datefacture`;

  pool.query(
    query,
    [idclient, iddestination, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquire, tva, montanthttotal, montantttc],
    (err, result) => {
      if (err) {
        return erreurSql(res, err, "Erreur lors de l'ajout dans la table facture");
      }

      res.status(201).json(result.rows[0]);
    }
  );
});


// 2) Ajouter une ligne (marchandise) à la facture
//    Le prix vient de la table tarif (WHERE idtarif = ...) et non du front :
//    prixapplicable = prixkg  et  montantht = prixkg x poids facturé.
facture.post("/ajouterdetail", (req, res) => {
  const { idfacture, idtarif, idmarchandise, nombrecolis, poidsreel, poidsfacture, nomdefunt } = req.body;

  // Les ::int, ::real et ::text indiquent à PostgreSQL le type de chaque valeur reçue
  const query = `
    INSERT INTO public.detailfacture
      (idfacture, idtarif, idmarchandise, nombrecolis, poidsreel, poidsfacture,
       prixapplicable, montantht, nomdefunt)
    SELECT $1::int, t.idtarif, $3::int, $4::int, $5::real, $6::real,
           t.prixkg, ROUND(t.prixkg * $6::real), $7::text
    FROM public.tarif t
    WHERE t.idtarif = $2
    RETURNING *`;

  pool.query(
    query,
    [idfacture, idtarif, idmarchandise || null, nombrecolis, poidsreel, poidsfacture, nomdefunt || null],
    (err, result) => {
      if (err) {
        return erreurSql(res, err, "Erreur lors de l'ajout dans la table detailfacture");
      }

      // Aucune ligne insérée : le tarif demandé n'existe pas
      if (result.rows.length === 0) {
        return res.status(400).json({ message: "Tarif introuvable" });
      }

      res.status(201).json(result.rows[0]);
    }
  );
});


// 3) Supprimer une facture et ses lignes
//    Le front l'appelle si l'enregistrement s'arrête en cours de route,
//    pour ne pas laisser une facture à moitié enregistrée.
facture.delete("/supprimer/:idfacture", (req, res) => {
  const idfacture = req.params.idfacture;

  // D'abord les lignes, ensuite la facture
  pool.query("DELETE FROM public.detailfacture WHERE idfacture = $1", [idfacture], (err) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la suppression des lignes de la facture");
    }

    pool.query("DELETE FROM public.facture WHERE idfacture = $1 RETURNING *", [idfacture], (err2, result) => {
      if (err2) {
        return erreurSql(res, err2, "Erreur lors de la suppression de la facture");
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Aucune facture trouvée" });
      }

      res.status(200).json({
        message: "Facture supprimée avec succès !",
        facture: result.rows[0],
      });
    });
  });
});


// 4) Supprimer une seule ligne
facture.delete("/supprimerdetail/:iddetailfacture", (req, res) => {
  const iddetailfacture = req.params.iddetailfacture;
  const query = "DELETE FROM public.detailfacture WHERE iddetailfacture = $1 RETURNING *";

  pool.query(query, [iddetailfacture], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la suppression de la ligne");
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune ligne trouvée" });
    }

    res.status(200).json({
      message: "Ligne supprimée avec succès !",
      detail: result.rows[0],
    });
  });
});


// ===================== AFFICHAGE : liste des factures et FactureApercu =====================

// Dates facultatives : /facture/selectionnertout?debut=2026-02-01&fin=2026-02-28
const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacture >= $1::date) AND ($2::date IS NULL OR f.datefacture <= $2::date)";

// 5) Liste des factures (page Facture) : les colonnes de la table facture + le nom du client et de la destination
//    to_char(...) renvoie la date en texte "2026-02-12" (évite un décalage d'un jour dans le JSON)
facture.get("/selectionnertout", (req, res) => {
  const debut = req.query.debut || null;
  const fin = req.query.fin || null;

  const query = `
    SELECT f.idfacture, f.numfacture, to_char(f.datefacture, 'YYYY-MM-DD') AS datefacture,
           f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal, f.piquire, f.tva,
           f.montanthttotal, f.montantttc, f.idclient, f.iddestination,
           c.nomclient, d.nomdestination
    FROM public.facture f
    JOIN public.client c ON c.idclient = f.idclient
    JOIN public.destination d ON d.iddestination = f.iddestination
    WHERE ${FILTRE_DATES}
    ORDER BY f.datefacture DESC, f.idfacture DESC`;

  pool.query(query, [debut, fin], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération des factures");
    }

    // Une liste vide n'est pas une erreur : la page affiche "Aucune facture"
    res.json(result.rows);
  });
});


// 6) Lignes d'une facture (pour FactureApercu)
//    À placer avant "/:idfacture" pour que Express ne les confonde pas.
facture.get("/:idfacture/details", (req, res) => {
  const idfacture = req.params.idfacture;

  const query = `
    SELECT df.iddetailfacture, df.nombrecolis, df.poidsreel, df.poidsfacture,
           df.prixapplicable, df.montantht, df.nomdefunt, m.designation
    FROM public.detailfacture df
    LEFT JOIN public.marchandise m ON m.idmarchandise = df.idmarchandise
    WHERE df.idfacture = $1
    ORDER BY df.iddetailfacture`;

  pool.query(query, [idfacture], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération des lignes de la facture");
    }

    res.json(result.rows);
  });
});


// 7) Une facture complète (pour l'en-tête de FactureApercu) :
//    client, destination, zone et type de wagon
facture.get("/:idfacture", (req, res) => {
  const idfacture = req.params.idfacture;

  const query = `
    SELECT f.idfacture, f.numfacture, to_char(f.datefacture, 'YYYY-MM-DD') AS datefacture,
           f.nombrecolistotal, f.poidsreeltotal, f.poidsfacturetotal, f.piquire, f.tva,
           f.montanthttotal, f.montantttc, f.idclient, f.iddestination,
           c.nomclient, c.telephone, c.adresse,
           d.nomdestination, z.libellezone,
           w.libelletrain AS wagon, w.modefacturation AS wagoncomplet
    FROM public.facture f
    JOIN public.client c ON c.idclient = f.idclient
    JOIN public.destination d ON d.iddestination = f.iddestination
    JOIN public.zonedestination z ON z.idzone = d.idzone
    -- Type de wagon d'une facture = celui du tarif de sa première ligne
    LEFT JOIN LATERAL (
           SELECT tt.libelletrain, tt.modefacturation
             FROM public.detailfacture df
             JOIN public.tarif t ON t.idtarif = df.idtarif
             JOIN public.typetrain tt ON tt.idtypetrain = t.idtypetrain
            WHERE df.idfacture = f.idfacture
            LIMIT 1) w ON true
    WHERE f.idfacture = $1`;

  pool.query(query, [idfacture], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération de la facture");
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune facture trouvée" });
    }

    res.json(result.rows[0]);
  });
});


module.exports = facture;
