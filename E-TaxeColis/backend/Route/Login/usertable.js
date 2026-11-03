const express = require("express");
const pool = require("../Bd/db");
const bcrypt = require("bcryptjs"); // npm install bcryptjs
const { creerToken, verifierToken, autoriser, ADMIN } = require("../Securite/auth");
const { envoyerEmailActivation } = require("../Email/email");
const usertable = express.Router();

// Qui peut faire quoi :
//   /ajouter et /authentification : tout le monde (pas besoin d'être connecté)
//   /selectionnertout, /activer, /desactiver : l'admin seulement
//   /:iduser, /changermotpasse, /modifier : l'utilisateur lui-même (ou l'admin pour /:iduser)
//   /admin/modifier : l'admin seulement (page Statut)

// Table usertable(iduser, nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut)
// iduser est créé par la base : USER01, USER02 ...
// typeutilisateur : admin, taxateur, directeur, chef de division
// statut : "en attente" (compte créé), "actif" (peut se connecter), "desactive"

const EN_ATTENTE = "en attente";
const ACTIF = "actif";
const DESACTIVE = "desactive";

// Colonnes renvoyées : le mot de passe n'est JAMAIS renvoyé
const COLONNES = "iduser, nomutilisateur, typeutilisateur, emailutilisateur, statut";


// Erreur commune : 23505 = cet email est déjà utilisé
function erreurSql(res, err, messageParDefaut) {
  if (err.code === "23505") {
    return res.status(409).json({ message: "Cette adresse e-mail est déjà utilisée" });
  }
  res.status(500).json({ message: messageParDefaut, erreur: err.message });
}

// Lit le mot de passe haché d'un utilisateur et le compare avec celui reçu.
// Retourne true si le mot de passe est bon.
async function motPasseCorrect(iduser, motpasse) {
  const result = await pool.query("SELECT motpasse FROM public.usertable WHERE iduser = $1", [iduser]);
  if (result.rows.length === 0 || !motpasse) return false;
  return bcrypt.compare(motpasse, result.rows[0].motpasse);
}


// Middleware : l'utilisateur ne peut toucher qu'à son propre compte (l'admin peut tout lire)
function soiMemeOuAdmin(req, res, next) {
  if (req.utilisateur.iduser === req.params.iduser || req.utilisateur.typeutilisateur === ADMIN) {
    return next();
  }
  res.status(403).json({ message: "Vous ne pouvez accéder qu'à votre propre compte" });
}

function soiMeme(req, res, next) {
  if (req.utilisateur.iduser === req.params.iduser) return next();
  res.status(403).json({ message: "Vous ne pouvez modifier que votre propre compte" });
}


// 1) Création de compte : le statut est toujours "en attente"
//    (c'est l'admin qui active le compte ensuite)
usertable.post("/ajouter", async (req, res) => {
  const { nomutilisateur, typeutilisateur, motpasse, emailutilisateur } = req.body;

  if (!nomutilisateur || !typeutilisateur || !motpasse || !emailutilisateur) {
    return res.status(400).json({
      message: "nomutilisateur, typeutilisateur, emailutilisateur et motpasse sont obligatoires",
    });
  }

  // Un compte administrateur ne se crée pas par l'inscription publique (voir scripts/creerAdmin.js)
  if (typeutilisateur === ADMIN) {
    return res.status(400).json({ message: "Un compte administrateur ne peut pas être demandé à l'inscription" });
  }

  try {
    const motpasseHash = await bcrypt.hash(motpasse, 10);
    const result = await pool.query(
      `INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLONNES}`,
      [nomutilisateur, typeutilisateur, motpasseHash, emailutilisateur, EN_ATTENTE]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur lors de l'ajout dans la table usertable");
  }
});


// 2) Authentification : emailutilisateur + motpasse, et le compte doit être "actif"
//    Réponse : { utilisateur: {...}, token: "..." }
usertable.post("/authentification", async (req, res) => {
  const { emailutilisateur, motpasse } = req.body;

  if (!emailutilisateur || !motpasse) {
    return res.status(400).json({ message: "Saisissez l'e-mail et le mot de passe" });
  }

  try {
    const result = await pool.query(
      `SELECT ${COLONNES}, motpasse FROM public.usertable WHERE emailutilisateur = $1`,
      [emailutilisateur]
    );

    // Même message si l'email ou le mot de passe est faux (on ne dit pas lequel)
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "E-mail ou mot de passe incorrect" });
    }

    const { motpasse: motpasseHash, ...utilisateur } = result.rows[0];
    const correct = await bcrypt.compare(motpasse, motpasseHash);
    if (!correct) {
      return res.status(401).json({ message: "E-mail ou mot de passe incorrect" });
    }

    if (utilisateur.statut !== ACTIF) {
      return res.status(403).json({
        message:
          utilisateur.statut === EN_ATTENTE
            ? "Votre compte est en attente d'activation par l'administrateur"
            : "Votre compte est désactivé",
      });
    }

    // Le jeton prouve la connexion : le frontend le renverra à chaque requête
    res.status(200).json({ utilisateur, token: creerToken(utilisateur) });
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant l'authentification", erreur: err.message });
  }
});


