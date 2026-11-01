// =====================================================================
// CRÉATION DU COMPTE ADMINISTRATEUR
//
// Commande (dans le dossier backend) :   npm run creer-admin
//
// Le nom, l'email et le mot de passe sont lus dans le fichier .env :
//   ADMIN_NOM, ADMIN_EMAIL, ADMIN_MOTPASSE
// - Si aucun compte n'a cet email : le compte admin est créé (statut "actif").
// - Si un compte a déjà cet email : il devient admin actif, avec ce mot de passe.
//   (pratique si vous avez oublié le mot de passe de l'admin)
// =====================================================================
require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "taxation",
  port: Number(process.env.DB_PORT) || 5432,
});

const nom = process.env.ADMIN_NOM || "Administrateur";
const email = process.env.ADMIN_EMAIL;
const motpasse = process.env.ADMIN_MOTPASSE;

async function creerAdmin() {
  if (!email || !motpasse) {
    console.error("Remplissez ADMIN_EMAIL et ADMIN_MOTPASSE dans le fichier .env");
    process.exit(1);
  }
  if (motpasse.length < 8) {
    console.error("ADMIN_MOTPASSE doit contenir au moins 8 caractères");
    process.exit(1);
  }

  try {
    const motpasseHash = await bcrypt.hash(motpasse, 10);
    const existe = await pool.query("SELECT iduser FROM public.usertable WHERE emailutilisateur = $1", [email]);

    if (existe.rows.length > 0) {
      await pool.query(
        `UPDATE public.usertable
         SET nomutilisateur = $1, typeutilisateur = 'admin', motpasse = $2, statut = 'actif'
         WHERE emailutilisateur = $3`,
        [nom, motpasseHash, email]
      );
      console.log(`Compte existant mis à jour : ${email} est maintenant administrateur actif.`);
    } else {
      const result = await pool.query(
        `INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut)
         VALUES ($1, 'admin', $2, $3, 'actif') RETURNING iduser`,
        [nom, motpasseHash, email]
      );
      console.log(`Compte administrateur créé (${result.rows[0].iduser}).`);
    }

    console.log(`  Email        : ${email}`);
    console.log(`  Mot de passe : celui de ADMIN_MOTPASSE dans le fichier .env`);
  } catch (err) {
    console.error("Erreur pendant la création de l'administrateur :", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

creerAdmin();
