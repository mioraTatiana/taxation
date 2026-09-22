import React, { useEffect, useState } from "react";
import Axios from "axios";
import CustomInput from "../../../Components/InputCom/CustomInput";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import SelectCom from "../../../Components/SelectCom/SelectCom";
import "./Attestation.css";
import Boutton from "../../../Components/boutton/Boutton";
import Supprimer from "../../../Components/Supprimer/Supprimer";
import { bleu } from "../../../Components/Couleurs/couleur";
import Popup from "../../../Components/popup/Popup";

const Attestation = () => {
  const [modifierAttestation, setModifierAttestation] = useState(false);
  const [ajouterAttestation, setAjouterAttestation] = useState(false);
  const [supprimererAttestation, setSupprimerAttestation] = useState(false);
  const [selectionneAttestation, setSelectionneAttestation] = useState([]);
  const [Loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);
  const [titre, setTitre] = useState("");
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const [attestationDatas, setAttestationDatas] = useState([]);

  const AttestationFormulaire = ({
    titreFormulaire,
    titreBoutton,
    couleurBoutton,
    numattest,
    numdeci,
    dateattest,
    livrableattest,
  }) => {
    const [attestationAM, setAttestationAM] = useState({
      numattestation: numattest,
      numdecision: numdeci,
      dateattestation: dateattest,
      livrable: livrableattest,
    });

    const handleChange = (event) => {
      event.preventDefault();
      setAttestationAM({
        ...attestationAM,
        [event.target.name]: event.target.value,
      });
    };

    const isFormValid =
      attestationAM.numattestation !== "" &&
      attestationAM.dateattestation !== "" &&
      attestationAM.numdecision !== "";

    const CreateUpdateAttestation = (event) => {
      event.preventDefault();

      if (isFormValid && titreFormulaire === "Nouvelle attestation") {
        setLoading(true);
        Axios.post("http://localhost:8080/attestation/ajouter", attestationAM)
          .then((response) => {
            console.log(response);
            setAttestationDatas(response.data);

            setLoading(false);

            setTitre("Ajoutée !");
            setPopup(true);

            listerAttestation();
            setTimeout(() => {
              setAjouterAttestation(false);
            }, 1500);
          })
          .catch((error) => {
            console.error(error);

            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });

            setLoading(false);
            setTimeout(() => {
              setAjouterAttestation(false);
            }, 1500);
          });
      } else if (isFormValid && titreFormulaire === "Modifier l'attesation") {
        Axios.put(
          `http://localhost:8080/attestation/modifier/${selectionneAttestation.numattestation}`,
          attestationAM
        )
          .then((response) => {
            console.log(response);
            listerAttestation();

            setTitre("Bien modifiée !");
            setPopup(true);

            setTimeout(() => {
              setModifierAttestation(false); // Fermer le formulaire de modification
            }, 1500);
          })
          .catch((error) => {
            console.error(error);
            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });

            setTimeout(() => {
              setModifierAttestation(false); // Fermer le formulaire de modification
            }, 1500);
          });
      } else {
        alert("Veuillez remplir tous les champs");
      }
    };

    return (
      <div className="backFormulaire">
        <div className="formulaireAttestation">
          {Loading && (
            <div className="spinner-overlay">
              <div className="spinner"></div>
            </div>
          )}

          <div>
            <TitreFormulaire titre={titreFormulaire} />
          </div>

          <form onSubmit={CreateUpdateAttestation}>
            <div className="ajoutEtModifierAttestation">
              <div className="divisionFormulaire">
                <div>
                  <CustomInput
                    label="Numéro de l'attestation"
                    type="text"
                    value={attestationAM.numattestation}
                    name="numattestation"
                    onChange={handleChange}
                  />

                  <CustomInput
                    label="Date de l'attestation"
                    type="date"
                    value={attestationAM.dateattestation}
                    name="dateattestation"
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <CustomInput
                    label="Livrable"
                    type="text"
                    value={attestationAM.livrable}
                    name="livrable"
                    onChange={handleChange}
                  />

                  <SelectCom
                    label="Stagiaire à attester"
                    name="numdecision"
                    value={attestationAM.numdecision}
                    options="Stagiaire"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="bouttonFormulaire">
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
                  name="annuler"
                  onClick={(event) => {
                    event.preventDefault();
                    if (titreFormulaire === "Nouvelle attestation") {
                      setAjouterAttestation(false);
                    } else {
                      setModifierAttestation(false);
                    }
                  }}
                  couleur={bleu}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const bouttonModifier = (attestation) => {
    setSelectionneAttestation(attestation);
    setModifierAttestation(true);
  };

  const bouttonSupprimer = (attestation) => {
    setSelectionneAttestation(attestation);
    setSupprimerAttestation(true);
  };

  const listerAttestation = () => {
    Axios.get("http://localhost:8080/attestation/selectionnerTout")
      .then((response) => {
        setAttestationDatas(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    listerAttestation();
  }, []);

  return (
    <div className="attestationPage">
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
        <Boutton
          type="button"
          text="Nouvelle attestation"
          name="decionajout"
          onClick={(event) => {
            event.preventDefault();
            setAjouterAttestation(true);
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Numéro attestation</th>
              <th>Numéro décision</th>
              <th>Date de l' attestation</th>
              <th className="titreTable">Stagiaire</th>
              <th className="titreTable">Service</th>
              <th className="titreTable">Livrables</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {attestationDatas.length > 0 ? (
              attestationDatas.map((attestationData) => {
                const date = new Date(attestationData.dateattestation);

                const day = date.getUTCDate().toString().padStart(2, "0");
                const month = (date.getUTCMonth() + 1)
                  .toString()
                  .padStart(2, "0");
                const year = date.getUTCFullYear();

                const formattedDate = `${day}/${month}/${year}`;
                return (
                  <tr key={attestationData.numattestation}>
                    <td>{attestationData.numattestation}</td>
                    <td>{attestationData.numdecision}</td>
                    <td>{formattedDate}</td>
                    <td className="lineDec">{attestationData.nomstagiaire}</td>
                    <td className="lineDec"> {attestationData.nomservice} </td>
                    <td className="lineDec"> {attestationData.livrable} </td>
                    <td>
                      <button
                        type="button"
                        className="bouttonAttestation"
                        onClick={(event) => {
                          event.preventDefault();
                          bouttonModifier(attestationData);
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
                        className="bouttonAttestation"
                        onClick={(event) => {
                          event.preventDefault();
                          bouttonSupprimer(attestationData);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          fill="#E53A40"
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
              })
            ) : (
              <tr key={attestationDatas.numattestation}>
                <td colSpan={6}>Aucune attestation trouvée</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        {ajouterAttestation && (
          <AttestationFormulaire
            titreFormulaire="Nouvelle attestation"
            titreBoutton="Ajouter"
            couleurBoutton="#0E87CC"
            numdeci=""
            numattest=""
            dateattest=""
            livrableattest=""
          />
        )}

        {modifierAttestation && (
          <AttestationFormulaire
            titreFormulaire="Modifier l'attesation"
            titreBoutton="Enregistrer"
            couleurBoutton="#017371"
            numdeci={selectionneAttestation.numdecision}
            numattest={selectionneAttestation.numattestation}
            dateattest={
              new Date(selectionneAttestation.dateattestation)
                .toISOString()
                .split("T")[0]
            }
            livrableattest={selectionneAttestation.livrable}
          />
        )}

        {supprimererAttestation && (
          <div className="supprimerFenetreA">
            <Supprimer
              titre=" une attestation"
              fonction={() => {
                Axios.delete(
                  `http://localhost:8080/attestation/supprimer/${selectionneAttestation.numattestation}`
                )
                  .then((response) => {
                    console.log(response);
                    listerAttestation();
                    setTitre("Supprimé !");
                    setPopup(true);
                  })
                  .catch((error) => {
                    console.error(error);
                    listerAttestation();
                    setConfirmation({
                      ouvrir: true,
                      texte: "Error !",
                      couleur: "red",
                    });
                  });
              }}
              valeur={selectionneAttestation.numattestation}
              lister={listerAttestation}
              fonctionAnnuler={(event) => {
                event.preventDefault();
                setSupprimerAttestation(false);
              }}
            />
          </div>
        )}

        <Popup
          ouvrirPopup={popup}
          titrePopup={titre}
          fermerPopup={(event) => {
            event.preventDefault();
            setPopup(false);
          }}
        />
      </div>
    </div>
  );
};

export default Attestation;
