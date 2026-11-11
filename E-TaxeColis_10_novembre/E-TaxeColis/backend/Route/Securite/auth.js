const jwt = require("jsonwebtoken");
const pool = require("../Bd/db");

// =====================================================================
// AUTHENTIFICATION PAR JETON (JWT)
//
// 1) À la connexion (/user/authentification), le serveur crée un jeton signé
//    avec JWT_SECRET (fichier .env) et l'envoie au frontend.
// 2) Le frontend renvoie ce jeton à chaque requête, dans l'en-tête :
//        Authorization: Bearer <jeton>
// 3) verifierToken lit ce jeton, vérifie qu'il est valide, puis vérifie dans
//    la base que le compte est toujours "actif" (un compte désactivé par
//    l'admin est bloqué tout de suite, même avec un jeton encore valide).
// 4) autoriser(...) et ecriturePour(...) vérifient le rôle (typeutilisateur).
// =====================================================================

const ADMIN = "admin";
const TAXATEUR = "taxateur";
const DIRECTEUR = "directeur";
const CHEF_DIVISION = "chef de division";
const RECEVEUR = "receveur";

const SECRET = process.env.JWT_SECRET || "change-moi-dans-le-fichier-env";
const DUREE = process.env.JWT_DUREE || "8h"; // durée d'une connexion

// Crée le jeton d'un utilisateur (appelé à la connexion)
function creerToken(utilisateur) {
  return jwt.sign({ iduser: utilisateur.iduser }, SECRET, { expiresIn: DUREE });
}

// Middleware : la requête doit avoir un jeton valide d'un compte actif.
// Si tout va bien, l'utilisateur est mis dans req.utilisateur pour la suite.
async function verifierToken(req, res, next) {
  const entete = req.headers.authorization || "";
  const jeton = entete.startsWith("Bearer ") ? entete.slice(7) : null;

  if (!jeton) {
    return res.status(401).json({ message: "Vous devez être connecté" });
  }

  let contenu;
  try {
    contenu = jwt.verify(jeton, SECRET);
  } catch {
    return res.status(401).json({ message: "Votre session a expiré, veuillez vous reconnecter" });
  }

  try {
    // On relit l'utilisateur dans la base : son rôle et son statut sont toujours à jour
    const result = await pool.query(
      "SELECT iduser, nomutilisateur, typeutilisateur, emailutilisateur, statut FROM public.usertable WHERE iduser = $1",
      [contenu.iduser]
    );
    const utilisateur = result.rows[0];

    if (!utilisateur || utilisateur.statut !== "actif") {
      return res.status(401).json({ message: "Votre compte n'est plus actif" });
    }

    req.utilisateur = utilisateur;
    next();
  } catch (err) {
    res.status(500).json({ message: "Erreur pendant la vérification de la connexion", erreur: err.message });
  }
}

// Middleware : seuls ces rôles peuvent utiliser la route
//   ex: autoriser("admin")
function autoriser(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.utilisateur.typeutilisateur)) {
      return res.status(403).json({ message: "Vous n'avez pas le droit de faire cette action" });
    }
    next();
  };
}

// Middleware : tout utilisateur connecté peut LIRE (GET),
// mais seuls ces rôles peuvent AJOUTER, MODIFIER ou SUPPRIMER
//   ex: ecriturePour("admin") sur les zones : le taxateur lit les zones, seul l'admin les change
function ecriturePour(...roles) {
  return (req, res, next) => {
    if (req.method === "GET") return next();
    return autoriser(...roles)(req, res, next);
  };
}

module.exports = {
  ADMIN,
  TAXATEUR,
  DIRECTEUR,
  CHEF_DIVISION,
  RECEVEUR,
  creerToken,
  verifierToken,
  autoriser,
  ecriturePour,
};
