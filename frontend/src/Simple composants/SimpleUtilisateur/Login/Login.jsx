import React, { useState } from "react";
import Axios from "axios";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import CustomInput from "../../../Components/InputCom/CustomInput";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import logodst from "../../../image/dst.jpg";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { bleu } from "../../../Components/Couleurs/couleur";

const Login = () => {
  const [login, setLogin] = useState("");
  const [motpasse, setMotPasse] = useState("");
  const  [erreur, setErreur] = useState(false);

  const navigate = useNavigate();

  const [passwordView, setPasswordView] = useState("password");

  const AfficherMotPasse = () => {
    setPasswordView(passwordView === "password" ? "text" : "password");
  };

const FormValid = motpasse !== '' && login !==''

  const handleSubmit = (event) => {
    event.preventDefault();

    Axios.post("http://localhost:8080/userapp/login", { login, motpasse })
    .then((response) => {
      // Cette partie ne s'exécute que pour les réponses 2xx
      console.log(response);
      const nomUser = response.data[0].nomuser;
      const roleUser = response.data[0].role;
      const idUser = response.data[0].iduser
  
      console.log(nomUser, "et ", roleUser, "et ", idUser);
      localStorage.setItem("nomUtilisateur", nomUser);
      localStorage.setItem("roleUser", roleUser);
      localStorage.setItem("idUser", idUser)
  
      navigate("/demande"); // Naviguer vers la page Demande
    })
    .catch((error) => {
      setLogin('')
      setMotPasse("")
      // Gérer les erreurs ici
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui sort du domaine de 2xx
        console.error("Erreur:", error.response.status);
        if (error.response.status === 404) {
          setErreur(true);
           // Vous pouvez gérer l'erreur 404 ici
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Aucune réponse reçue:", error.request);
      } else {
        // Quelque chose s'est produit lors de la configuration de la requête
        console.error("Erreur", error.message);
      }
    });
    };

  return (
    <div>
      {erreur && (
              <div className="erreur">
              <div className="titreErreur">Vos informations sont incorrectes !</div>
              <div>
                <button type="button" className="bouttonErreur" onClick={() => {
                  setErreur(false);
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="rgba(0, 0, 0, 0.6)"
                  className="bi bi-x-lg"
                  viewBox="0 0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>

                </button>
              </div>
            </div>
      
      )}
      <div className="Login">
        <div className="titrediv">
          <TitreFormulaire titre="Identifiez-vous !" />
          <img src={logodst} alt="logo" className="logo" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="formulaireLogin">
            <CustomInput
              type="text"
              label="Nom d'utilisateur"
              value={login}
              onChange={(event) => {
                setLogin(event.target.value);
                console.log(login);
              }}
              name="login"
              placeholder={'Eviter les espaces à la fin'}
            />

            <CustomInput
              type={passwordView}
              label="Mot de passe"
              value={motpasse}
              onChange={(event) => {
                setMotPasse(event.target.value);
                console.log(motpasse);
              }}
              name="motpasse"
            />

            <div className="CheckPass">
              <input type="checkbox" onClick={AfficherMotPasse} />
              <span className="PasswordView">Afficher le mot de passe</span>
            </div>
          </div>

          <div>
            <BouttonMS type="submit" text="Se connecter" name="seconnecter" couleur={bleu} disabled={!FormValid}/>
          </div>
        </form>

        <div className="linkCreer">
          <Link to="/creercompte" className="linkC">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
