const express = require("express");
const pool = require("../Bd/db");
const tarifmarchandise = express.Router();

// Table tarifmarchandise(idtarifmarchandise, idzone, idtypemarchandise, idtypewagon, prixkg)
// idtarifmarchandise est créé par la base : TRF01, TRF02 ...
// Un seul tarif par (zone + type de marchandise + type de wagon) : contrainte unique_tarif


// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// Vérifie les 3 clés étrangères (toutes obligatoires).
// Retourne un message d'erreur, ou null si tout est valide.
const verifierCles = async ({ idzone, idtypemarchandise, idtypewagon }) => {
  if (!idzone || !idtypemarchandise || !idtypewagon) {
    return "idzone, idtypemarchandise et idtypewagon sont obligatoires";
  }
  if (!(await existe("zonedestination", "idzone", idzone))) {
    return `La zone ${idzone} n'existe pas`;
  }
  if (!(await existe("typemarchandise", "idtypemarchandise", idtypemarchandise))) {
    return `Le type de marchandise ${idtypemarchandise} n'existe pas`;
  }
  if (!(await existe("typewagon", "idtypewagon", idtypewagon))) {
    return `Le type de wagon ${idtypewagon} n'existe pas`;
  }
  return null;
};

// Erreur commune : 23505 = ce tarif existe déjà pour cette zone, ce type et ce wagon
function erreurSql(res, err, messageParDefaut) {
  if (err.code === "23505") {
    return res.status(409).json({
      message: "Un tarif existe déjà pour cette zone, ce type de marchandise et ce type de wagon",
    });
  }
  res.status(500).json({ message: messageParDefaut, erreur: err.message });
}

// Jointures pour afficher les libellés
const SELECT_BASE = `SELECT t.idtarifmarchandise, t.idzone, z.libellezone, z.kilometrage,
    t.idtypemarchandise, tm.libelletype, tm.soumistva,
    t.idtypewagon, tw.libelletypewagon, tw.modefacturation, tw.poidsfacturation,
    t.prixkg
  FROM public.tarifmarchandise t
  JOIN public.zonedestination z ON z.idzone = t.idzone
  JOIN public.typemarchandise tm ON tm.idtypemarchandise = t.idtypemarchandise
  JOIN public.typewagon tw ON tw.idtypewagon = t.idtypewagon`;

// Ajouter un tarif
tarifmarchandise.post("/ajouter", async (req, res) => {
  const { idzone, idtypemarchandise, idtypewagon, prixkg } = req.body;

  try {
    const erreur = await verifierCles(req.body);
    if (erreur) {
      return res.status(400).json({ message: erreur });
    }

    const result = await pool.query(
      `INSERT INTO public.tarifmarchandise (idzone, idtypemarchandise, idtypewagon, prixkg)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [idzone, idtypemarchandise, idtypewagon, prixkg]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur lors de l'ajout dans la table tarifmarchandise");
  }
});

// Sélectionner tous les tarifs
tarifmarchandise.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY t.idzone, t.idtypewagon, t.idtypemarchandise`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table tarifmarchandise");
  }
});

// Sélectionner un tarif par son id
tarifmarchandise.get("/:idtarifmarchandise", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE t.idtarifmarchandise = $1`, [
      req.params.idtarifmarchandise,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table tarifmarchandise");
  }
});

// Modifier un tarif
tarifmarchandise.put("/modifier/:idtarifmarchandise", async (req, res) => {
  const { idzone, idtypemarchandise, idtypewagon, prixkg } = req.body;

  try {
    const erreur = await verifierCles(req.body);
    if (erreur) {
      return res.status(400).json({ message: erreur });
    }

    const result = await pool.query(
      `UPDATE public.tarifmarchandise
       SET idzone = $1, idtypemarchandise = $2, idtypewagon = $3, prixkg = $4
       WHERE idtarifmarchandise = $5 RETURNING *`,
      [idzone, idtypemarchandise, idtypewagon, prixkg, req.params.idtarifmarchandise]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun tarif trouvé" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur pendant la modification de la table tarifmarchandise");
  }
});

// Supprimer un tarif
tarifmarchandise.delete("/supprimer/:idtarifmarchandise", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM public.tarifmarchandise WHERE idtarifmarchandise = $1 RETURNING *",
      [req.params.idtarifmarchandise]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun tarif trouvé" });
    }
    res.status(200).json({ message: "Tarif supprimé avec succès !", tarif: result.rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ message: "Suppression impossible : ce tarif est utilisé dans des factures" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression du tarif", erreur: err.message });
  }
});

module.exports = tarifmarchandise;
