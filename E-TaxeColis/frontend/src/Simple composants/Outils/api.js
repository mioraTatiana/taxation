import axios from "axios";

// Adresse du serveur Express (backend/server.js).
// Si le backend tourne sur un autre ordinateur ou un autre port, changez seulement cette ligne.
export const URL_API = "http://localhost:8082";

// =====================================================================
// CONNEXION
// Au login, le backend renvoie { utilisateur, token }.
// On les garde dans le sessionStorage (effacé quand on ferme l'onglet).
// =====================================================================

const CLE_UTILISATEUR = "utilisateur";
const CLE_TOKEN = "token";

// Utilisateur connecté : { iduser, nomutilisateur, typeutilisateur, emailutilisateur, statut }
export function utilisateurConnecte() {
  try {
    if (!sessionStorage.getItem(CLE_TOKEN)) return null; // pas de jeton = pas connecté
    return JSON.parse(sessionStorage.getItem(CLE_UTILISATEUR));
  } catch {
    return null;
  }
}

export function enregistrerConnexion(utilisateur, token) {
  sessionStorage.setItem(CLE_UTILISATEUR, JSON.stringify(utilisateur));
  sessionStorage.setItem(CLE_TOKEN, token);
}

// Après "Mon profil" ou la page Statut : met à jour le nom / l'email affichés (le jeton ne change pas)
export function mettreAJourUtilisateur(utilisateur) {
  sessionStorage.setItem(CLE_UTILISATEUR, JSON.stringify(utilisateur));
}

export function deconnecter() {
  sessionStorage.removeItem(CLE_UTILISATEUR);
  sessionStorage.removeItem(CLE_TOKEN);
}

// Message d'erreur envoyé par le backend, sinon un message par défaut
export function messageErreur(erreur, messageParDefaut = "Une erreur est survenue") {
  return erreur?.response?.data?.message || messageParDefaut;
}

// =====================================================================
// INTERCEPTEURS AXIOS (s'appliquent à TOUS les axios.get / post / put / delete du projet)
// =====================================================================

// 1) Avant chaque requête : on ajoute le jeton dans l'en-tête Authorization
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(CLE_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2) Après chaque réponse : si le backend répond 401 (jeton expiré, compte désactivé),
//    on déconnecte et on retourne à la page de connexion.
//    (sauf pour la page de connexion elle-même : là, 401 = mauvais mot de passe)
axios.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const surLaConnexion = window.location.pathname === "/authentification";
    if (erreur?.response?.status === 401 && !surLaConnexion) {
      deconnecter();
      sessionStorage.setItem("messageConnexion", messageErreur(erreur, "Veuillez vous reconnecter"));
      window.location.href = "/authentification";
    }
    return Promise.reject(erreur);
  }
);
