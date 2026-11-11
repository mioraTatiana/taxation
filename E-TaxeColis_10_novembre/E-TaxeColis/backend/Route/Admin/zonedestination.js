const express = require("express");
const pool = require("../Bd/db");
const zone = express.Router();

// Table zonedestination(idzone, libellezone, kilometrage)
// idzone est créé par la base : ZN01, ZN02 ...


// Ajouter dans la table zonedestination
zone.post("/ajouter", (req, res) => {
  const { libellezone, kilometrage } = req.body;
  const query =
    "INSERT INTO public.zonedestination (libellezone, kilometrage) VALUES ($1, $2) RETURNING *";

  pool.query(query, [libellezone, kilometrage], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de l'ajout dans la table zonedestination",
        erreur: err.message,
      });
    }
    res.status(201).json(result.rows[0]);
  });
});

// Sélectionner toutes les données de la table zonedestination
// Une liste vide n'est pas une erreur : on renvoie []
zone.get("/selectionnertout", (req, res) => {
  const query = "SELECT * FROM public.zonedestination ORDER BY idzone";

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table zonedestination");
    }
    res.json(result.rows);
  });
});

// Sélectionner une zone par son id
zone.get("/:idzone", (req, res) => {
  const idzone = req.params.idzone;
  const query = "SELECT * FROM public.zonedestination WHERE idzone = $1";

  pool.query(query, [idzone], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table zonedestination");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  });
});

// Modifier une zone
zone.put("/modifier/:idzone", (req, res) => {
  const idzone = req.params.idzone;
  const { libellezone, kilometrage } = req.body;
  const query =
    "UPDATE public.zonedestination SET libellezone = $1, kilometrage = $2 WHERE idzone = $3 RETURNING *";

  pool.query(query, [libellezone, kilometrage, idzone], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur pendant la modification de la table zonedestination",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune zone trouvée" });
    }
    res.status(200).json(result.rows[0]);
  });
});

// Supprimer une zone
zone.delete("/supprimer/:idzone", (req, res) => {
  const idzone = req.params.idzone;
  const query = "DELETE FROM public.zonedestination WHERE idzone = $1 RETURNING *";

  pool.query(query, [idzone], (err, result) => {
    if (err) {
      // 23503 = violation de clé étrangère (zone utilisée dans destination ou tarif)
      if (err.code === "23503") {
        return res.status(409).json({
          message: "Suppression impossible : cette zone est utilisée (destination ou tarif)",
        });
      }
      return res.status(500).json({
        message: "Erreur lors de la suppression de la zone",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucune zone trouvée" });
    }
    res.status(200).json({
      message: "Zone supprimée avec succès !",
      zone: result.rows[0],
    });
  });
});

module.exports = zone;
