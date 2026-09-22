import React, { useEffect, useState } from "react";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import Supprimer from "../../../Components/Supprimer/Supprimer";
import DemandePage from "../Demande/NouveauDemande/DemandePage";
import Popup from "../../../Components/popup/Popup";
import "./DemandeTable.css";
import Axios from "axios";
import { bleu, rouge, rougeFonce } from "../../../Components/Couleurs/couleur";

const DemandeTable = () => {
  const [ouvrirSupprimer, setOuvrirSupprimer] = useState(false);
  const [ouvrirModifier, setOuvrirModifier] = useState(false);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState(null);
  const [ouvrirAjouter, setOuvrirAjouter] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [ouvrir, setOuvrir] = useState(false);
  const [titre, setTitre] = useState("");
  const [etatBouttonsSupprimerDemande, setEtatBouttonsSupprimerDemande] =
    useState({});
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const [demande, setDemande] = useState({
    stagiaire: "",
    service: "",
    motifdemande: "",
    dureedemande: "",
    datededemande: "",
    piecedemande: "",
    datedebut: "",
    poste: "",
  });

  const disabledBouttonSupprimerDemande = (stagiaire) => {
    Axios.get(`http://localhost:8080/demande/verificationDemande/${stagiaire}`)
      .then((response) => {
        console.log(response);
        setEtatBouttonsSupprimerDemande((prevEtat) => ({
          ...prevEtat,
          [stagiaire]: {
            supprimerBoutton: response.status === 200,
            couleurBouttonSup: response.status === 200 ? rougeFonce : rouge,
          },
        }));
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
        } else {
          console.log(error);
        }
      });
  };

  const handleModifierClick = (demande) => {
    setDemandeSelectionnee(demande);
    setOuvrirModifier(true);
  };

  const handleSupprimerClick = (demande) => {
    setDemandeSelectionnee(demande);
    setOuvrirSupprimer(true);
  };

  const ImprimerDecision = async (demande) => {
   
    try {
      const response = await Axios.get(
        ` http://localhost:8080/pdf/decision/${demande}`,

        {
          responseType: "blob",
        }
      );

      // Create a URL for the blob and initiate download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "decision.pdf"); // Set the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update UI states
      setOuvrir(true);
      setTitre("Bien Imprimée");

      // Close PDF viewer after 2 seconds
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier PDF:", error);
      setConfirmation({
        ouvrir: true,
        texte: "Erreur !",
        couleur: "red",
      });
    }
  };

  const listerDemande = () => {
    Axios.get("http://localhost:8080/demande/selectionnerTout")
      .then((response) => {
        console.log(response);
        setDemandes(response.data);

        // Crée un état initial pour chaque demande sans déclencher de requête API
        const etatInitial = {};
        response.data.forEach((demande) => {
          etatInitial[demande.idstagiaire] = {
            supprimerBoutton: false,
            couleurBouttonSup: rouge,
          };
        });
        setEtatBouttonsSupprimerDemande(etatInitial);
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  useEffect(() => {
    listerDemande();
  }, []);

  useEffect(() => {
    demandes.forEach((demande) => {
      disabledBouttonSupprimerDemande(demande.idstagiaire);
    });
  }, [demandes]);

  return (
    <div className={"demandeTable"}>
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

      <div>
        {ouvrirSupprimer && (
          <Supprimer
            modalOuvert={ouvrirSupprimer}
            titre=" une demande"
            fonction={() => {
              Axios.delete(
                "http://localhost:8080/demande/supprimer/" +
                  demandeSelectionnee.iddemande
              )
                .then((response) => {
                  console.log(response);
                  setDemandes(response.data);
                  setOuvrir(true);
                  setTitre("Bien Supprimée");

                  listerDemande();

                  setOuvrirSupprimer(false);
                })
                .catch((error) => {
                  console.log(error);
                  setConfirmation({
                    ouvrir: true,
                    texte: "Erreur !",
                    couleur: "red",
                  });
                  listerDemande();
                });
            }}
            lister={listerDemande}
            valeur={demandeSelectionnee?.iddemande || ""}
            fonctionAnnuler={(event) => {
              event.preventDefault();
              setOuvrirSupprimer(false);
            }}
          />
        )}

        {ouvrirAjouter && (
          <div className="backFormulaire">
            <DemandePage
              titreDemande="Ajouter une demande"
              textBoutton="Ajouter"
              nameBoutton="demandeAjout"
              couleurBoutton={bleu}
              numPage=""
              demandeid=""
              stagiaire={demande.stagiaire}
              service={demande.service}
              motifdemande={demande.motifdemande}
              dureedemande={demande.dureedemande}
              datededemande={demande.datededemande}
              piecedemande={demande.piecedemande}
              datededebut={demande.datedebut}
              posteStagiaire={demande.poste}
              fonctionAnnuler={(event) => {
                event.preventDefault();
                setOuvrirAjouter(false);

                setDemande({
                  stagiaire: "",
                  service: "",
                  motifdemande: "",
                  dureedemande: "",
                  datededemande: "",
                  piecedemande: "",
                  datedebut: "",
                  poste: "",
                });
              }}
            />
          </div>
        )}

        {ouvrirModifier && (
          <div className="backFormulaire">
            <DemandePage
              titreDemande="Modifier une demande"
              textBoutton="Modifier"
              nameBoutton="ModifierDemande"
              couleurBoutton="#017371"
              fonctionAnnuler={() => {
                setOuvrirModifier(false);
              }}
              demandeid={demandeSelectionnee?.iddemande || ""}
              stagiaire={demandeSelectionnee?.idstagiaire || ""}
              service={demandeSelectionnee?.idservice || ""}
              motifdemande={demandeSelectionnee?.motif || ""}
              dureedemande={demandeSelectionnee?.duree || ""}
              datededemande={
                new Date(demandeSelectionnee?.datedemande)
                  .toISOString()
                  .split("T")[0] || ""
              }
              piecedemande={demandeSelectionnee?.piece || ""}
              datededebut={
                new Date(demandeSelectionnee?.datedebut)
                  .toISOString()
                  .split("T")[0] || ""
              }
              posteStagiaire={demandeSelectionnee.poste}
              lister={() => {
                listerDemande();
              }}
            />
          </div>
        )}

        <Popup
          ouvrirPopup={ouvrir}
          titrePopup={titre}
          fermerPopup={(event) => {
            event.preventDefault();
            setOuvrir(false);
          }}
        />
      </div>
      <div className="demanderecherche">
        <BouttonMS
          type="button"
          text="Nouvelle demande"
          name="nouveauDemande"
          onClick={(event) => {
            event.preventDefault();
            setOuvrirAjouter(true);
          }}
          couleur={bleu}
        />
      </div>

      <div className="table_responsive">
        <table>
          <thead>
            <tr>
              <th>Stagiaire</th>
              <th>Service</th>
              <th>Date de demande</th>
              <th>Poste</th>
              <th>Date de debut</th>
              <th>Date de fin</th>
              <th>Durée</th>
              <th>Pièces</th>
              <th>Actions</th>
              <th>Projet décision</th>
            </tr>
          </thead>

          <tbody>
            {demandes.length > 0 ? (
              demandes.map((demande) => {
                const date = new Date(demande.datedemande);
                const day = date.getUTCDate().toString().padStart(2, "0");
                const month = (date.getUTCMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const year = date.getUTCFullYear();

                const dateFormated = `${day}/${month}/${year}`;

                const date2 = new Date(demande.datedebut);
                const day2 = date2.getUTCDate().toString().padStart(2, "0");
                const month2 = (date2.getUTCMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const year2 = date2.getUTCFullYear();

                const dateFormated2 = `${day2}/${month2}/${year2}`;

                const date3 = new Date(demande.datefin);
                const day3 = date3.getUTCDate().toString().padStart(2, "0");
                const month3 = (date3.getUTCMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const year3 = date3.getUTCFullYear();

                const dateFormated3 = `${day3}/${month3}/${year3}`;

                return (
                  <tr key={demande.iddemande}>
                    <td className="line">{demande.nomstagiaire}</td>
                    <td className="line"> {demande.nomservice} </td>
                    <td> {dateFormated} </td>
                    <td> {demande.poste} </td>
                    <td> {dateFormated2} </td>
                    <td className="line"> {dateFormated3} </td>
                    <td> {demande.duree} </td>
                    <td className="line"> {demande.piece} </td>

                    <td className="action">
                      <button
                        type="button"
                        className="bouttonMS"
                        onClick={(event) => {
                          event.preventDefault();
                          handleModifierClick(demande);
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
                          handleSupprimerClick(demande);
                        }}
                        disabled={
                          etatBouttonsSupprimerDemande[demande.idstagiaire]
                            ?.supprimerBoutton
                        }
                        style={{
                          color:
                            etatBouttonsSupprimerDemande[demande.idstagiaire]
                              ?.couleurBouttonSup,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          fill={
                            etatBouttonsSupprimerDemande[demande.idstagiaire]
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

                    <td className="bouttonPdf action">
                      <button
                        type="button"
                        className="bouttonDecision"
                        onClick={() => {
                          ImprimerDecision(demande.iddemande);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill={rouge}
                          className="bi bi-file-earmark-pdf"
                          viewBox="0 0 16 16"
                        >
                          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                          <path d="M4.603 14.087a.8.8 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.7 7.7 0 0 1 1.482-.645 20 20 0 0 0 1.062-2.227 7.3 7.3 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a11 11 0 0 0 .98 1.686 5.8 5.8 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.86.86 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.7 5.7 0 0 1-.911-.95 11.7 11.7 0 0 0-1.997.406 11.3 11.3 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.8.8 0 0 1-.58.029m1.379-1.901q-.25.115-.459.238c-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361q.016.032.026.044l.035-.012c.137-.056.355-.235.635-.572a8 8 0 0 0 .45-.606m1.64-1.33a13 13 0 0 1 1.01-.193 12 12 0 0 1-.51-.858 21 21 0 0 1-.5 1.05zm2.446.45q.226.245.435.41c.24.19.407.253.498.256a.1.1 0 0 0 .07-.015.3.3 0 0 0 .094-.125.44.44 0 0 0 .059-.2.1.1 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a4 4 0 0 0-.612-.053zM8.078 7.8a7 7 0 0 0 .2-.828q.046-.282.038-.465a.6.6 0 0 0-.032-.198.5.5 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822q.036.167.09.346z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr key={demandes.iddemande}>
                <td colSpan="8">Aucun service trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DemandeTable;
