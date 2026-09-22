import React, { useState, useEffect } from "react";
import Axios from "axios";

import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import Boutton from "../../../Components/boutton/Boutton";
import CustomInput from "../../../Components/InputCom/CustomInput";
import "./Service.css";
import Supprimer from "../../../Components/Supprimer/Supprimer";
import Popup from "../../../Components/popup/Popup";
import {
  bleu,
  rouge,
  rougeFonce,
} from "../../../Components/Couleurs/couleur";

const Service = () => {
  const [popImprimer, setPopImprimer] = useState(false);
  const [ouvrirAjouter, setOuvrirAjouter] = useState(false);
  const [ouvrirModifier, setOuvrirModifier] = useState(false);
  const [ouvrirSupprimer, setOuvrirSupprimer] = useState(false);
  const [selectionneeService, setSelectionneService] = useState(false);
  const [etatBouttonsSupprimer, setEtatBouttonsSupprimer] = useState({});
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const [ServiceDatas, setServiceDatas] = useState([]);

  const bouttonModifier = (service) => {
    setOuvrirModifier(true);
    setSelectionneService(service);
  };

  const bouttonSupprimer = (service) => {
    setOuvrirSupprimer(true);
    setSelectionneService(service);
  };

  const listerService = () => {
    Axios.get("http://localhost:8080/service/selectionnerTout")
      .then((response) => {
        console.log(response.data); 
        setServiceDatas(response.data);
        const etatInitial = {};
        response.data.forEach((service) => {
          etatInitial[service.idservice] = {
            supprimerBoutton: false,
            couleurBouttonSup: rouge,
          };
          disabledBouttonSupprimer(service.idservice);
        });
        setEtatBouttonsSupprimer(etatInitial);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des services", error);
      });
  };

  const ServiceFormulaire = ({
    titreFormulaireService,
    textBoutton,
    couleurBoutton,
    idtservice,
    nomDuService,
    nomAgent,
  }) => {
    const [service, setService] = useState({
      idservice: idtservice || "",
      nomservice: nomDuService || "",
      agentvalideur: nomAgent || "",
    });

    const isFormValid =
      service.nomservice !== "" && service.agentvalideur !== "";

    const CreateUpdateService = (event) => {
      event.preventDefault();

      if (isFormValid && titreFormulaireService === "Ajouter un service") {
        console.log(service);

        setConfirmation({
          ouvrir: true,
          texte: "Ajout en cours ...",
          couleur: "black",
        });

        Axios.post("http://localhost:8080/service/ajouter", service)
          .then((response) => {
            setService({ nomservice: "", agentvalideur: "" });
            console.log("AJOUTE/:", response);

            // Cache le message de confirmation après 5 secondes
            listerService();

           
              setConfirmation({
                ouvrir: true,
                texte: "Ajouté !",
                couleur: "green",
              });
           



           
              setOuvrirAjouter(false);
          

            
            
          })
          .catch((error) => {
            console.error("Erreur lors de l'ajout du service", error);

           

            
          
              setConfirmation({
                ouvrir: true,
                texte: "Erreur !",
                couleur: "red",
              });
           
              setOuvrirAjouter(false);
          });
      } else if (
        isFormValid &&
        titreFormulaireService === "Modifier un service"
      ) {
        Axios.put(
          `http://localhost:8080/service/modifier/${selectionneeService.idservice}`,
          service
        )
          .then((response) => {
            setService({ nomservice: "", agentvalideur: "" });

            console.log("Modifier:", response);

            listerService();

            
              setConfirmation({
                ouvrir: true,
                texte: "Modifié !",
                couleur:'green'
              });
           

              setOuvrirModifier(false);
           
          })
          .catch((error) => {
            alert("Erreur", error);

            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });
         

            console.error("Erreur lors de l'ajout du service", error);

            setOuvrirModifier(false);
          });

      } else {
        alert("Veuillez remplir le formulaire");
      }
    };

    const handleChange = (event) => {
      event.preventDefault();
      setService({
        ...service,
        [event.target.name]: event.target.value,
      });
    };

    return (
      <div className="backFormulaire">
        <div className="ServiceFormulaireCoprs">
          <TitreFormulaire titre={titreFormulaireService} />
          <form onSubmit={CreateUpdateService}>
            <div>
              <CustomInput
                type="text"
                label="Nom du service"
                value={service.nomservice}
                onChange={handleChange}
                name="nomservice"
              />

              <CustomInput
                type="text"
                label="Nom de l'agent valideur"
                value={service.agentvalideur}
                onChange={handleChange}
                name="agentvalideur"
              />

              <BouttonMS
                type="submit"
                text={textBoutton}
                name={textBoutton}
                couleur={couleurBoutton}
                disabled={!isFormValid}
              />

              <BouttonMS
                type="text"
                text="Fermer"
                name="annulerBoutton"
                onClick={(event) => {
                  event.preventDefault();
                  if (titreFormulaireService === "Ajouter un service") {
                    setOuvrirAjouter(false);
                  } else {
                    setOuvrirModifier(false);
                  }
                }}
                couleur={bleu}
              />
            </div>
          </form>
        </div>
      </div>
    );
  };

  const disabledBouttonSupprimer = (service) => {
    Axios.get(`http://localhost:8080/service/verification/${service}`)
      .then((response) => {
        setEtatBouttonsSupprimer((prevEtat) => ({
          ...prevEtat,
          [service]: {
            supprimerBoutton: response.status === 200,
            couleurBouttonSup: response.status === 200 ? rougeFonce : rouge,
          },
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    listerService();
  }, []);

  return (
    <div className="ServiceContainer">
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
          <button type="button"
          style={{backgroundColor: 'none', border : 'none'}}
           onClick={() => {
            setConfirmation({
              ouvrir: false,
              texte: '',
              couleur: ''
            });
          }}>
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

      <div>
        {ouvrirAjouter && (
          <ServiceFormulaire
            titreFormulaireService="Ajouter un service"
            textBoutton="Ajouter"
            couleurBoutton="#0E87CC"
            idtservice=""
            nomDuService=""
            nomAgent=""
          />
        )}

        {ouvrirModifier && (
          <ServiceFormulaire
            titreFormulaireService="Modifier un service"
            textBoutton="Modifier"
            couleurBoutton="#017371"
            idtservice={selectionneeService.idservice}
            nomDuService={selectionneeService.nomservice}
            nomAgent={selectionneeService.agentvalideur}
          />
        )}

        {ouvrirSupprimer && (
          <div className="supprimerService">
            <Supprimer
              titre=" un service"
              valeur={selectionneeService.idservice}
              fonction={() => {
                Axios.delete(
                  `http://localhost:8080/service/supprimer/${selectionneeService.idservice}`
                )
                  .then((response) => {
                    console.log(response.data);
                     // Vérifie que les données sont bien reçues
                    listerService();

                    setConfirmation({
                      ouvrir: true,
                      texte: "Supprimé !",
                      couleur:'green',
                    });
      
                  })
                  .catch((error) => {
                    console.error(
                      "Erreur lors de la récupération des services",
                      error);
                      listerService();

                      setConfirmation({
                        ouvrir: true,
                        texte: "Erreur !",
                        couleur: "red",
                      });
                   
          
      
                  });
              }}
              lister={listerService}
              fonctionAnnuler={(event) => {
                event.preventDefault();
                setOuvrirSupprimer(false);
              }}
            />
          </div>
        )}

        <Popup
          ouvrirPopup={popImprimer}
          titrePopup="Bien imprimée!"
          fermerPopup={(event) => {
            event.preventDefault();
            setPopImprimer(false);
          }}
        />
      </div>

      <div className="TableService">
        <div>
          <Boutton
            type="button"
            text="Nouveau service"
            name="ServiceNouvelle"
            onClick={(event) => {
              event.preventDefault();
              setOuvrirAjouter(true);
            }}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Identifiant</th>
              <th>Nom du service</th>
              <th>Nom de l'agent valideur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ServiceDatas.length > 0 ? (
              ServiceDatas.map((serviceData) => (
                <tr key={serviceData?.idservice || serviceData.nomservice}>
                  <td>{serviceData?.idservice || "N/A"}</td>
                  <td>{serviceData?.nomservice || "Nom non disponible"}</td>
                  <td>
                    {serviceData?.agentvalideur || "Agent non disponible"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bouttonservice"
                      onClick={(event) => {
                        event.preventDefault();
                        bouttonModifier(serviceData);
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
                      className="bouttonservice"
                      onClick={(event) => {
                        event.preventDefault();
                        bouttonSupprimer(serviceData);
                      }}
                      disabled={
                        etatBouttonsSupprimer[serviceData.idservice]
                          ?.supprimerBoutton
                      }
                      style={{
                        color:
                          etatBouttonsSupprimer[serviceData.idservice]
                            ?.couleurBouttonSup,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        fill={
                          etatBouttonsSupprimer[serviceData.idservice]
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
              ))
            ) : (
              <tr>
                <td colSpan="4">Aucun service trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Service;
