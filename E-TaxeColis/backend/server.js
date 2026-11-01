const express = require("express");
const cors = require("cors");
require("dotenv").config({ quiet: true }); // lit le fichier .env AVANT de charger les routes
const { verifierToken, ecriturePour, ADMIN, TAXATEUR } = require("./Route/Securite/auth");
const app = express();

app.use(express.json());
app.use(cors());

// =====================================================================
// QUI PEUT FAIRE QUOI
//  verifierToken     : il faut être connecté (jeton valide, compte actif)
//  ecriturePour(...) : tout le monde connecté peut LIRE (GET),
//                      seuls ces rôles peuvent ajouter / modifier / supprimer
// Les routes /user gèrent elles-mêmes leurs droits (inscription et connexion sont publiques).
// =====================================================================

// ----- Utilisateurs (inscription et connexion publiques, le reste protégé) -----
app.use("/user", require("./Route/Login/usertable"));

// ----- Admin : seul l'admin modifie ; tout le monde connecté lit (le taxateur en a besoin) -----
app.use("/zone", verifierToken, ecriturePour(ADMIN), require("./Route/Admin/zonedestination"));
app.use("/destination", verifierToken, ecriturePour(ADMIN), require("./Route/Admin/destination"));
app.use("/typewagon", verifierToken, ecriturePour(ADMIN), require("./Route/Admin/typewagon"));
app.use("/wagon", verifierToken, ecriturePour(ADMIN), require("./Route/Admin/wagon"));

// ----- Taxateur : le taxateur (et l'admin) modifient ; tout le monde connecté lit -----
app.use("/client", verifierToken, ecriturePour(TAXATEUR, ADMIN), require("./Route/Taxateur/client"));
app.use("/typemarchandise", verifierToken, ecriturePour(TAXATEUR, ADMIN), require("./Route/Taxateur/typemarchandise"));
app.use("/marchandise", verifierToken, ecriturePour(TAXATEUR, ADMIN), require("./Route/Taxateur/marchandise"));
app.use("/tarifmarchandise", verifierToken, ecriturePour(TAXATEUR, ADMIN), require("./Route/Taxateur/tarifmarchandise"));
app.use("/tariffuneraire", verifierToken, ecriturePour(TAXATEUR, ADMIN), require("./Route/Taxateur/tariffuneraire"));

// ----- Factures : seul le taxateur les crée -----
app.use("/facturemarchandise", verifierToken, ecriturePour(TAXATEUR), require("./Route/Taxateur/facturemarchandise"));
app.use("/facturefuneraire", verifierToken, ecriturePour(TAXATEUR), require("./Route/Taxateur/facturefuneraire"));

// ----- Recette, statistique, tableau de bord : lecture pour tout utilisateur connecté -----
app.use("/recette", verifierToken, require("./Route/Direction/recette"));
app.use("/statistique", verifierToken, require("./Route/Direction/statistique"));
app.use("/tableaudebord", verifierToken, require("./Route/Direction/tableaudebord"));

app.get("/", (req, res) => {
  res.send("Serveur Express fonctionne !");
});

const PORT = Number(process.env.PORT) || 8082;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  if (!process.env.SMTP_USER) {
    console.log("Emails en MODE TEST : ils sont affichés ici au lieu d'être envoyés (voir SMTP_USER dans .env)");
  }
});
