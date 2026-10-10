const express = require("express");
const { Pool } = require("pg");
const destination = express.Router();

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
  console.log("Connexion reussie à la base de donnée taxation - table destination");
  release();
});

// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// Jointure avec la zone pour afficher son libellé et son kilométrage
const SELECT_BASE = `SELECT d.iddestination, d.nomdestination, d.typedestination, d.codegare,
    d.pointkilometrique, d.idzone, z.libellezone, z.kilometrage
  FROM public.destination d
  JOIN public.zonedestination z ON z.idzone = d.idzone`;

// Ajouter une destination
destination.post("/ajouter", async (req, res) => {
  const { nomdestination, typedestination, codegare, pointkilometrique, idzone } = req.body;

  if (!nomdestination || !typedestination || !idzone) {
    return res.status(400).json({
      message: "nomdestination, typedestination et idzone sont obligatoires",
    });
  }

  try {
    if (!(await existe("zonedestination", "idzone", idzone))) {
      return res.status(400).json({ message: `La zone ${idzone} n'existe pas` });
    }

    const result = await pool.query(
      `INSERT INTO public.destination (nomdestination, typedestination, codegare, pointkilometrique, idzone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nomdestination, typedestination, codegare, pointkilometrique, idzone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout dans la table destination", erreur: err.message });
  }
});

// Sélectionner toutes les destinations
destination.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY d.iddestination`);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table destination");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table destination");
  }
});

// Sélectionner une destination par son id
destination.get("/:iddestination", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE d.iddestination = $1`, [req.params.iddestination]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table destination");
  }
});

// Modifier une destination
destination.put("/modifier/:iddestination", async (req, res) => {
  const { nomdestination, typedestination, codegare, pointkilometrique, idzone } = req.body;

  if (!nomdestination || !typedestination || !idzone) {
    return res.status(400).json({
      message: "nomdestination, typedestination et idzone sont obligatoires",
    });
  }

  try {
    if (!(await existe("zonedestination", "idzone", idzone))) {
      return res.status(400).json({ message: `La zone ${idzone} n'existe pas` });
    }

    const result = await pool.query(
      `UPDATE public.destination
       SET nomdestination = $1, typedestination = $2, codegare = $3, pointkilometrique = $4, idzone = $5
       WHERE iddestination = $6 RETURNING *`,
      [nomdestination, typedestination, codegare, pointkilometrique, idzone, req.params.iddestination]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune destination trouvée" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant la modification de la table destination", erreur: err.message });
  }
});

// Supprimer une destination
destination.delete("/supprimer/:iddestination", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM public.destination WHERE iddestination = $1 RETURNING *", [
      req.params.iddestination,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune destination trouvée" });
    }
    res.status(200).json({ message: "Destination supprimée avec succès !", destination: result.rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ message: "Suppression impossible : cette destination est utilisée dans des factures" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression de la destination", erreur: err.message });
  }
});

module.exports = destination;
