const express = require("express");
const { Pool } = require("pg");
const train = express.Router();

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
  console.log("Connexion reussie à la base de donnée taxation - table train");
  release();
});

// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// Requête commune avec jointure pour afficher le libellé du type de train
const SELECT_BASE = `SELECT t.idtrain, t.libelletrain, t.idtypetrain, tt.libelletrain AS libelletypetrain
  FROM public.train t
  JOIN public.typetrain tt ON tt.idtypetrain = t.idtypetrain`;

// Ajouter un train
train.post("/ajouter", async (req, res) => {
  const { libelletrain, idtypetrain } = req.body;

  if (!idtypetrain) {
    return res.status(400).json({ message: "idtypetrain est obligatoire" });
  }

  try {
    if (!(await existe("typetrain", "idtypetrain", idtypetrain))) {
      return res.status(400).json({ message: `Le type de train ${idtypetrain} n'existe pas` });
    }

    const result = await pool.query(
      "INSERT INTO public.train (libelletrain, idtypetrain) VALUES ($1, $2) RETURNING *",
      [libelletrain, idtypetrain]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout dans la table train", erreur: err.message });
  }
});

// Sélectionner tous les trains
train.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY t.idtrain`);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table train");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table train");
  }
});

// Sélectionner un train par son id
train.get("/:idtrain", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE t.idtrain = $1`, [req.params.idtrain]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table train");
  }
});

// Modifier un train
train.put("/modifier/:idtrain", async (req, res) => {
  const { libelletrain, idtypetrain } = req.body;

  if (!idtypetrain) {
    return res.status(400).json({ message: "idtypetrain est obligatoire" });
  }

  try {
    if (!(await existe("typetrain", "idtypetrain", idtypetrain))) {
      return res.status(400).json({ message: `Le type de train ${idtypetrain} n'existe pas` });
    }

    const result = await pool.query(
      "UPDATE public.train SET libelletrain = $1, idtypetrain = $2 WHERE idtrain = $3 RETURNING *",
      [libelletrain, idtypetrain, req.params.idtrain]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun train trouvé" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant la modification de la table train", erreur: err.message });
  }
});

// Supprimer un train
train.delete("/supprimer/:idtrain", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM public.train WHERE idtrain = $1 RETURNING *", [
      req.params.idtrain,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun train trouvé" });
    }
    res.status(200).json({ message: "Train supprimé avec succès !", train: result.rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ message: "Suppression impossible : ce train est utilisé dans des détails de facture" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression du train", erreur: err.message });
  }
});

module.exports = train;
