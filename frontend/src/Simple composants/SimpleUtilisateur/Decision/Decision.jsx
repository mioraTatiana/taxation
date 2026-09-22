import React, { useEffect, useState } from "react";
import Axios from "axios";
import CustomInput from "../../../Components/InputCom/CustomInput";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import SelectCom from "../../../Components/SelectCom/SelectCom";
import "./Decision.css";
import Boutton from "../../../Components/boutton/Boutton";
import Supprimer from "../../../Components/Supprimer/Supprimer";
import Popup from "../../../Components/popup/Popup";
import { bleu, rouge, rougeFonce } from "../../../Components/Couleurs/couleur";

const Decision = () => {
  const [ouvrirAjouter, setOuvrirAjouter] = useState(false);
  const [ouvrirSupprimer, setOuvrirSupprimer] = useState(false);
  const [ouvrirModifier, setOuvrirModifier] = useState(false);
  const [selectionneDecision, setSelectionneDecision] = useState([]);
  const [etatBouttonsSupprimer, setEtatBouttonsSupprimer] = useState({});
  const [etatBouttonsSupprimer1, setEtatBouttonsSupprimer1] = useState({});

  const [directeur, setDirecteur] = useState("");
  const [iddecision, setIddecision] = useState("");
  const [ouvrirGPDF, setOuvrirGPDF] = useState(false);
  const [ouvrirPop, setOuvrirPop] = useState(false);
  const [titrePopup, setTitrePopup] = useState("");
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const [decisionDatas, setDecisionDatas] = useState([]);

  const bouttonModifier = (decision) => {
    setSelectionneDecision(decision);
    setOuvrirModifier(true);
  };

  const bouttonSupprimer = (decision) => {
    setSelectionneDecision(decision);
    setOuvrirSupprimer(true);
  };

  const impressionattestation = async (event) => {
    event.preventDefault();

    try {
      const response = await Axios.post(
        "http://localhost:8080/pdf/attestation",
        { directeur, iddecision },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "attestation.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      listerDecision();
       
      setDirecteur("")
      setOuvrirPop(true);
      setTitrePopup("Bien Imprimée");
      setTimeout(() => {
        setOuvrirGPDF(false);
      }, 1500);
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier PDF:", error);
      listerDecision();

      setOuvrirPop(true);
      setTitrePopup("Erreur lors du téléchargement ");
      setTimeout(() => {
        setOuvrirGPDF(false);
      }, 1500);
    }
  };

  const formPDF = directeur !== "" && iddecision !== "";

  const cliquerPdf = (iddecision) => {
    setIddecision(iddecision);
    setOuvrirGPDF(true);
  };

  const listerDecision = () => {
    Axios.get("http://localhost:8080/decision/selectionnerTout")
      .then((response) => {
        console.log(response);
        setDecisionDatas(response.data);

        const etatInitial = {};
        response.data.forEach((decision) => {
          etatInitial[decision.numdecision] = {
            supprimerBoutton: false,
            couleurBouttonSup: rouge,
          };
          disabledBouttonSupprimer(decision.numdecision);
        });
        setEtatBouttonsSupprimer(etatInitial);

        const etatInitial1 = {};
        response.data.forEach((decision) => {
          etatInitial1[decision.idstagiaire] = {
            supprimerBoutton1: false,
            couleurBouttonSup1: rouge,
          };
          disabledBouttonSupprimer1(decision.istagiaire);
        });
        setEtatBouttonsSupprimer1(etatInitial1);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const DecisionFormulaire = ({
    titreFormulaire,
    titreBoutton,
    couleurBoutton,
    numdeci,
    datedeci,
    stagiaire,
  }) => {
    const [loading, setLoading] = useState(false);
    const [decision, setDecision] = useState({
      numdecision: numdeci,
      datedecision: datedeci,
      idstagiaire: stagiaire,
    });

    const handleChange = (event) => {
      event.preventDefault();
      setDecision({ ...decision, [event.target.name]: event.target.value });
    };

    const isFormValid =
      decision.numdecision !== "" &&
      decision.datedecision !== "" &&
      decision.idstagiaire !== "";

    const CreateUpdateDecision = (event) => {
      event.preventDefault();
      if (isFormValid && titreFormulaire === "Nouvelle décision") {
        setLoading(true);
        Axios.post("http://localhost:8080/decision/ajouter", decision)
          .then((response) => {
            console.log(response);
            setLoading(false);

            listerDecision();

            setOuvrirPop(true);
            setTitrePopup("Bien ajoutée");
            setTimeout(() => {
              setOuvrirAjouter(false);
            }, 1500);
          })
          .catch((error) => {
            console.error(error);
            setLoading(false);
            listerDecision();
            alert(error)
            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });

            setOuvrirGPDF(false);
          });
      } else if (isFormValid && titreFormulaire === "Modifier la décision") {
        Axios.put(
          `http://localhost:8080/decision/modifier/${selectionneDecision.numdecision}`,
          decision
        )
          .then((response) => {
            console.log(response);

            listerDecision();

            setOuvrirPop(true);
            setTitrePopup("Bien modifiée");
            setTimeout(() => {
              setOuvrirModifier(false);
            }, 1500);
          })
          .catch((error) => {
            console.error(error);
            listerDecision();

            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });
            setOuvrirGPDF(false);
          });
      } else {
        alert("Remplissez les champs s'il vous plait");
      }
    };

    return (
      <div className="backFormulaire">
        <div className="formulaireDecision">
          {loading && (
            <div className="spinner-overlay">
              <div className="spinner"></div>
            </div>
          )}
          <div>
            <TitreFormulaire titre={titreFormulaire} />
          </div>

          <form onSubmit={CreateUpdateDecision}>
            <div className="ajoutEtModifierDecision">
              <div className="divAjoutModifie">
                <div>
                  <CustomInput
                    label="Numéro de la décision"
                    type="text"
                    value={decision.numdecision}
                    name="numdecision"
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Date de la décision"
                    type="date"
                    value={decision.datedecision}
                    name="datedecision"
                    onChange={handleChange}
                  />

                  <SelectCom
                    label="Stagiaire à décider"
                    name="idstagiaire"
                    value={decision.idstagiaire}
                    options="Stagiaire"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="bouttonDecisionDiv">
                <BouttonMS
                  type="submit"
                  text={titreBoutton}
                  name={titreBoutton}
                  couleur={couleurBoutton}
                  disabled={!isFormValid}
                />

                <BouttonMS
                  type="button"
                  text="Fermer"
                  name="annulerBoutton"
                  couleur={bleu}
                  onClick={(event) => {
                    event.preventDefault();
                    if (titreFormulaire === "Nouvelle décision") {
                      setOuvrirAjouter(false);
                    } else {
                      setOuvrirModifier(false);
                    }
                  }}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const disabledBouttonSupprimer1 = (stagiaire) => {
    Axios.get(`http://localhost:8080/demande/verificationDecision/${stagiaire}`)
      .then((response) => {
        setEtatBouttonsSupprimer1((prevEtat) => ({
          ...prevEtat,
          [stagiaire]: {
            supprimerBoutton1: response.status === 200,
            couleurBouttonSup1: response.status === 200 ? rougeFonce : rouge,
          },
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const disabledBouttonSupprimer = (numdecision) => {
    Axios.get(`http://localhost:8080/decision/verification/${numdecision}`)
      .then((response) => {
        setEtatBouttonsSupprimer((prevEtat) => ({
          ...prevEtat,
          [numdecision]: {
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
    listerDecision();
  }, []);

  useEffect(() => {
    decisionDatas.forEach((decision) => {
      disabledBouttonSupprimer1(decision.idstagiaire);
    });
  }, [decisionDatas]);


  return (
    <div>
      <div>
        <Popup
          ouvrirPopup={ouvrirPop}
          titrePopup={titrePopup}
          fermerPopup={(event) => {
            event.preventDefault();
            setOuvrirPop(false);
          }}
        />
      </div>
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
          <div className="supprimerFenetre">
            <Supprimer
              titre=" une décision"
              fonction={() => {
                Axios.delete(
                  `http://localhost:8080/decision/supprimer/${selectionneDecision.numdecision}`
                )
                  .then((response) => {
                    console.log(response);
                    listerDecision();
                    setOuvrirPop(true);
                    setTitrePopup("Supprimée !");
                  })
                  .catch((error) => {
                    console.log(error);
                    setConfirmation({
                      ouvrir: true,
                      texte: "Error !",
                      couleur: "red",
                    });
                  });
              }}
              lister={listerDecision}
              valeur={selectionneDecision.numdecision}
              fonctionAnnuler={(event) => {
                event.preventDefault();
                setOuvrirSupprimer(false);
              }}
            />
          </div>
        )}

        {ouvrirAjouter && (
          <DecisionFormulaire
            titreFormulaire="Nouvelle décision"
            titreBoutton="Ajouter"
            couleurBoutton="#0E87CC"
            numdeci=""
            datedeci=""
            stagiaire=""
          />
        )}

        {ouvrirModifier && (
          <DecisionFormulaire
            titreFormulaire="Modifier la décision"
            titreBoutton="Enregistrer"
            couleurBoutton="#017371"
            numdeci={selectionneDecision.numdecision}
            datedeci={
              new Date(selectionneDecision.datedecision)
                .toISOString()
                .split("T")[0]
            }
            stagiaire={selectionneDecision.idstagiaire}
          />
        )}
      </div>

      <div>
        <Boutton
          type="button"
          text="Nouvelle décision"
          name="desionajout"
          onClick={(event) => {
            event.preventDefault();
            setOuvrirAjouter(true);
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Numéro décision</th>
              <th>Date de décision</th>
              <th className="titreTable">Stagiaire</th>
              <th className="titreTable">Service</th>
              <th>Actions</th>
              <th>Projet attesation</th>
            </tr>
          </thead>

          <tbody>
            {decisionDatas.length > 0 ? (
              decisionDatas.map((decisionData) => {
                const date = new Date(decisionData.datedecision);
                const day = date.getUTCDate().toString().padStart(2, "0");
                const month = (date.getUTCMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const year = date.getUTCFullYear();

                const formattedDate = `${day}/${month}/${year}`;

                return (
                  <tr key={decisionData.numdecision}>
                    <td> {decisionData.numdecision} </td>
                    <td> {formattedDate} </td>
                    <td className="lineDec"> {decisionData.nomstagiaire} </td>
                    <td className="lineDec"> {decisionData.nomservice} </td>
                    <td>
                      <button
                        type="button"
                        className="bouttonDecision"
                        onClick={(event) => {
                          event.preventDefault();
                          bouttonModifier(decisionData);
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
                        className="bouttonDecision"
                        onClick={(event) => {
                          event.preventDefault();
                          bouttonSupprimer(decisionData);
                        }}
                        disabled={
                          etatBouttonsSupprimer[decisionData.numdecision]
                            ?.supprimerBoutton
                        }
                        style={{
                          color:
                            etatBouttonsSupprimer[decisionData.numdecision]
                              ?.couleurBouttonSup,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          fill={
                            etatBouttonsSupprimer[decisionData.numdecision]
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
                    <td>
                      <button
                        type="button"
                        className="bouttonDecision"
                        onClick={(event) => {
                          event.preventDefault();

                          cliquerPdf(decisionData.numdecision);
                        }}
                        disabled={
                          etatBouttonsSupprimer1[decisionData.idstagiaire]
                            ?.supprimerBoutton1
                        }
                        style={{
                          color:
                            etatBouttonsSupprimer1[decisionData.idstagiaire]
                              ?.couleurBouttonSup1,
                        }}

                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill={
                            etatBouttonsSupprimer1[decisionData.idstagiaire]
                              ?.couleurBouttonSup1
                          }
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
              <tr>
                <td colSpan={5}>Aucune décision trouvée</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ouvrirGPDF && (
        <div className="backFormulaire">
          <div className="divAttestation">
            <TitreFormulaire titre="Projet d'une attestation" />

            <form onSubmit={impressionattestation}>
              <CustomInput
                type="text"
                label="Nom du directeur"
                value={directeur}
                onChange={(event) => {
                  setDirecteur(event.target.value);
                }}
                name="directeur"
              />

              <CustomInput
                type="text"
                label="Numéro decision"
                value={iddecision}
                onChange={(event) => {
                  setIddecision(event.target.value);
                }}
                name="iddecison"
              />

              <BouttonMS
                type="submit"
                text="PDF"
                name="PdfDecision"
                couleur={rouge}
                disabled={!formPDF}
              />
            </form>

            <BouttonMS
              type="button"
              text="Fermer"
              name="annuler"
              onClick={(event) => {
                event.preventDefault();
                setOuvrirGPDF(false);
                setDirecteur("");
              }}
              couleur={bleu}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Decision;
