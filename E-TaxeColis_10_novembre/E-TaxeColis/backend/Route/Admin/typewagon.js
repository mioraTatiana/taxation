const express = require("express");
const pool = require("../Bd/db");
const typewagon = express.Router();

// Table typewagon(idtypewagon, libelletypewagon, modefacturation, poidsfacturation, poidssupporte)
// idtypewagon est créé par la base : TRN01, TRN02 ...
// modefacturation : true = wagon complet (série 100, série 400), false = Express
// poidsfacturation : poids FACTURÉ d'un wagon complet (série 100 : 20000, série 400 : 25000), 0 pour l'Express
// poidssupporte    : poids SUPPORTÉ = charge maximum (série 100 : 15000, série 400 : 20000), 0 pour l'Express


// Ajouter dans la table typewagon
typewagon.post("/ajouter", (req, res) => {
  const { libelletypewagon, modefacturation, poidsfacturation, poidssupporte } = req.body;
  const query =
    "INSERT INTO public.typewagon (libelletypewagon, modefacturation, poidsfacturation, poidssupporte) VALUES ($1, $2, $3, $4) RETURNING *";

  pool.query(query, [libelletypewagon, modefacturation, poidsfacturation, poidssupporte || 0], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Erreur lors de l'ajout dans la table typewagon",
        erreur: err.message,
      });
    }
    res.status(201).json(result.rows[0]);
  });
});

// Sélectionner toutes les données de la table typewagon
typewagon.get("/selectionnertout", (req, res) => {
  const query = "SELECT * FROM public.typewagon ORDER BY idtypewagon";

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table typewagon");
    }
    res.json(result.rows);
  });
});

// Sélectionner un type de wagon par son id
typewagon.get("/:idtypewagon", (req, res) => {
  const idtypewagon = req.params.idtypewagon;
  const query = "SELECT * FROM public.typewagon WHERE idtypewagon = $1";

  pool.query(query, [idtypewagon], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table typewagon");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  });
});

// Modifier un type de wagon
typewagon.put("/modifier/:idtypewagon", (req, res) => {
  const idtypewagon = req.params.idtypewagon;
  const { libelletypewagon, modefacturation, poidsfacturation, poidssupporte } = req.body;
  const query =
    "UPDATE public.typewagon SET libelletypewagon = $1, modefacturation = $2, poidsfacturation = $3, poidssupporte = $4 WHERE idtypewagon = $5 RETURNING *";

  pool.query(
    query,
    [libelletypewagon, modefacturation, poidsfacturation, poidssupporte || 0, idtypewagon],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur pendant la modification de la table typewagon",
          erreur: err.message,
        });
      }
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Aucun type de wagon trouvé" });
      }
      res.status(200).json(result.rows[0]);
    }
  );
});

// Supprimer un type de wagon
typewagon.delete("/supprimer/:idtypewagon", (req, res) => {
  const idtypewagon = req.params.idtypewagon;
  const query = "DELETE FROM public.typewagon WHERE idtypewagon = $1 RETURNING *";

  pool.query(query, [idtypewagon], (err, result) => {
    if (err) {
      // 23503 = violation de clé étrangère (utilisé dans wagon ou tarifmarchandise)
      if (err.code === "23503") {
        return res.status(409).json({
          message: "Suppression impossible : ce type de wagon est utilisé (wagon ou tarif)",
        });
      }
      return res.status(500).json({
        message: "Erreur lors de la suppression du type de wagon",
        erreur: err.message,
      });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun type de wagon trouvé" });
    }
    res.status(200).json({
      message: "Type de wagon supprimé avec succès !",
      typewagon: result.rows[0],
    });
  });
});

module.exports = typewagon;
