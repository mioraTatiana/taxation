import React, { useState } from "react";
import "./Login.css";

import InputCom from "../../../Simple composants/Input/Input";
import Fcelogo from "../../../Image/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const handleConnexion = (e) => {
    e.preventDefault();

    console.log("Email :", email);
    console.log("Mot de passe :", motDePasse);
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
          {/* Mot de passe oublié */}
          <div className="motPasseOublie">
            <a href="#">Mot de passe oublié ?</a>
          </div>

          {/* Bouton + inscription */}
          <div className="connexionActions">
            <button type="submit" className="btnConnexion">
              Connexion
            </button>

            <a href="#" className="inscriptionLink">
              S'inscrire
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
