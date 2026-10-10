const express = require("express");
const { Pool } = require("pg");
const marchandise = express.Router();

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "miorapost12",
  database: "taxation",
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erreur de connexion à la base de données", err.stack);
  }
  console.log("Connexion reussie à la base de donnée taxation - table marchandise");
  release();
});

// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// LEFT JOIN car idtypemarchandise peut être NULL dans la base
const SELECT_BASE = `SELECT m.idmarchandise, m.designation, m.poidscolis, m.idtypemarchandise,
    tm.libelletype, tm.soumistva
  FROM public.marchandise m
  LEFT JOIN public.typemarchandise tm ON tm.idtypemarchandise = m.idtypemarchandise`;

// Ajouter une marchandise
marchandise.post("/ajouter", async (req, res) => {
  const { designation, poidscolis, idtypemarchandise } = req.body;

  if (!designation || poidscolis === undefined || poidscolis === null) {
    return res.status(400).json({ message: "designation et poidscolis sont obligatoires" });
  }

  try {
    // idtypemarchandise est facultatif : on ne vérifie que s'il est fourni
    if (idtypemarchandise && !(await existe("typemarchandise", "idtypemarchandise", idtypemarchandise))) {
      return res.status(400).json({ message: `Le type de marchandise ${idtypemarchandise} n'existe pas` });
    }

    const result = await pool.query(
      "INSERT INTO public.marchandise (designation, poidscolis, idtypemarchandise) VALUES ($1, $2, $3) RETURNING *",
      [designation, poidscolis, idtypemarchandise || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout dans la table marchandise", erreur: err.message });
  }
});

// Sélectionner toutes les marchandises
marchandise.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY m.idmarchandise`);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table marchandise");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table marchandise");
  }
});

// Sélectionner une marchandise par son id
marchandise.get("/:idmarchandise", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE m.idmarchandise = $1`, [req.params.idmarchandise]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table marchandise");
  }
});

// Modifier une marchandise
marchandise.put("/modifier/:idmarchandise", async (req, res) => {
  const { designation, poidscolis, idtypemarchandise } = req.body;

  if (!designation || poidscolis === undefined || poidscolis === null) {
    return res.status(400).json({ message: "designation et poidscolis sont obligatoires" });
  }

  try {
    if (idtypemarchandise && !(await existe("typemarchandise", "idtypemarchandise", idtypemarchandise))) {
      return res.status(400).json({ message: `Le type de marchandise ${idtypemarchandise} n'existe pas` });
    }

    const result = await pool.query(
      "UPDATE public.marchandise SET designation = $1, poidscolis = $2, idtypemarchandise = $3 WHERE idmarchandise = $4 RETURNING *",
      [designation, poidscolis, idtypemarchandise || null, req.params.idmarchandise]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune marchandise trouvée" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant la modification de la table marchandise", erreur: err.message });
  }
});

// Supprimer une marchandise
marchandise.delete("/supprimer/:idmarchandise", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM public.marchandise WHERE idmarchandise = $1 RETURNING *", [
      req.params.idmarchandise,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune marchandise trouvée" });
    }
    res.status(200).json({ message: "Marchandise supprimée avec succès !", marchandise: result.rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ message: "Suppression impossible : cette marchandise est utilisée dans des détails de facture" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression de la marchandise", erreur: err.message });
  }
});

module.exports = marchandise;
