import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Login.css";

import InputCom from "../../../Simple composants/Input/Input";
import Fcelogo from "../../../Image/logo.png";
import { URL_API, messageErreur, enregistrerConnexion } from "../../../Simple composants/Outils/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);

  // Message laissé quand la session a expiré (voir api.js)
  useEffect(() => {
    const message = sessionStorage.getItem("messageConnexion");
    if (message) {
      toast.error(message);
      sessionStorage.removeItem("messageConnexion");
    }
  }, []);

  // Le backend vérifie l'email, le mot de passe et que le compte est "actif"
  const handleConnexion = async (e) => {
    e.preventDefault();
    if (enCours) return;

    if (email.trim() === "" || motDePasse === "") {
      toast.error("Saisissez votre e-mail et votre mot de passe");
      return;
    }

    setEnCours(true);
    try {
      const reponse = await axios.post(`${URL_API}/user/authentification`, {
        emailutilisateur: email.trim(),
        motpasse: motDePasse,
      });

      // Réponse : { utilisateur: {...}, token: "..." }
      // Le jeton sera envoyé automatiquement à chaque requête (voir api.js)
      const { utilisateur, token } = reponse.data;
      enregistrerConnexion(utilisateur, token);
      toast.success(`Bienvenue ${utilisateur.nomutilisateur}`);
      navigate("/"); // le Layout ouvre le 1er menu du rôle
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Connexion impossible : le serveur ne répond pas"));
    }
    setEnCours(false);
  };

  return (
    <div className="connexionPage">
      <div className="connexionBox">
        {/* Logo */}
        <div className="logoBox">
          <img src={Fcelogo} alt="Logo FCE" id="logo" />
        </div>

        {/* Titre */}
        <div className="titreConnexion">
          <h4>Bienvenue sur E-TaxeColis </h4>
          <p>Connectez-vous !</p>
        </div>

        {/* Formulaire */}
        <form className="formConnexion" onSubmit={handleConnexion}>
          <div className="formInput">
            <InputCom
              type="email"
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
            />

            <InputCom
              type="password"
              label="Mot de passe"
              name="motDePasse"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder=""
            />
          </div>

          {/* Bouton + inscription */}
          <div className="connexionActions">
            <button type="submit" className="btnConnexion" disabled={enCours}>
              {enCours ? "Connexion..." : "Connexion"}
            </button>

            <Link to="/inscription" className="inscriptionLink">
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
