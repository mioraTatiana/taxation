const express = require("express");
const pool = require("../Bd/db");
const facturefuneraire = express.Router();

// Table facturefuneraire(idfacturefuneraire, numfacturefuneraire, datefacturefuneraire,
//   piquirefuneraire, montanthttfuneraire, montantttcfunerare, nomdefunt,
//   idclient, iddestination, iduser)
// Attention : la colonne s'écrit bien "montantttcfunerare" (sans le "i") dans la base.
// Le numéro (ex: 001/05-01-2027/F) est créé par le trigger trg_generer_num_facture_funeraire.
// Les calculs sont faits dans le frontend :
//   montanthttfuneraire = prixfixe x prixzone (table tariffuneraire)
//   montantttcfunerare  = montant HT + piquire, arrondi à la centaine
// Ce fichier n'a ni modification ni suppression.
// iduser = le taxateur connecté (lu dans son jeton par verifierToken, voir server.js).


// Réponse d'erreur commune
function erreurSql(res, err, messageParDefaut) {
  if (err.code === "23503") {
    return res.status(400).json({ message: "Client, destination ou utilisateur inconnu", erreur: err.message });
  }
  res.status(500).json({ message: messageParDefaut, erreur: err.message });
}

// Dates facultatives : /facturefuneraire/selectionnertout?debut=2026-02-01&fin=2026-02-28
const FILTRE_DATES =
  "($1::date IS NULL OR f.datefacturefuneraire >= $1::date) AND ($2::date IS NULL OR f.datefacturefuneraire <= $2::date)";

// Colonnes de facturefuneraire + nom du client + nom de la destination
// (+ téléphone, adresse et zone pour l'affichage de la facture)
const SELECT_BASE = `
  SELECT f.idfacturefuneraire, f.numfacturefuneraire,
         to_char(f.datefacturefuneraire, 'YYYY-MM-DD') AS datefacturefuneraire,
         f.piquirefuneraire, f.montanthttfuneraire, f.montantttcfunerare, f.nomdefunt,
         f.idclient, f.iddestination, f.iduser,
         c.nomclient, c.sigle, c.telephone, c.adresse,
         d.nomdestination, z.libellezone
  FROM public.facturefuneraire f
  JOIN public.client c ON c.idclient = f.idclient
  JOIN public.destination d ON d.iddestination = f.iddestination
  JOIN public.zonedestination z ON z.idzone = d.idzone`;


// 1) Ajouter une facture funéraire
facturefuneraire.post("/ajouter", (req, res) => {
  const { piquirefuneraire, montanthttfuneraire, montantttcfunerare, nomdefunt, idclient, iddestination } =
    req.body;

  if (!nomdefunt || !idclient || !iddestination) {
    return res.status(400).json({ message: "nomdefunt, idclient et iddestination sont obligatoires" });
  }

  const query = `
    INSERT INTO public.facturefuneraire
      (datefacturefuneraire, piquirefuneraire, montanthttfuneraire, montantttcfunerare,
       nomdefunt, idclient, iddestination, iduser)
    VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7)
    RETURNING idfacturefuneraire, numfacturefuneraire,
              to_char(datefacturefuneraire, 'YYYY-MM-DD') AS datefacturefuneraire`;

  pool.query(
    query,
    [piquirefuneraire, montanthttfuneraire, montantttcfunerare, nomdefunt, idclient, iddestination, req.utilisateur.iduser],
    (err, result) => {
      if (err) {
        return erreurSql(res, err, "Erreur lors de l'ajout dans la table facturefuneraire");
      }
      res.status(201).json(result.rows[0]);
    }
  );
});

// 2) Toutes les factures funéraires, avec le nom du client et le nom de la destination
facturefuneraire.get("/selectionnertout", (req, res) => {
  const query = `${SELECT_BASE}
    WHERE ${FILTRE_DATES}
    ORDER BY f.datefacturefuneraire DESC, f.idfacturefuneraire DESC`;

  pool.query(query, [req.query.debut || null, req.query.fin || null], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération des factures funéraires");
    }
    res.json(result.rows);
  });
});

// 3) Une seule facture funéraire, avec le nom du client et le nom de la destination
facturefuneraire.get("/:idfacturefuneraire", (req, res) => {
  const query = `${SELECT_BASE} WHERE f.idfacturefuneraire = $1`;

  pool.query(query, [req.params.idfacturefuneraire], (err, result) => {
    if (err) {
      return erreurSql(res, err, "Erreur lors de la récupération de la facture funéraire");
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune facture funéraire trouvée" });
    }
    res.json(result.rows[0]);
  });
});

module.exports = facturefuneraire;
