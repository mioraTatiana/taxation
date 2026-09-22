import React, { useEffect, useState } from "react";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import SelectCom from "../../../Components/SelectCom/SelectCom";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import "./Stagiaire.css";
import Supprimer from "../../../Components/Supprimer/Supprimer";
import CustomInput from "../../../Components/InputCom/CustomInput";
import Popup from "../../../Components/popup/Popup";

import {
  vert,
  bleu,
  rouge,
  rougeFonce,
} from "../../../Components/Couleurs/couleur";
import NouveauStagiaire from "./Nouveu stagiaire/NouveauStagiaire";
import Axios from "axios";

const Stagiaire = () => {
  const [ouvrirXLS, setOuvrirXLS] = useState(false);
  const [ouvrirImprime, setOuvrirImprime] = useState(false);
  const [statusStage, setStatusStage] = useState("");
  const [idservice, setService] = useState("");
  const [recherche, setRecherche] = useState("");
  const [ouvrirSupprimer, setOuvrirSupprimer] = useState(false);
  const [ouvrirModifier, setOuvrirModifer] = useState(false);
  const [selectionneStagiaire, setSelectionneStagiaire] = useState(null);
  const [etatBouttonsSupprimer, setEtatBouttonsSupprimer] = useState({});
  const [ouvrir, setOuvrir] = useState(false);
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const [ouvrirVide, setOuvrirVide] = useState(false);

  const [stagiaires, setStagiaires] = useState([]);

  const disabledBouttonSupprimer = (idstagiaire) => {
    Axios.get(`http://localhost:8080/stagiaire/verification/${idstagiaire}`)
      .then((response) => {
        setEtatBouttonsSupprimer((prevEtat) => ({
          ...prevEtat,
          [idstagiaire]: {
            supprimerBoutton: response.status === 200,
            couleurBouttonSup: response.status === 200 ? rougeFonce : rouge,
          },
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const listerStagiaire = () => {
    Axios.get("http://localhost:8080/stagiaire/selectionnerTout")
      .then((response) => {
        console.log("Stagiaires récupérés :", response.data);
        setStagiaires(response.data);

        // Crée un état initial pour chaque stagiaire sans déclencher de requête API
        const etatInitial = {};
        response.data.forEach((stagiaire) => {
          etatInitial[stagiaire.idstagiaire] = {
            supprimerBoutton: false,
            couleurBouttonSup: rouge,
          };
        });
        setEtatBouttonsSupprimer(etatInitial);
      })
      .catch((error) => {
        console.log("Erreur de récupération des stagiaires", error);
      });
  };

  const Actualiser = () => {
    listerStagiaire();
  };

  const handleSupprimerClick = (stagiaire) => {
    setSelectionneStagiaire(stagiaire);
    setOuvrirSupprimer(true);
  };

  const handleModifierClick = (stagiaire) => {
    setSelectionneStagiaire(stagiaire);
    setOuvrirModifer(true);
  };

  const ouvrirFenetreXLS = (event) => {
    event.preventDefault();
    setOuvrirXLS(true);
  };

  const ExporterXLS = async (event) => {
    event.preventDefault();

    try {
      const response = await Axios.post(
        `http://localhost:8080/excel/download`,
        { statusStage, idservice },
        {
          responseType: "blob", // Important pour traiter le fichier binaire
        }
      );

      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "stagiaire.xlsx"); // Nom du fichier
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setOuvrirImprime(true);

      setTimeout(() => {
        setOuvrirXLS(false);
      }, 1500);
      setService("");
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier Excel:", error);

      if (error.response && error.response.status === 404) {
        setOuvrirVide(true);
        setService("");
      } else {
        setConfirmation({
          ouvrir: true,
          texte: "Erreur lors du téléchargement du fichier Excel.",
          couleur: "red",
        });
      }
    }
  };

  useEffect(() => {
    listerStagiaire();
  }, []);

  useEffect(() => {
    stagiaires.forEach((stagiaire) => {
      disabledBouttonSupprimer(stagiaire.idstagiaire);
    });
  }, [stagiaires]);

  return (
    <div className={ouvrirXLS ? "background-opaque8" : ""}>
      {confirmation.ouvrir ? (
        <div
          className="confirmation"
          style={{
            color: confirmation.couleur,
            border: `1px solid ${confirmation.couleur}`,
            textAlign: "center",
          }}
        >
          {confirmation.texte}
          <button
            type="button"
            style={{ backgroundColor: "none", border: "none" }}
            onClick={() => {
              setConfirmation({
                ouvrir: false,
                texte: "",
                couleur: "",
              });
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
          </button>
        </div>
      ) : (
        ""
      )}

      {ouvrirSupprimer && (
        <div className="supprimerFenetre">
          <Supprimer
            titre="un stagiaire"
            fonction={() => {
              Axios.delete(
                `http://localhost:8080/stagiaire/supprimer/${selectionneStagiaire.idstagiaire}`
              )
                .then((response) => {
                  console.log("Supprimer", response);
                  listerStagiaire();
                  setOuvrir(true);
                })
                .catch((error) => {
                  console.log("Error stagiaire", error);
                  setConfirmation({
                    ouvrir: true,
                    texte: "Error !",
                    couleur: "red",
                  });
                });
            }}
            lister={listerStagiaire}
            valeur={selectionneStagiaire?.idstagiaire || ""}
            fonctionAnnuler={(event) => {
              event.preventDefault();
              setOuvrirSupprimer(false);
            }}
          />
        </div>
      )}

      <div>
        <div className="BouttonXLS">
          <BouttonMS
            type="button"
            text="Exporter XLS"
            name="exporterXLS"
            onClick={ouvrirFenetreXLS}
            couleur={vert}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th >Nom</th>
              <th>Filière</th>
              <th>Diplome</th>
              <th>Niveau</th>
              <th>Email</th>
              <th >Etablissement</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {stagiaires.map((Stagiaire) => {
              return (
                <tr key={Stagiaire.idstagiaire}>
                  <td > {Stagiaire.nomstagiaire} </td>
                  <td> {Stagiaire.filiere} </td>
                  <td> {Stagiaire.diplome} </td>
                  <td> {Stagiaire.niveau} </td>
                  <td> {Stagiaire.emailstagiaire} </td>
                  <td > {Stagiaire.nometab} </td>
                  <td>
                    <button
                      type="button"
                      className="bouttonMS"
                      onClick={(event) => {
                        event.preventDefault();
                        handleModifierClick(Stagiaire);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        fill="#017371"
                        className="bi bi-pencil-square"
                        viewBox="0 0 16 16"
                      >
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                        <path
                          fillRule="evenodd"
                          d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="bouttonMS"
                      onClick={(event) => {
                        event.preventDefault();
                        handleSupprimerClick(Stagiaire);
                      }}
                      disabled={
                        etatBouttonsSupprimer[Stagiaire.idstagiaire]
                          ?.supprimerBoutton
                      }
                      style={{
                        color:
                          etatBouttonsSupprimer[Stagiaire.idstagiaire]
                            ?.couleurBouttonSup,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        fill={
                          etatBouttonsSupprimer[Stagiaire.idstagiaire]
                            ?.couleurBouttonSup
                        }
                        className="bi bi-trash"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <Popup
          ouvrirPopup={ouvrir}
          titrePopup="Bien Supprimé"
          fermerPopup={() => {
            setOuvrir(false);
          }}
        />

        <Popup
          ouvrirPopup={ouvrirVide}
          titrePopup="Liste Vide"
          fermerPopup={() => {
            setOuvrirVide(false);
          }}
        />

        <Popup
          ouvrirPopup={ouvrirImprime}
          titrePopup="Bien Imprimée"
          fermerPopup={() => {
            setOuvrirImprime(false);
          }}
        />
      </div>

      {ouvrirXLS && (
        <div className="exporterXLSdiv">
          <div className="exporterXLS">
            <div>
              <TitreFormulaire titre="Liste des stagiaires" />
            </div>

            <div className="">
              <form onSubmit={ExporterXLS}>
                <div>
                  <label htmlFor="" >Statut</label>

                  <div>
                    <input
                      type="radio"
                      name="statusStage"
                      value="actuelle"
                      onChange={(event) => {
                        setStatusStage(event.target.value);
                      }}
                    />
                    <span>Actuels</span>
                  </div>

                  <div>
                    <input
                      type="radio"
                      name="statusStage"
                      value="anciens"
                      onChange={(event) => {
                        setStatusStage(event.target.value);
                      }}
                    />
                    <span>Anciens</span>
                  </div>

                  <div>
                    <div>
                      <input
                        type="radio"
                        name="statusStage"
                        value="tous"
                        onChange={(event) => {
                          setStatusStage(event.target.value);
                        }}
                      />
                      <span>Tous les stagiaires</span>
                    </div>
                  </div>
                </div>

                <SelectCom
                  label="Service"
                  name="idservice"
                  value={idservice}
                  onChange={(event) => {
                    event.preventDefault();
                    setService(event.target.value);
                  }}
                />

                <BouttonMS
                  type="submit"
                  text="Exporter en XLS"
                  name="exporterBoutton"
                  couleur="#017371"
                  disabled={statusStage === ""}
                />

                <BouttonMS
                  type="button"
                  text="Fermer"
                  name="fermerExporteXLS"
                  couleur={bleu}
                  onClick={(event) => {
                    event.preventDefault();
                    setOuvrirXLS(false);
                  }}
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {ouvrirModifier && (
        <div className="containerNouveauS">
          <NouveauStagiaire
            titreFormulaireStagiaire="Modifier un stagiaire"
            textButton="Modifier"
            couleurButton={vert}
            id={selectionneStagiaire.idstagiaire}
            nom={selectionneStagiaire.nomstagiaire || ""}
            email={selectionneStagiaire.emailstagiaire || ""}
            tel={selectionneStagiaire.telstagiaire || ""}
            etab={selectionneStagiaire.idetab}
            sexestagiaire={selectionneStagiaire.sexe}
            niveaustagiaire={selectionneStagiaire.niveau}
            diplomestagiaire={selectionneStagiaire.diplome}
            filierestagiaire={selectionneStagiaire.filiere || ""}
            fonction={() => {
              setOuvrirModifer(false);
            }}
            lister={listerStagiaire}
            confirmation={(event) => {
              event.preventDefault();
              setConfirmation({
                ouvrir: true,
                texte: "Modifié !",
                couleur: "green",
              });
            }}
          />
        </div>
      )}

      <div className="rechercheStagiaire">
        <CustomInput
          type="text"
          value={recherche}
          label="Recherche un stagiaire"
          onChange={(event) => {
            setRecherche(event.target.value);

            Axios.post(`http://localhost:8080/stagiaire/recherche/${recherche}`)
              .then((response) => {
                console.log("Recherche", recherche);
                setStagiaires(response.data);
              })
              .catch((error) => {
                console.error(error);
              });
          }}
          name="nameInput"
          placeholder="nom ou établissement"
        />

        <BouttonMS
          type="button"
          text="Actualiser"
          name="actualiser"
          onClick={Actualiser}
          couleur={bleu}
        />
      </div>
    </div>
  );
};

export default Stagiaire;
