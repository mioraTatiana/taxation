const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs"); // npm install bcryptjs
const usertable = express.Router();

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
  console.log("Connexion reussie à la base de donnée taxation - table usertable");
  release();
});

// Colonnes renvoyées (le mot de passe n'est JAMAIS renvoyé)
// Attention : dans la base la colonne s'appelle "emailutilisteur" (sans le 2e "a")
const COLONNES =
  "iduser, nomutilisateur, typeutilisateur, emailutilisteur, statut, image";

// Convertit l'image (bytea -> Buffer) en base64 pour le JSON
const formater = (row) => ({
  ...row,
  image: row.image ? row.image.toString("base64") : null,
});

// Convertit l'image reçue (base64) en Buffer pour la colonne bytea
const versBuffer = (image) => (image ? Buffer.from(image, "base64") : null);

// Ajouter dans la table usertable
usertable.post("/ajouter", async (req, res) => {
  const { nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut, image } =
    req.body;

  if (!nomutilisateur || !typeutilisateur || !motpasse) {
    return res.status(400).json({
      message: "nomutilisateur, typeutilisateur et motpasse sont obligatoires",
    });
  }

  try {
    const motpasseHash = await bcrypt.hash(motpasse, 10);
    const query = `INSERT INTO public.usertable
      (nomutilisateur, typeutilisateur, motpasse, emailutilisteur, statut, image)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLONNES}`;

    const result = await pool.query(query, [
      nomutilisateur,
      typeutilisateur,
      motpasseHash,
      emailutilisateur,
      statut,
      versBuffer(image),
    ]);
    res.status(201).json(formater(result.rows[0]));
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de l'ajout dans la table usertable",
      erreur: err.message,
    });
  }
});

// Sélectionner toutes les données de la table usertable
usertable.get("/selectionnertout", (req, res) => {
  const query = `SELECT ${COLONNES} FROM public.usertable ORDER BY iduser`;

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table usertable");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table usertable");
    }
    res.json(result.rows.map(formater));
  });
});

// Sélectionner un utilisateur par son id
usertable.get("/:iduser", (req, res) => {
  const iduser = req.params.iduser;
  const query = `SELECT ${COLONNES} FROM public.usertable WHERE iduser = $1`;

  pool.query(query, [iduser], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table usertable");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(formater(result.rows[0]));
  });
});

// Modifier un utilisateur
// motpasse et image sont facultatifs : s'ils sont absents, ils restent inchangés
usertable.put("/modifier/:iduser", async (req, res) => {
  const iduser = req.params.iduser;
  const { nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut, image } =
    req.body;

  try {
    const motpasseHash = motpasse ? await bcrypt.hash(motpasse, 10) : null;
    const query = `UPDATE public.usertable SET
        nomutilisateur = $1,
        typeutilisateur = $2,
        motpasse = COALESCE($3, motpasse),
        emailutilisteur = $4,
        statut = $5,
        image = COALESCE($6, image)
      WHERE iduser = $7 RETURNING ${COLONNES}`;

    const result = await pool.query(query, [
      nomutilisateur,
      typeutilisateur,
      motpasseHash,
      emailutilisateur,
      statut,
      versBuffer(image),
      iduser,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    res.status(200).json(formater(result.rows[0]));
  } catch (err) {
    res.status(500).json({
      message: "Erreur pendant la modification de la table usertable",
      erreur: err.message,
    });
  }
});

// Supprimer un utilisateur
usertable.delete("/supprimer/:iduser", (req, res) => {
  const iduser = req.params.iduser;
  const query = `DELETE FROM public.usertable WHERE iduser = $1 RETURNING ${COLONNES}`;

  pool.query(query, [iduser], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de la suppression de l'utilisateur",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    res.status(200).json({
      message: "Utilisateur supprimé avec succès !",
      utilisateur: formater(result.rows[0]),
    });
  });
});

module.exports = usertable;
