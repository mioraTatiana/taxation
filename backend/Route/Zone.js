const express = require("express");
const { Pool } = require("pg");
const zone = express.Router();



const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "miorapost12",
  database: "taxation",
  port: 5432,
});

//Connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erreur de connexion à la base de données", err.stack);
  }

  console.log("Connexion reussie à la base de donnée taxation - table zone");
  release();
});


//Ajouter dans la table zonedestination
zone.post("/ajouter", async (req, res) => {
  const { libellezone, kilometrage } = req.body;
  const query =
    "INSERT INTO public.zonedestination (libellezone, kilometrage) VALUES ($1, $2) RETURNING *";

  pool.query(query, [libellezone, kilometrage], (err, result) => {
    if (err) {
      return res
        .status(500)
        .send("Erreur lors de l'ajout dans la table zonedestination");
    }

    res.status(201).json(result.rows[0]);
  });
});


// Selectionner les données dans la table zonedestination
zone.get("/selectionnertout", async (req, res) => {
  const query = "SELECT * FROM public.zonedestination";

  pool.query(query, (err, result) => {
    if (err) {
      res.status(500).send("Erreur lors de la récupération dans la table zonedestination");
    } else if (result.rows.length === 0) {
      res.status(404).send("Aucune donnée dans la table zone");
    } else {
      res.json(result.rows);
    }
  });
});

zone.get("/:idzone", (req, res) => {
  const idzone = req.params.idzone;
  const query = "SELECT * FROM public.zonedestination WHERE idzone = $1";

  pool.query(query, [idzone], (err, result) => {
    if (err) {
        res.status(500).send("Erreur pendant la récupération dans la table zonedestination")
    } else if (result.rows.length === 0) {
        res.status(400).send("Aucune donnée trouvée")   
    } else {
        res.json(result.rows)
    }
  });
});


zone.put("/modifier/:idzone", (req, res) => {
    const idzone = req.params.idzone;
    const {libellezone, kilometrage} = req.body;
    const query = "UPDATE public.zoneedestination SET libellezone = $1, kilometrage = $2 WHERE idzone=$3 RETURNING *";

    pool.query(query, [libellezone, kilometrage, idzone], (err, result)=> {
        if (err) {
            res.status(500).send("Erreur pendant la modification de la table zonedestination");
        } 

        res.status(200).json(result.rows);
    })

})

zone.delete("/supprimer/:idzone", (req, res)=>{
    const idzone= req.params.idzone;
    const query = "DELETE FROM public.zonedestination WHERE idzone = $1"

    pool.query(query, [idzone], (err, result)=>{
        if (err) {
          res.status(500).send("Erreur lors de la suppression de la table zonedestination");
        } else if (result.rows.length === 0) {
          res.status(404).send(" Aucune donnée trouvée ");
        } else {
          res.json(result.rows);
        }
    })
})


module.exports = zone;