const { Pool } = require("pg");

// Une seule connexion partagée par toutes les routes
// (au lieu d'un "new Pool" dans chaque fichier de Route)
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "VOTRE_MOT_DE_PASSE",
  database: "taxation",
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erreur de connexion à la base de données", err.stack);
  }

  console.log("Connexion reussie à la base de donnée taxation");
  release();
});

module.exports = pool;
