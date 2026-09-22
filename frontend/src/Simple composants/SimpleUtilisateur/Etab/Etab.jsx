import React, { useState, useEffect } from "react";
import Axios from "axios";
import CustomInput from "../../../Components/InputCom/CustomInput";
import TitreFormulaire from "../../../Components/TitreFormulaire/TitreFormulaire";
import Boutton from "../../../Components/boutton/Boutton";
import "./Etab.css";
import Supprimer from "../../../Components/Supprimer/Supprimer";
import BouttonMS from "../../../Components/bouttonMS/BouttonMS";
import { bleu, rouge, rougeFonce } from "../../../Components/Couleurs/couleur";

const Etab = () => {
  const [ouvrirAjouter, setOuvrirAjouter] = useState(false);
  const [ouvrirModifier, setOuvrirModifier] = useState(false);
  const [ouvrirSupprimer, setOuvrirSupprimer] = useState(false);
  const [selectionneEtab, setSelectionneEtab] = useState(false);
  const [etatBouttonsSupprimer, setEtatBouttonsSupprimer] = useState({});
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const bouttonModifier = (etablissement) => {
    setOuvrirModifier(true);
    setSelectionneEtab(etablissement);
  };

  const bouttonSupprimer = (etablissement) => {
    setOuvrirSupprimer(true);
    setSelectionneEtab(etablissement);
  };

  const [etabDatas, setEtabDatas] = useState([]);

  const listerEtab = () => {
    Axios.get("http://localhost:8080/etablissement/selectionnerTout")
      .then((response) => {
        setEtabDatas(response.data);
        const etatInitial = {};
        response.data.forEach((etab) => {
          etatInitial[etab.idetab] = {
            supprimerBoutton: false,
            couleurBouttonSup: rouge,
          };
          disabledBouttonSupprimer(etab.idetab);
        });
        setEtatBouttonsSupprimer(etatInitial);
      })
      .catch((error) => {
        console.log("Erreur d'affichage:" + error);
      });
  };

  const Etablissement = ({
    titreFormulaireMS,
    titreBoutton,
    couleurBoutton,
    FonctionAnnuler,
    idEtablissement,
    nometablissement,
    adresseetablissement,
  }) => {

    const [etablissement, setEtablissement] = useState({
      idetab: idEtablissement || "",
      nometab: nometablissement || "",
      adresseetab: adresseetablissement || "",
    });

    const isFormValid =
      etablissement.nometab !== "" && etablissement.adresseetab !== "";
    const handleChange = (event) => {
      event.preventDefault();
      setEtablissement({
        ...etablissement,
        [event.target.name]: event.target.value,
      });
    };

    const CreateUpdateEtab = (event) => {
      event.preventDefault();
      if (isFormValid && titreFormulaireMS === "Ajouter un établissement") {
        console.log("ajouter:" + etablissement.nometab);

        Axios.post("http://localhost:8080/etablissement/ajouter", etablissement)
          .then((response) => {
            console.log(response.data);

            setEtablissement({ nometab: "", adresseetab: "" });
            listerEtab();
            setConfirmation({
              ouvrir: true,
              texte: "Ajouté !",
              couleur: "green",
            });

            setOuvrirAjouter(false);
          })

          .catch((error) => {
            console.error(error);
            setOuvrirAjouter(false);
            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });
          });
      } else if (
        isFormValid &&
        titreFormulaireMS === "Modifier un établissement"
      ) {
        console.log("Modifier" + etablissement.nometab);

        Axios.put(
          `http://localhost:8080/etablissement/modifier/${selectionneEtab.idetab}`,
          etablissement
        )
          .then((response) => {
            console.log(response);

            setConfirmation({
              ouvrir: true,
              texte: "Modifié !",
              couleur: "green",
            });

            listerEtab();

            setOuvrirModifier(false);
          })
          .catch((error) => {
            console.log("Error dans la modification" + error);
            setOuvrirModifier(false);
            setConfirmation({
              ouvrir: true,
              texte: "Erreur !",
              couleur: "red",
            });
          });
      } else {
        alert("Veuillez remplir tous les champs");
      }
    };

    return (
      <div className="backFormulaire">
        <div className="formulaireMS">
          <TitreFormulaire titre={titreFormulaireMS} />

          <form onSubmit={CreateUpdateEtab}>
            <CustomInput
              type="text"
              label="Nom de l'établissement"
              name="nometab"
              value={etablissement.nometab}
              onChange={handleChange}
            />

            <CustomInput
              type="text"
              label="Adresse de l'établissement"
              name="adresseetab"
              value={etablissement.adresseetab}
              onChange={handleChange}
            />

            <BouttonMS
              type="submit"
              name={titreBoutton}
              text={titreBoutton}
              couleur={couleurBoutton}
              disabled={!isFormValid}
            />

            <BouttonMS
              type="button"
              name="annulerBoutton"
              text="Fermer"
              couleur={bleu}
              onClick={FonctionAnnuler}
            />
          </form>
        </div>
      </div>
    );
  };

  const disabledBouttonSupprimer = (idetab) => {
    Axios.get(`http://localhost:8080/etablissement/verification/${idetab}`)
      .then((response) => {
        setEtatBouttonsSupprimer((prevEtat) => ({
          ...prevEtat,
          [idetab]: {
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
    listerEtab();
  }, []);

  return (
    <div>
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

      <div className="table">
        <div className="bouttonAjouter">
          <Boutton
            className="bouttonAJOUT"
            type="button"
            text="Nouveau établissement"
            name="nouveauEtab"
            onClick={(event) => {
              event.preventDefault();
              setOuvrirAjouter(true);
            }}
          />
        </div>

        <div className="tableEtablissement">
          <table>
            <thead>
              <tr>
                <th>Identifiant</th>
                <th>Nom de l'établissement</th>
                <th>Adresse </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {etabDatas.length > 0 ? (
                etabDatas.map((etabData) => (
                  <tr key={etabData.idetab || etabData.nometab}>
                    <td> {etabData.idetab || "NON DISPONIBLE"} </td>
                    <td> {etabData.nometab || "NON DISPONIBLE"} </td>
                    <td> {etabData.adresseetab || "NON DISPONIBLE"} </td>
                    <td>
                      <button
                        type="button"
                        className="bouttonservice"
                        onClick={(event) => {
                          event.preventDefault();
                          bouttonModifier(etabData);
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
                          bouttonSupprimer(etabData);
                        }}
                        disabled={
                          etatBouttonsSupprimer[etabData.idetab]
                            ?.supprimerBoutton
                        }
                        style={{
                          color:
                            etatBouttonsSupprimer[etabData.idetab]
                              ?.couleurBouttonSup,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          fill={
                            etatBouttonsSupprimer[etabData.idetab]
                              ?.couleurBouttonSup
                          }
                          className="bi bi-trash"
                          viewBox="0 0 16 16"
                        >
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                        </svg>
                      </button>{" "}
                    </td>
                  </tr>
                ))
              ) : (
                <tr key={etabDatas.idetab}>
                  <td colSpan="4">Aucun service trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        {ouvrirAjouter && (
          <Etablissement
            titreFormulaireMS="Ajouter un établissement"
            titreBoutton="Ajouter"
            couleurBoutton="#0E87CC"
            FonctionAnnuler={(event) => {
              event.preventDefault();
              setOuvrirAjouter(false);
            }}
            idEtablissement=""
            nometablissement=""
            adresseetablissement=""
          />
        )}

        {ouvrirModifier && (
          <Etablissement
            titreFormulaireMS="Modifier un établissement"
            titreBoutton="Modifier "
            couleurBoutton="#017371"
            FonctionAnnuler={(event) => {
              event.preventDefault();
              setOuvrirModifier(false);
            }}
            idEtablissement={selectionneEtab.idetab}
            nometablissement={selectionneEtab.nometab}
            adresseetablissement={selectionneEtab.adresseetab}
          />
        )}

        {ouvrirSupprimer && (
          <div className="supprimerFenetreET">
            <Supprimer
              titre="un établissement"
              fonction={() => {
                Axios.delete(
                  `http://localhost:8080/etablissement/supprimer/${selectionneEtab.idetab}`
                )
                  .then((response) => {
                    console.log(response.data);
                    listerEtab();
                    setConfirmation({
                      ouvrir: true,
                      texte: "Supprimé !",
                      couleur:'green'
                    });
        
                  })
                  .catch((error) => {
                    console.error(
                      "Erreur lors de la récupération des services",
                      error
                    );

                    setConfirmation({
                      ouvrir: true,
                      texte: "Error !",
                      couleur:'red'
                    });

                  });
              }}
              valeur={selectionneEtab.idetab}
              lister={listerEtab}
              fonctionAnnuler={(event) => {
                event.preventDefault();

                setOuvrirSupprimer(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Etab;
