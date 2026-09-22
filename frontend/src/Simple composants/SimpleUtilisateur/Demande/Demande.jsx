import React, { useState, useEffect } from "react";
import logodst from "../../../image/dst.jpg";
import Service from "../Service/Service";
import Attestation from "../Attestation/Attestation";
import Etab from "../Etab/Etab";
import Stagiaire from "../Stagiaire/Stagiaire";
import Decision from "../Decision/Decision";
import DemandeFenetre from "./DemandeFenetre/DemandeFenetre";
import Accueil from "../Accueil/Accueil";
import { UtilisateurPopup } from "./UtilisateurPopup";
import Utilisateur from "../../Admin/Utilisateur/Utilisateur";
import Admin from "../../Admin/AdminTableau/Admin";

import "./Demande.css";

const Demande = () => {
  const [titre, setTitre] = useState("Tableau de bord");
  const [nomUtilisateur, setNomUtilisateur] = useState("Utilisateur");
  const [ouvrirAdmin, setOuvrirAdmin] = useState(false);
  const [ouvrirUtilisateur, setOuvrirUtilisateur] = useState(false);

  const afficherComposant = () => {
    switch (titre) {
      case "Tableau de bord":
        return <Accueil />;
      case "Statuts des utilisateurs":
        return <Admin />;
      case "Utilisateur":
        return <Utilisateur />;
      case "Demande":
        return <DemandeFenetre />;

      case "Enregistrement de décision":
        return <Decision />;
      case "Enregistrement d'attestation":
        return <Attestation />;
      case "Stagiaire":
        return <Stagiaire />;
      case "Etablissement":
        return <Etab />;
      case "Service":
        return <Service />;
      default:
        return <Accueil />;
    }
  };

  // Fonction pour changer le titre en fonction du composant actif
  const obtenirTitre = () => {
    switch (titre) {
      case "Tableau de bord":
        return "Tableau de bord";

      case "Statuts des utilisateurs":
        return "Statuts des utilisateurs";

      case "Utilisateur":
        return "Utilisateur";

      case "Demande":
        return "Demande";

      case "Enregistrement de décision":
        return "Enregistrement de décision";
      case "Enregistrement d'attestation":
        return "Enregistrement d'attestation";
      case "Stagiaire":
        return "Stagiaire";
      case "Etablissement":
        return "Etablissement";
      case "Service":
        return "Service";
      default:
        return "Statuts des utilisateurs";
    }
  };

  useEffect(() => {
    // Récupérer les données de localStorage
    const nom = localStorage.getItem("nomUtilisateur");
    const roleUser = localStorage.getItem("roleUser");
    if (nom) {
      setNomUtilisateur(nom);
    }

    if (roleUser === "admin" || roleUser === "super utilisateur") {
      setOuvrirAdmin(true);
      setTitre("Statuts des utilisateurs");
    }
  }, []);

  return (
    <div className="demande">
      <div className="sidebar">
        <div className="titreEtImage">
          <img src={logodst} alt="logo" className="logo" />
          <div className="titreb">
            Direction des services <br /> topographiques
          </div>
        </div>

        <div className="menu">
          <ul>
            {ouvrirAdmin && (
              <div>
                <li
                  onClick={() => {
                    setTitre("Statuts des utilisateurs");
                  }}
                >
                  <div
                    className={
                      titre === "Statuts des utilisateurs" ? "active" : "menuItem admin"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      fill="currentColor"
                      class="bi bi-calendar2-range-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5m9.954 3H2.545c-.3 0-.545.224-.545.5v1c0 .276.244.5.545.5h10.91c.3 0 .545-.224.545-.5v-1c0-.276-.244-.5-.546-.5M10 7a1 1 0 0 0 0 2h5V7zm-4 4a1 1 0 0 0-1-1H1v2h4a1 1 0 0 0 1-1" />
                    </svg>
                    <span className="titreSpan">Statuts des utilisateurs</span>
                  </div>
                </li>

                <li
                  onClick={() => {
                    setTitre("Utilisateur");
                  }}
                >
                  <div
                    className={
                      titre === "Utilisateur"
                        ? "active"
                        : "menuItem utilisateur"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      fill="currentColor"
                      class="bi bi-person-fill-lock"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5v-1a2 2 0 0 1 .01-.2 4.49 4.49 0 0 1 1.534-3.693Q8.844 9.002 8 9c-5 0-6 3-6 4m7 0a1 1 0 0 1 1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm3-3a1 1 0 0 0-1 1v1h2v-1a1 1 0 0 0-1-1" />
                    </svg>
                    <span className="titreSpan">Utilisateur</span>
                  </div>
                </li>
              </div>
            )}

            <li
              onClick={() => {
                setTitre("Tableau de bord");
              }}
            >
              <div
                className={
                  titre === "Tableau de bord" ? "active" : "menuItem accueil"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-bar-chart-line-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1z" />
                </svg>

                <span className="titreSpan">Tableau de bord</span>
              </div>
            </li>

            <li
              className=""
              onClick={() => {
                setTitre("Demande");
              }}
            >
              <div
                className={
                  titre === "Demande" ? "active" : "menuItem demandeMenu"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-folder-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3m-8.322.12q.322-.119.684-.12h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981z" />
                </svg>
                <span className="titreSpan">Demande</span>
              </div>
            </li>

            <li
              onClick={() => {
                setTitre("Enregistrement de décision");
              }}
            >
              <div
                className={
                  titre === "Enregistrement de décision" ? "active" : "decision menuItem "
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-file-earmark-check-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1m1.354 4.354-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708.708" />
                </svg>
                <span className="titreSpan">Enregistrement de décision</span>
              </div>
            </li>

            <li
              onClick={() => {
                setTitre("Enregistrement d'attestation");
              }}
            >
              <div
                className={
                  titre === "Enregistrement d'attestation" ? "active" : "attestation menuItem"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-envelope-arrow-down-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zm.192 8.159 6.57-4.027L8 9.586l1.239-.757.367.225A4.49 4.49 0 0 0 8 12.5c0 .526.09 1.03.256 1.5H2a2 2 0 0 1-1.808-1.144M16 4.697v4.974A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-1.965.45l-.338-.207z" />
                  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.354-1.646a.5.5 0 0 1-.722-.016l-1.149-1.25a.5.5 0 1 1 .737-.676l.28.305V11a.5.5 0 0 1 1 0v1.793l.396-.397a.5.5 0 0 1 .708.708z" />
                </svg>
                <span className="titreSpan">Enregistrement d'attestation</span>
              </div>
            </li>

            <li
              onClick={() => {
                setTitre("Stagiaire");
              }}
            >
              <div
                className={
                  titre === "Stagiaire" ? "active" : "stagiaire menuItem "
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-person-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                </svg>
                <span className="titreSpan">Stagiaire</span>
              </div>
            </li>

            <li
              onClick={() => {
                setTitre("Etablissement");
              }}
            >
              <div
                className={
                  titre === "Etablissement"
                    ? "active"
                    : "etablissement menuItem "
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-house-door-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
                </svg>
                <span className="titreSpan">Etablissement</span>
              </div>
            </li>

            <li
              onClick={() => {
                setTitre("Service");
              }}
            >
              <div className={titre === "Service" ? "active" : " menuItem "}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="bi bi-clipboard2-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z" />
                  <path d="M3.5 1h.585A1.5 1.5 0 0 0 4 1.5V2a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 12 2v-.5q-.001-.264-.085-.5h.585A1.5 1.5 0 0 1 14 2.5v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-12A1.5 1.5 0 0 1 3.5 1" />
                </svg>
                <span className="titreSpan">Service</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="demandeBody">
        <div className="header">
          <div className="titreHeader">{obtenirTitre()}</div>

          <div className="connexion">
            <span>{nomUtilisateur}</span>
            <button
              type="button"
              className="bouttonUpDown"
              onClick={(event) => {
                event.preventDefault();

                if (ouvrirUtilisateur === true) {
                  setOuvrirUtilisateur(false);
                } else {
                  setOuvrirUtilisateur(true);
                }
              }}
            >
              {ouvrirUtilisateur === true ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-chevron-up"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-chevron-down"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={titre === "Demande" ? "demandeCorpsD" : "demandeCorps"}>
          {afficherComposant()}
        </div>
      </div>

      <div >{ouvrirUtilisateur && <UtilisateurPopup fermerPopup = {()=> {
        setOuvrirUtilisateur(false)
      }}/>}</div>
    </div>
  );
};

export default Demande;
