const { Pool } = require("pg");
require("dotenv").config({ quiet: true }); // lit le fichier .env (à la racine du backend)

// Une seule connexion partagée par toutes les routes
// Les valeurs viennent du fichier .env ; sinon on prend les valeurs par défaut.
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "miorapost12",
  database: process.env.DB_NAME || "taxation",
  port: Number(process.env.DB_PORT) || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erreur de connexion à la base de données", err.stack);
  }

  console.log(`Connexion réussie à la base de données ${process.env.DB_NAME || "taxation"}`);
  release();
});

module.exports = pool;
