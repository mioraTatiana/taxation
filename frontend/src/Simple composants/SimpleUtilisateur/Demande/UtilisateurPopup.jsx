import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./Demande.css";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import { bleu, rouge, vert } from "../../../Components/Couleurs/couleur";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import CustomInput from "../../../Components/InputCom/CustomInput";
import { useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup/Popup";

export const UtilisateurPopup = ({ fermerPopup }) => {
  const [titre, setTitre] = useState("");
  const [ouvrirNotif, setOuvrirNotif] = useState(false);

  const [email, setEmail] = React.useState("");
  const [motpasse, setMotPasse] = React.useState("");
  const [nomuser, setNomuser] = React.useState("");
  const [login, setLogin] = useState("");
  const [ouvrirProfil, setOuvrirProfil] = React.useState(false);
  const [ouvrirSupprimer, setOuvrirSupprimer] = React.useState(false);
  const [passwordView, setPasswordView] = React.useState("password");
  const [ouvrirPopup, setOuvrirPop] = useState(false);
  const [openUser, setOpenUser] = useState(true);

  const AfficherMotPasse = () => {
    setPasswordView(passwordView === "password" ? "text" : "password");
  };

  const navigate = useNavigate();

  const listerUser = () => {
    Axios.get(`http://localhost:8080/userapp/selectionner/${iduser}`)
      .then((response) => {
        console.log(response);
        setNomuser(response.data[0].nomuser);
        setEmail(response.data[0].email);
        setMotPasse(response.data[0].motpasse);
        setLogin(response.data[0].login);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const modifierUser = () => {
    Axios.get(`http://localhost:8080/userapp/ajouter/verifiction/${login}`)
      .then((response) => {
        console.log(response);
        setOuvrirNotif(true);
        setTitre(
          "Le nom d'utilisateur que vous avez saisi\n existe déja.\n Veuillez le changer "
        );
        setLogin("");
      })
      .catch((error) => {
        console.log(error);
        if (error.response && error.response.status === 404) {
          Axios.put(`http://localhost:8080/userapp/modifier/${iduser}`, {
            email,
            nomuser,
            motpasse,
            login,
          })
            .then((response) => {
              console.log(response);
              
              setNomuser(response.data[0].nomuser);
              setEmail(response.data[0].email);
              setMotPasse(response.data[0].motpasse);
              setLogin(response.data[0].login);
              listerUser();
              setOuvrirPop(true);

              setTimeout(() => {
                setOuvrirProfil(false);
              }, 1500);
              setTimeout(() => {
                fermerPopup();    
              }, 1500);
            })
            .catch((error) => {
              setOuvrirProfil(false);
              console.error(error);
              listerUser();
            });
        }
      });
  };

  const supprimerUser = () => {
    Axios.delete(`http://localhost:8080/userapp/supprimer/${iduser}`)
      .then((response) => {
        console.log(response);

        localStorage.setItem("nomUtilisateur", "");
        localStorage.setItem("roleUser", "");
        localStorage.setItem("idUser", "");

        navigate("/");
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const iduser = localStorage.getItem("idUser");
  const nom = localStorage.getItem("nomUtilisateur");
  const [roleUser, setRoleUser] = useState("role");

  const roleSignification = () => {
    if (localStorage.getItem("roleUser") === "admin") {
      setRoleUser("Administateur");
    } else if (localStorage.getItem("roleUser") === "super utilisateur") {
      setRoleUser("Super utilisateur");
    } else {
      setRoleUser("Simple utilisateur");
    }
  };
  useEffect(() => {
    roleSignification();
  });

  return (
    <div className="utilisateurBe">
      {openUser && (
        <div className="fenetreUtilisateur">
          <div className="imageEtnom">
            <div>{nom}</div>
            <div className="bouttonFerme">
              <button
                type="button"
                className="buttonFermer"
                onClick={() => {
                  fermerPopup();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="white"
                  className="bi bi-x"
                  viewBox="0 0 16 16"
                >
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </div>
          </div>
          <div className="role">{roleUser}</div>

          <div>
            <BouttonMS
              type="button"
              text="Profil"
              name="profil"
              couleur={vert}
              onClick={() => {
                setOpenUser(false);
                setOuvrirProfil(true);
                listerUser();
              }}
            />

            <BouttonMS
              type="button"
              text="Deconnexion"
              name="deconnexion"
              couleur={bleu}
              onClick={() => {
                localStorage.setItem("nomUtilisateur", "");
                localStorage.setItem("roleUser", "");
                localStorage.setItem("idUser", "");

                navigate("/"); // Naviguer vers la page Demande
              }}
            />
          </div>
        </div>
      )}

      {ouvrirProfil && (
        <div className="backFormulaire">
          <div className="profil">
            <div className="bouttonFerme">
              <button
                type="button"
                className="bouttonErreur"
                onClick={() => {
                  setOuvrirProfil(false);
                  fermerPopup();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="white"
                  className="bi bi-x-lg"
                  viewBox="0 0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </button>
            </div>

            <div>
              <TitreFormulaire titre="Profil" />
            </div>
            <CustomInput
              type="text"
              label="Noms"
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
                console.log(email);
              }}
              name="login"
            />

            <CustomInput
              type="email"
              label="Email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                console.log(email);
              }}
              name="email"
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

            <div>
              <div className="CheckPass">
                <input type="checkbox" onClick={AfficherMotPasse} />
                <span className="PasswordView">Afficher le mot de passe</span>
              </div>
            </div>

            <div>
              <BouttonMS
                type="button"
                text="Modifier"
                name="modifier"
                couleur={vert}
                onClick={(event) => {
                  event.preventDefault();
                  modifierUser();
                }}
              />

              <BouttonMS
                type="button"
                text="Supprimer"
                name="supprimer"
                couleur={rouge}
                onClick={(event) => {
                  event.preventDefault();
                  setOuvrirProfil(false);
                  setOuvrirSupprimer(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {ouvrirSupprimer && (
        <div className="backFormulaire">
          <div className="supprimer">
            <div>
              <TitreFormulaire titre="Voulez vous vraiment supprimer ce compte ? " />
            </div>

            <div className="confirmationBoutton">
              <BouttonMS
                type="button"
                text="Fermer"
                name="Annuler"
                couleur={bleu}
                onClick={(event) => {
                  event.preventDefault();
                  setOuvrirSupprimer(false);
                  fermerPopup();
                }}
              />

              <BouttonMS
                type="button"
                text="Supprimer"
                name="supprimer"
                couleur={rouge}
                onClick={(event) => {
                  event.preventDefault();
                  supprimerUser();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Popup
        ouvrirPopup={ouvrirPopup}
        titrePopup="Bien modifié"
        fermerPopup={(event) => {
          event.preventDefault();
          setOuvrirPop(false);
        }}
      />
      <Popup
        ouvrirPopup={ouvrirNotif}
        titrePopup={titre}
        fermerPopup={(event) => {
          event.preventDefault();
          setOuvrirNotif(false);
        }}
      />
    </div>
  );
};
