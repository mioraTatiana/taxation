const express = require("express");
const { Pool } = require("pg");
const client = express.Router();

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "miorapost12",
  database: "taxation",
  port: 5432,
});

// Connexion à la base de données
pool.connect((err, cnx, release) => {
  if (err) {
    return console.error("Erreur de connexion à la base de données", err.stack);
  }
  console.log("Connexion reussie à la base de donnée taxation - table client");
  release();
});

// Ajouter dans la table client
client.post("/ajouter", (req, res) => {
  const { nomclient, sigle, cin, telephone, adresse, email } = req.body;
  const query =
    "INSERT INTO public.client (nomclient, sigle, cin, telephone, adresse, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";

  pool.query(query, [nomclient, sigle, cin, telephone, adresse, email], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de l'ajout dans la table client",
        erreur: err.message,
      });
    }
    res.status(201).json(result.rows[0]);
  });
});

// Sélectionner toutes les données de la table client
client.get("/selectionnertout", (req, res) => {
  const query = "SELECT * FROM public.client ORDER BY idclient";

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table client");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table client");
    }
    res.json(result.rows);
  });
});

// Sélectionner un client par son id
client.get("/:idclient", (req, res) => {
  const idclient = req.params.idclient;
  const query = "SELECT * FROM public.client WHERE idclient = $1";

  pool.query(query, [idclient], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table client");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  });
});

// Modifier un client
client.put("/modifier/:idclient", (req, res) => {
  const idclient = req.params.idclient;
  const { nomclient, sigle, cin, telephone, adresse, email } = req.body;
  const query =
    "UPDATE public.client SET nomclient = $1, sigle = $2, cin = $3, telephone = $4, adresse = $5, email = $6 WHERE idclient = $7 RETURNING *";

  pool.query(
    query,
    [nomclient, sigle, cin, telephone, adresse, email, idclient],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur pendant la modification de la table client",
          erreur: err.message,
        });
      }
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Aucun client trouvé" });
      }
      res.status(200).json(result.rows[0]);
    }
  );
});

// Supprimer un client
client.delete("/supprimer/:idclient", (req, res) => {
  const idclient = req.params.idclient;
  const query = "DELETE FROM public.client WHERE idclient = $1 RETURNING *";

  pool.query(query, [idclient], (err, result) => {
    if (err) {
      // 23503 = violation de clé étrangère (client utilisé dans facture)
      if (err.code === "23503") {
        return res.status(409).json({
          message: "Suppression impossible : ce client possède des factures",
        });
      }
      return res.status(500).json({
        message: "Erreur lors de la suppression du client",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun client trouvé" });
    }
    res.status(200).json({
      message: "Client supprimé avec succès !",
      client: result.rows[0],
    });
  });
});

module.exports = client;
