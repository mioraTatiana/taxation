const express = require("express");
const { Pool } = require("pg");
const typetrain = express.Router();

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
  console.log("Connexion reussie à la base de donnée taxation - table typetrain");
  release();
});

// Ajouter dans la table typetrain
typetrain.post("/ajouter", (req, res) => {
  const { libelletrain, modefacturation, poidsfacturation } = req.body;
  const query =
    "INSERT INTO public.typetrain (libelletrain, modefacturation, poidsfacturation) VALUES ($1, $2, $3) RETURNING *";

  pool.query(query, [libelletrain, modefacturation, poidsfacturation], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de l'ajout dans la table typetrain",
        erreur: err.message,
      });
    }
    res.status(201).json(result.rows[0]);
  });
});

// Sélectionner toutes les données de la table typetrain
typetrain.get("/selectionnertout", (req, res) => {
  const query = "SELECT * FROM public.typetrain ORDER BY idtypetrain";

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table typetrain");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table typetrain");
    }
    res.json(result.rows);
  });
});

// Sélectionner un type de train par son id
typetrain.get("/:idtypetrain", (req, res) => {
  const idtypetrain = req.params.idtypetrain;
  const query = "SELECT * FROM public.typetrain WHERE idtypetrain = $1";

  pool.query(query, [idtypetrain], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table typetrain");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  });
});

// Modifier un type de train
typetrain.put("/modifier/:idtypetrain", (req, res) => {
  const idtypetrain = req.params.idtypetrain;
  const { libelletrain, modefacturation, poidsfacturation } = req.body;
  const query =
    "UPDATE public.typetrain SET libelletrain = $1, modefacturation = $2, poidsfacturation = $3 WHERE idtypetrain = $4 RETURNING *";

  pool.query(
    query,
    [libelletrain, modefacturation, poidsfacturation, idtypetrain],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur pendant la modification de la table typetrain",
          erreur: err.message,
        });
      }
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Aucun type de train trouvé" });
      }
      res.status(200).json(result.rows[0]);
    }
  );
});

// Supprimer un type de train
typetrain.delete("/supprimer/:idtypetrain", (req, res) => {
  const idtypetrain = req.params.idtypetrain;
  const query = "DELETE FROM public.typetrain WHERE idtypetrain = $1 RETURNING *";

  pool.query(query, [idtypetrain], (err, result) => {
    if (err) {
      // 23503 = violation de clé étrangère (utilisé dans train ou tarif)
      if (err.code === "23503") {
        return res.status(409).json({
          message: "Suppression impossible : ce type de train est utilisé (train ou tarif)",
        });
      }
      return res.status(500).json({
        message: "Erreur lors de la suppression du type de train",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun type de train trouvé" });
    }
    res.status(200).json({
      message: "Type de train supprimé avec succès !",
      typetrain: result.rows[0],
    });
  });
});

module.exports = typetrain;