// 3) Sélectionner toutes les données de la table usertable
usertable.get("/selectionnertout", verifierToken, autoriser(ADMIN), (req, res) => {
  const query = `SELECT ${COLONNES} FROM public.usertable ORDER BY iduser`;

  pool.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Erreur lors de la récupération dans la table usertable");
    }
    res.json(result.rows);
  });
});


// 4) Sélectionner un utilisateur par son id
usertable.get("/:iduser", verifierToken, soiMemeOuAdmin, (req, res) => {
  const iduser = req.params.iduser;
  const query = `SELECT ${COLONNES} FROM public.usertable WHERE iduser = $1`;

  pool.query(query, [iduser], (err, result) => {
    if (err) {
      return res.status(500).send("Erreur pendant la récupération dans la table usertable");
    }
    if (result.rows.length === 0) {
      return res.status(404).send("Aucune donnée trouvée");
    }
    res.json(result.rows[0]);
  });
});


// 5) Activer un compte : "en attente" ou "desactive" -> "actif"
//    typeutilisateur est facultatif : l'admin peut changer le rôle en même temps.
//    Ensuite, un email de confirmation est envoyé à l'utilisateur.
//    Si l'email échoue, le compte reste activé : la réponse dit seulement emailEnvoye = false.
usertable.put("/activer/:iduser", verifierToken, autoriser(ADMIN), async (req, res) => {
  const iduser = req.params.iduser;
  const typeutilisateur = req.body ? req.body.typeutilisateur : null;

  try {
    const result = await pool.query(
      `UPDATE public.usertable
       SET statut = $1, typeutilisateur = COALESCE($2, typeutilisateur)
       WHERE iduser = $3 RETURNING ${COLONNES}`,
      [ACTIF, typeutilisateur || null, iduser]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    const utilisateur = result.rows[0];

    let emailEnvoye = false;
    try {
      emailEnvoye = await envoyerEmailActivation(utilisateur);
    } catch (errEmail) {
      console.error("Email d'activation non envoyé :", errEmail.message);
    }

    res.status(200).json({ ...utilisateur, emailEnvoye });
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant l'activation du compte", erreur: err.message });
  }
});


// 6) Désactiver un compte : "actif" (ou "en attente") -> "desactive"
usertable.put("/desactiver/:iduser", verifierToken, autoriser(ADMIN), (req, res) => {
  const iduser = req.params.iduser;

  // L'admin ne peut pas désactiver son propre compte (il ne pourrait plus se connecter)
  if (iduser === req.utilisateur.iduser) {
    return res.status(400).json({ message: "Vous ne pouvez pas désactiver votre propre compte" });
  }
  const query = `UPDATE public.usertable SET statut = $1 WHERE iduser = $2 RETURNING ${COLONNES}`;

  pool.query(query, [DESACTIVE, iduser], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Erreur pendant la désactivation du compte", erreur: err.message });
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    res.status(200).json(result.rows[0]);
  });
});


