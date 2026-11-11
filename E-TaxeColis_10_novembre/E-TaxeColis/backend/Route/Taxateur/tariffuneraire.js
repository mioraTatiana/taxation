const express = require("express");
const pool = require("../Bd/db");
const tariffuneraire = express.Router();

// Table tariffuneraire(idtariffuneraire, prixfixe, prixzone, idzone)
// idtariffuneraire est créé par la base : TF01, TF02 ... (voir Sql/1_amelioration_base.sql)
// prixfixe : prix imposé ; prixzone : prix de la zone
// Montant HT d'une facture funéraire = prixfixe x prixzone
// Un seul tarif funéraire par zone : contrainte unique_tariffuneraire_zone


// Vérifie qu'une clé étrangère existe dans la table référencée
const existe = async (table, colonne, valeur) => {
  const r = await pool.query(`SELECT 1 FROM public.${table} WHERE ${colonne} = $1`, [valeur]);
  return r.rows.length > 0;
};

// Erreur commune : 23505 = un tarif existe déjà pour cette zone
function erreurSql(res, err, messageParDefaut) {
  if (err.code === "23505") {
    return res.status(409).json({ message: "Un tarif funéraire existe déjà pour cette zone" });
  }
  res.status(500).json({ message: messageParDefaut, erreur: err.message });
}

// Jointure pour afficher le libellé de la zone
const SELECT_BASE = `SELECT t.idtariffuneraire, t.idzone, z.libellezone, z.kilometrage,
    t.prixfixe, t.prixzone
  FROM public.tariffuneraire t
  LEFT JOIN public.zonedestination z ON z.idzone = t.idzone`;

// Ajouter un tarif funéraire
tariffuneraire.post("/ajouter", async (req, res) => {
  const { idzone, prixfixe, prixzone } = req.body;

  if (!idzone || !prixfixe) {
    return res.status(400).json({ message: "idzone et prixfixe sont obligatoires" });
  }

  try {
    if (!(await existe("zonedestination", "idzone", idzone))) {
      return res.status(400).json({ message: `La zone ${idzone} n'existe pas` });
    }

    const result = await pool.query(
      "INSERT INTO public.tariffuneraire (idzone, prixfixe, prixzone) VALUES ($1, $2, $3) RETURNING *",
      [idzone, prixfixe, prixzone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur lors de l'ajout dans la table tariffuneraire");
  }
});

// Sélectionner tous les tarifs funéraires
tariffuneraire.get("/selectionnertout", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} ORDER BY t.idtariffuneraire`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Erreur lors de la récupération dans la table tariffuneraire");
  }
});

// Sélectionner un tarif funéraire par son id
tariffuneraire.get("/:idtariffuneraire", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_BASE} WHERE t.idtariffuneraire = $1`, [
      req.params.idtariffuneraire,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Erreur pendant la récupération dans la table tariffuneraire");
  }
});

// Modifier un tarif funéraire
tariffuneraire.put("/modifier/:idtariffuneraire", async (req, res) => {
  const { idzone, prixfixe, prixzone } = req.body;

  if (!idzone || !prixfixe) {
    return res.status(400).json({ message: "idzone et prixfixe sont obligatoires" });
  }

  try {
    if (!(await existe("zonedestination", "idzone", idzone))) {
      return res.status(400).json({ message: `La zone ${idzone} n'existe pas` });
    }

    const result = await pool.query(
      `UPDATE public.tariffuneraire SET idzone = $1, prixfixe = $2, prixzone = $3
       WHERE idtariffuneraire = $4 RETURNING *`,
      [idzone, prixfixe, prixzone, req.params.idtariffuneraire]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun tarif funéraire trouvé" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur pendant la modification de la table tariffuneraire");
  }
});

// Supprimer un tarif funéraire
tariffuneraire.delete("/supprimer/:idtariffuneraire", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM public.tariffuneraire WHERE idtariffuneraire = $1 RETURNING *",
      [req.params.idtariffuneraire]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun tarif funéraire trouvé" });
    }
    res.status(200).json({ message: "Tarif funéraire supprimé avec succès !", tarif: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression du tarif funéraire", erreur: err.message });
  }
});

module.exports = tariffuneraire;
