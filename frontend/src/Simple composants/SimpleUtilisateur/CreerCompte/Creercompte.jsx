import React, { useState } from "react";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import CustomInput from "../../../Components/InputCom/CustomInput";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import "./Creercompte.css";
import { Link, useNavigate } from "react-router-dom";
import { bleu } from "../../../Components/Couleurs/couleur";
import Axios from "axios";
import Popup from "../../../Components/popup/Popup";

const Creercompte = ({ statusUser, roleUser, fermerFenetre }) => {
  const [ouvrirNotif, setOuvrirNotif] = useState(false);
  const [nomuser, setNomuser] = useState("");
  const [email, setEmail] = useState("");
  const [motpasse, setMotpasse] = useState("");
  const [titre, setTitre] = useState("");
  const [login, setLogin] = useState("");
  const navigate = useNavigate();

  const isFormValid =
    nomuser !== "" && email !== "" && motpasse !== "" && login !== "";

  const [passwordView, setPasswordView] = useState("password");

  const AfficherMotPasse = () => {
    setPasswordView(passwordView === "password" ? "text" : "password");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Axios.get(`http://localhost:8080/userapp/ajouter/verifiction/${login}`)
    .then((response) => {
      console.log(response)
      setOuvrirNotif(true)
      setTitre("Le nom d'utilisateur que vous avez saisi \n existe déja \n Veuillez le changer ")
      setLogin('')
    })
    .catch((error) => {
      console.log(error)
       if (error.response && error.response.status === 404) {
        Axios.post("http://localhost:8080/userapp/ajouter", {
          nomuser,
          email,
          motpasse,
          status: statusUser,
          role: roleUser,
          login
        })
          .then((response) => {
            console.log(response);
            if (response.data && response.data.length > 0) {
              const roleUser = response.data[0].role;
    
              if (roleUser === "simple utilisateur") {
                setTitre(
                  "L'admin vous enverrez un mail pour confirmer l' activation /n Compte bien ajouté"
                );
                setOuvrirNotif(true);
                setTimeout(() => {
                  navigate("/");
                }, 4000);
              } else {
                setTitre(" Compte bien ajouté");
                setOuvrirNotif(true);
              }
            } else {
              console.error("Le tableau est vide ou n'est pas un tableau");
            }
          })
    
          .catch((error) => {
            console.error(error);
            setOuvrirNotif(true)
            setTitre('Il y a une erreur')
          });
  
       }
    })
    }
      
    


   
 

  return (
    <div className="Creercompte">
      <Popup
        ouvrirPopup={ouvrirNotif}
        titrePopup={titre}
        fermerPopup={(event) => {
          event.preventDefault();
          setOuvrirNotif(false);
        }}
      />

      <div className="headerCreer">
        {roleUser === "admin" ? (
          <button
            type="button"
            className="bouttonRetour"
            onClick={fermerFenetre}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              fill={bleu}
              className="bi bi-x-circle-fill"
              viewBox="0 0 16 16"
            >
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
            </svg>
          </button>
        ) : (
          <Link to="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              fill="rgb(0, 162, 255)"
              className="bi bi-arrow-left-circle-fill"
              viewBox="0 0 16 16"
            >
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z" />
            </svg>
          </Link>
        )}
      </div>

      <TitreFormulaire titre="Créer un compte" />
      <form onSubmit={handleSubmit}>
        <div className="formCreer">
          <CustomInput
            type="text"
            label="Noms complets"
            value={nomuser}
            onChange={(event) => {
              setNomuser(event.target.value);
              console.log("Nom", nomuser);
            }}
            name="nomuser"
          />

          <CustomInput
            type="text"
            label="Nom d'utilisateur"
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              console.log("Nom",login);
            }}
            name="login"
            placeholder={'Eviter les espaces à la fin'}
          />

          <CustomInput
            type="text"
            label="Email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              console.log("Email", email);
            }}
            name="email"
          />

          <CustomInput
            type={passwordView}
            label="Mot de passe"
            value={motpasse}
            onChange={(event) => {
              setMotpasse(event.target.value);
              console.log("mot de passe", motpasse);
            }}
            name="motpasse"
          />

          <div className="CheckPass">
            <input type="checkbox" onClick={AfficherMotPasse} />
            <span className="PasswordView">Afficher le mot de passe</span>
          </div>

          <BouttonMS
            type="submit"
            text="Ajouter"
            name="Creercomptebutton"
            couleur={bleu}
            disabled={!isFormValid}
          />
        </div>
      </form>
    </div>
  );
};

export default Creercompte;
