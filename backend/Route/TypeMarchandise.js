const express = require("express");
const { Pool } = require("pg");
const typemarchandise = express.Router();

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "miorapost12",
  database: "taxation",
  port: 5432,
});

// Connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erreur de connexion à la base de données", err.stack);
  }
  console.log("Connexion reussie à la base de donnée taxation - table typemarchandise");
  release();
});

// Ajouter dans la table typemarchandise
typemarchandise.post("/ajouter", (req, res) => {
  const { libelletype, soumistva } = req.body;
  const query =
    "INSERT INTO public.typemarchandise (libelletype, soumistva) VALUES ($1, $2) RETURNING *";

  pool.query(query, [libelletype, soumistva], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de l'ajout dans la table typemarchandise",
        erreur: err.message,
      });
    }
    res.status(201).json(result.rows[0]);
  });
});

// Sélectionner toutes les données de la table typemarchandise
typemarchandise.get("/selectionnertout", (req, res) => {
  const query = "SELECT * FROM public.typemarchandise ORDER BY idtypemarchandise";

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table typemarchandise");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table typemarchandise");
    }
    res.json(result.rows);
  });
});

// Sélectionner un type de marchandise par son id
typemarchandise.get("/:idtypemarchandise", (req, res) => {
  const idtypemarchandise = req.params.idtypemarchandise;
  const query = "SELECT * FROM public.typemarchandise WHERE idtypemarchandise = $1";

  pool.query(query, [idtypemarchandise], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table typemarchandise");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  });
});

// Modifier un type de marchandise
typemarchandise.put("/modifier/:idtypemarchandise", (req, res) => {
  const idtypemarchandise = req.params.idtypemarchandise;
  const { libelletype, soumistva } = req.body;
  const query =
    "UPDATE public.typemarchandise SET libelletype = $1, soumistva = $2 WHERE idtypemarchandise = $3 RETURNING *";

  pool.query(query, [libelletype, soumistva, idtypemarchandise], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur pendant la modification de la table typemarchandise",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun type de marchandise trouvé" });
    }
    res.status(200).json(result.rows[0]);
  });
});

// Supprimer un type de marchandise
typemarchandise.delete("/supprimer/:idtypemarchandise", (req, res) => {
  const idtypemarchandise = req.params.idtypemarchandise;
  const query =
    "DELETE FROM public.typemarchandise WHERE idtypemarchandise = $1 RETURNING *";

  pool.query(query, [idtypemarchandise], (err, result) => {
    if (err) {
      // 23503 = violation de clé étrangère (utilisé dans marchandise ou tarif)
      if (err.code === "23503") {
        return res.status(409).json({
          message: "Suppression impossible : ce type est utilisé (marchandise ou tarif)",
        });
      }
      return res.status(500).json({
        message: "Erreur lors de la suppression du type de marchandise",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun type de marchandise trouvé" });
    }
    res.status(200).json({
      message: "Type de marchandise supprimé avec succès !",
      typemarchandise: result.rows[0],
    });
  });
});

module.exports = typemarchandise;
