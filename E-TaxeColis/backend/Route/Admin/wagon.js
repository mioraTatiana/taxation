const express = require("express");
const pool = require("../Bd/db");
const wagon = express.Router();

// Table wagon(idwagon, libellewagon, idtypewagon)
// idwagon est un entier auto-incrémenté


// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// Requête commune avec jointure pour afficher le libellé du type de wagon
const SELECT_BASE = `SELECT w.idwagon, w.libellewagon, w.idtypewagon,
    tw.libelletypewagon, tw.modefacturation, tw.poidsfacturation
  FROM public.wagon w
  JOIN public.typewagon tw ON tw.idtypewagon = w.idtypewagon`;

// Ajouter un wagon
wagon.post("/ajouter", async (req, res) => {
  const { libellewagon, idtypewagon } = req.body;

  if (!libellewagon || !idtypewagon) {
    return res.status(400).json({ message: "libellewagon et idtypewagon sont obligatoires" });
  }

  try {
    if (!(await existe("typewagon", "idtypewagon", idtypewagon))) {
      return res.status(400).json({ message: `Le type de wagon ${idtypewagon} n'existe pas` });
    }

    const result = await pool.query(
      "INSERT INTO public.wagon (libellewagon, idtypewagon) VALUES ($1, $2) RETURNING *",
      [libellewagon, idtypewagon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout dans la table wagon", erreur: err.message });
  }
});

// Sélectionner tous les wagons
wagon.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY w.idwagon`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table wagon");
  }
});

// Sélectionner un wagon par son id
wagon.get("/:idwagon", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE w.idwagon = $1`, [req.params.idwagon]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table wagon");
  }
});

// Modifier un wagon
wagon.put("/modifier/:idwagon", async (req, res) => {
  const { libellewagon, idtypewagon } = req.body;

  if (!libellewagon || !idtypewagon) {
    return res.status(400).json({ message: "libellewagon et idtypewagon sont obligatoires" });
  }

  try {
    if (!(await existe("typewagon", "idtypewagon", idtypewagon))) {
      return res.status(400).json({ message: `Le type de wagon ${idtypewagon} n'existe pas` });
    }

    const result = await pool.query(
      "UPDATE public.wagon SET libellewagon = $1, idtypewagon = $2 WHERE idwagon = $3 RETURNING *",
      [libellewagon, idtypewagon, req.params.idwagon]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun wagon trouvé" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant la modification de la table wagon", erreur: err.message });
  }
});

// Supprimer un wagon
wagon.delete("/supprimer/:idwagon", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM public.wagon WHERE idwagon = $1 RETURNING *", [
      req.params.idwagon,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun wagon trouvé" });
    }
    res.status(200).json({ message: "Wagon supprimé avec succès !", wagon: result.rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ message: "Suppression impossible : ce wagon est utilisé dans des factures" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression du wagon", erreur: err.message });
  }
});

module.exports = wagon;