// 7) Changer le mot de passe : il faut donner l'ancien mot de passe
usertable.put("/changermotpasse/:iduser", verifierToken, soiMeme, async (req, res) => {
  const iduser = req.params.iduser;
  const { ancienmotpasse, nouveaumotpasse } = req.body;

  if (!ancienmotpasse || !nouveaumotpasse) {
    return res.status(400).json({ message: "ancienmotpasse et nouveaumotpasse sont obligatoires" });
  }

  try {
    if (!(await motPasseCorrect(iduser, ancienmotpasse))) {
      return res.status(400).json({ message: "L'ancien mot de passe est incorrect" }); // 400 et pas 401 : 401 = session expirée pour le frontend
    }

    const motpasseHash = await bcrypt.hash(nouveaumotpasse, 10);
    const result = await pool.query(
      `UPDATE public.usertable SET motpasse = $1 WHERE iduser = $2 RETURNING ${COLONNES}`,
      [motpasseHash, iduser]
    );
    res.status(200).json({ message: "Mot de passe changé avec succès !", utilisateur: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant le changement du mot de passe", erreur: err.message });
  }
});


// 8) "Mon profil" : l'utilisateur change SON nom, SON email et, s'il le veut, SON mot de passe.
//    Il confirme toujours avec son mot de passe actuel (motpasse).
//    Il ne peut PAS changer son type d'utilisateur ni son statut (seul l'admin le peut, route 9).
//    Corps : { nomutilisateur, emailutilisateur, motpasse, nouveaumotpasse (facultatif) }
usertable.put("/modifier/:iduser", verifierToken, soiMeme, async (req, res) => {
  const iduser = req.params.iduser;
  const { nomutilisateur, emailutilisateur, motpasse, nouveaumotpasse } = req.body;

  if (!nomutilisateur || !emailutilisateur || !motpasse) {
    return res.status(400).json({
      message: "nomutilisateur, emailutilisateur et motpasse (confirmation) sont obligatoires",
    });
  }
  if (nouveaumotpasse && nouveaumotpasse.length < 8) {
    return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
  }

  try {
    if (!(await motPasseCorrect(iduser, motpasse))) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect" }); // 400 et pas 401 : 401 = session expirée pour le frontend
    }

    // Nouveau mot de passe facultatif : s'il est vide, l'ancien est gardé (COALESCE)
    const nouveauHash = nouveaumotpasse ? await bcrypt.hash(nouveaumotpasse, 10) : null;
    const result = await pool.query(
      `UPDATE public.usertable
       SET nomutilisateur = $1, emailutilisateur = $2, motpasse = COALESCE($3, motpasse)
       WHERE iduser = $4 RETURNING ${COLONNES}`,
      [nomutilisateur, emailutilisateur, nouveauHash, iduser]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur pendant la modification du profil");
  }
});


// 9) Page admin "Statut" : l'admin change TOUT sur un compte
//    (nom, email, type d'utilisateur, statut et, s'il le veut, un nouveau mot de passe).
//    Il confirme avec SON PROPRE mot de passe d'administrateur (motpasseadmin).
//    Corps : { nomutilisateur, emailutilisateur, typeutilisateur, statut,
//              nouveaumotpasse (facultatif), motpasseadmin }
const TYPES = ["admin", "taxateur", "directeur", "chef de division"];
const STATUTS = [EN_ATTENTE, ACTIF, DESACTIVE];

usertable.put("/admin/modifier/:iduser", verifierToken, autoriser(ADMIN), async (req, res) => {
  const iduser = req.params.iduser;
  const { nomutilisateur, emailutilisateur, typeutilisateur, statut, nouveaumotpasse, motpasseadmin } = req.body;

  if (!nomutilisateur || !emailutilisateur || !typeutilisateur || !statut || !motpasseadmin) {
    return res.status(400).json({
      message: "Nom, email, type, statut et votre mot de passe d'administrateur sont obligatoires",
    });
  }
  if (!TYPES.includes(typeutilisateur)) {
    return res.status(400).json({ message: `Type d'utilisateur inconnu : ${typeutilisateur}` });
  }
  if (!STATUTS.includes(statut)) {
    return res.status(400).json({ message: `Statut inconnu : ${statut}` });
  }
  if (nouveaumotpasse && nouveaumotpasse.length < 8) {
    return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
  }

  // L'admin ne peut pas se bloquer lui-même
  if (iduser === req.utilisateur.iduser && (typeutilisateur !== ADMIN || statut !== ACTIF)) {
    return res.status(400).json({
      message: "Vous ne pouvez pas retirer votre propre rôle d'administrateur ni désactiver votre compte",
    });
  }

  try {
    // Confirmation avec le mot de passe de l'admin connecté (pas celui du compte modifié)
    if (!(await motPasseCorrect(req.utilisateur.iduser, motpasseadmin))) {
      return res.status(400).json({ message: "Votre mot de passe d'administrateur est incorrect" }); // 400 et pas 401 : 401 = session expirée pour le frontend
    }

    const nouveauHash = nouveaumotpasse ? await bcrypt.hash(nouveaumotpasse, 10) : null;
    const result = await pool.query(
      `UPDATE public.usertable
       SET nomutilisateur = $1, emailutilisateur = $2, typeutilisateur = $3, statut = $4,
           motpasse = COALESCE($5, motpasse)
       WHERE iduser = $6 RETURNING ${COLONNES}`,
      [nomutilisateur, emailutilisateur, typeutilisateur, statut, nouveauHash, iduser]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    erreurSql(res, err, "Erreur pendant la modification de l'utilisateur");
  }
});

module.exports = usertable;
