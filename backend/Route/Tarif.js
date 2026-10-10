const express = require("express");
const { Pool } = require("pg");
const tarif = express.Router();

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
  console.log("Connexion reussie à la base de donnée taxation - table tarif");
  release();
});

// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// Vérifie les 3 clés étrangères de tarif.
// idzone est obligatoire (NOT NULL), les deux autres sont facultatives.
// Retourne un message d'erreur, ou null si tout est valide.
const verifierCles = async ({ idzone, idtypemarchandise, idtypetrain }) => {
  if (!idzone) return "idzone est obligatoire";
  if (!(await existe("zonedestination", "idzone", idzone))) {
    return `La zone ${idzone} n'existe pas`;
  }
  if (idtypemarchandise && !(await existe("typemarchandise", "idtypemarchandise", idtypemarchandise))) {
    return `Le type de marchandise ${idtypemarchandise} n'existe pas`;
  }
  if (idtypetrain && !(await existe("typetrain", "idtypetrain", idtypetrain))) {
    return `Le type de train ${idtypetrain} n'existe pas`;
  }
  return null;
};

// LEFT JOIN pour les clés facultatives
const SELECT_BASE = `SELECT t.idtarif, t.idzone, z.libellezone, z.kilometrage,
    t.idtypemarchandise, tm.libelletype,
    t.idtypetrain, tt.libelletrain AS libelletypetrain,
    t.prixkg
  FROM public.tarif t
  JOIN public.zonedestination z ON z.idzone = t.idzone
  LEFT JOIN public.typemarchandise tm ON tm.idtypemarchandise = t.idtypemarchandise
  LEFT JOIN public.typetrain tt ON tt.idtypetrain = t.idtypetrain`;

// Ajouter un tarif
tarif.post("/ajouter", async (req, res) => {
  const { idzone, idtypemarchandise, idtypetrain, prixkg } = req.body;

  try {
    const erreur = await verifierCles(req.body);
    if (erreur) {
      return res.status(400).json({ message: erreur });
    }

    const result = await pool.query(
      "INSERT INTO public.tarif (idzone, idtypemarchandise, idtypetrain, prixkg) VALUES ($1, $2, $3, $4) RETURNING *",
      [idzone, idtypemarchandise || null, idtypetrain || null, prixkg]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout dans la table tarif", erreur: err.message });
  }
});

// Sélectionner tous les tarifs
tarif.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY t.idtarif`);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée dans la table tarif");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table tarif");
  }
});

// Sélectionner un tarif par son id
tarif.get("/:idtarif", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE t.idtarif = $1`, [req.params.idtarif]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table tarif");
  }
});

// Modifier un tarif
tarif.put("/modifier/:idtarif", async (req, res) => {
  const { idzone, idtypemarchandise, idtypetrain, prixkg } = req.body;

  try {
    const erreur = await verifierCles(req.body);
    if (erreur) {
      return res.status(400).json({ message: erreur });
    }

    const result = await pool.query(
      "UPDATE public.tarif SET idzone = $1, idtypemarchandise = $2, idtypetrain = $3, prixkg = $4 WHERE idtarif = $5 RETURNING *",
      [idzone, idtypemarchandise || null, idtypetrain || null, prixkg, req.params.idtarif]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun tarif trouvé" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant la modification de la table tarif", erreur: err.message });
  }
});

// Supprimer un tarif
tarif.delete("/supprimer/:idtarif", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM public.tarif WHERE idtarif = $1 RETURNING *", [
      req.params.idtarif,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun tarif trouvé" });
    }
    res.status(200).json({ message: "Tarif supprimé avec succès !", tarif: result.rows[0] });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ message: "Suppression impossible : ce tarif est utilisé dans des détails de facture" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression du tarif", erreur: err.message });
  }
});

module.exports = tarif;
