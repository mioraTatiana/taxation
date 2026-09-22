import React, { useEffect, useState } from "react";
import Axios from "axios";
import TitreFormulaire from "../../../../Components/TitreFormulaire/TitreFormulaire";
import CustomInput from "../../../../Components/InputCom/CustomInput";
import BouttonMS from "../../../../Components/bouttonMS/BouttonMS";
import "./DemandePage.css";
import SelectCom from "../../../../Components/SelectCom/SelectCom";
import "../../../../Components/popup/popup.css";
import Popup from "../../../../Components/popup/Popup";
import Modal from "react-modal";
import { bleu } from "../../../../Components/Couleurs/couleur";
import NouveauStagiaireSU from "../../Stagiaire/NouveauStagiaireSU/NouveauStagiaireSU";
Modal.setAppElement("#root");

const DemandePage = ({
  titreDemande,
  textBoutton,
  nameBoutton,
  couleurBoutton,
  numPage,
  fonctionAnnuler,
  demandeid,
  stagiaire,
  service,
  motifdemande,
  dureedemande,
  datededemande,
  datededebut,
  posteStagiaire,
  piecedemande,
  lister,
}) => {
  const [demande, setDemande] = useState({
    idstagiaire: stagiaire,
    idservice: service,
    motif: motifdemande,
    duree: dureedemande,
    datedemande: datededemande,
    piece: piecedemande,
    datedebut: datededebut,
    poste: posteStagiaire,
  });

  const titrebe = 'Demande ajouté! \n Projet de décision imprimé!'

  const handleChange = (event) => {
    setDemande({ ...demande, [event.target.name]: event.target.value });
  };

  const isFormValid =
    demande.idstagiaire !== "" &&
    demande.idservice !== "" &&
    demande.motif !== "" &&
    demande.duree !== "" &&
    demande.datedemande !== "" &&
    demande.piece !== "" &&
    demande.datedebut !== "" &&
    demande.poste !== "";

  const [ouvrirDemande, setOuvrirDemande] = useState(false);
  const [ouvrirStagiaire, setOuvrirStagaire] = useState(false);
  const [ouvrir, setOuvrir] = useState(false);
  const [ouvrirPop, setOuvrirPop] = useState(false); // Changer en boolean pour gérer l'état du modal correctement
  const changerIsOpen = () => {
    setOuvrirPop(false);
  };

  const changerIsOpen1 = () => {
    setOuvrirPop(false);
  };

  const titrePop =
    titreDemande === "Ajouter une demande" ? "Bien ajoutée" : "Bien modifiée";

  const CreateUpdateDemande = (event) => {
    event.preventDefault();

    if (demande.datedebut < demande.datedemande || demande.datedebut === demande.datedemande) {
      alert('la date de debut doit etre supérieur au date de demande')
    } else {
      if (isFormValid && titreDemande === "Ajouter une demande") {
        Axios.post("http://localhost:8080/demande/ajouter", demande)
  
          .then((response) => {
            setDemande({
              idstagiaire: "",
              idservice: "",
              motif: "",
              duree: "",
              datedemande: "",
              piece: "",
              datedebut: "",
              poste: "",
            });
  
            Axios.get(
              `http://localhost:8080/pdf/decision/${response.data[0].iddemande}`,
              {
                responseType: "blob",
              }
            )
              .then((response) => {
  
                
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "decision.pdf"); // Set the filename
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
  
  
                setOuvrir(true);
  
                setTimeout(() => {
  
  
                  setTimeout(() => {
                    fonctionAnnuler(event);
                  }, 1500);
                  if (numPage === "2/2") {
                    setOuvrirDemande(false);
                    setOuvrirStagaire(true);
                  }
  
                  console.log("Ajouter :", response.data);
                }, 2500);
              })
              .catch((error) => {
                alert('Imprimer votre pdf')
                console.log("Erreur: ", error);
              });
          })
          .catch((error) => {
            alert('Ajouter')
            console.log("Erreur: ", error);
          });
      } else {
        Axios.put(`http://localhost:8080/demande/modifier/${demandeid}`, demande)
  
          .then((response) => {
            console.log("Erreur:", response);
            setOuvrirPop(true);
            setDemande({
              idstagiaire: "",
              idservice: "",
              motif: "",
              duree: "",
              datedemande: "",
              piece: "",
              datedebut: "",
              poste: "",
            });
  
            console.log("Modifier :" + response.data);
            setTimeout(() => {
              fonctionAnnuler(event);
            }, 1500);
            lister();
          })
          .catch((error) => {
            console.log("Erreur:", error);
          });
      }
  
    }

    // if (isFormValid && titreDemande === "Ajouter une demande") {
    //   Axios.post("http://localhost:8080/demande/ajouter", demande)

    //     .then((response) => {
    //       setDemande({
    //         idstagiaire: "",
    //         idservice: "",
    //         motif: "",
    //         duree: "",
    //         datedemande: "",
    //         piece: "",
    //         datedebut: "",
    //         poste: "",
    //       });

    //       Axios.get(
    //         `http://localhost:8080/pdf/decision/${response.data[0].iddemande}`,
    //         {
    //           responseType: "blob",
    //         }
    //       )
    //         .then((response) => {

              
    //           const url = window.URL.createObjectURL(new Blob([response.data]));
    //           const link = document.createElement("a");
    //           link.href = url;
    //           link.setAttribute("download", "decision.pdf"); // Set the filename
    //           document.body.appendChild(link);
    //           link.click();
    //           document.body.removeChild(link);


    //           setOuvrir(true);

    //           setTimeout(() => {


    //             setTimeout(() => {
    //               fonctionAnnuler(event);
    //             }, 1500);
    //             if (numPage === "2/2") {
    //               setOuvrirDemande(false);
    //               setOuvrirStagaire(true);
    //             }

    //             console.log("Ajouter :", response.data);
    //           }, 2500);
    //         })
    //         .catch((error) => {
    //           alert('errer de pdf')
    //           console.log("Erreur: ", error);
    //         });
    //     })
    //     .catch((error) => {
    //       alert('Ajouter')
    //       console.log("Erreur: ", error);
    //     });
    // } else {
    //   Axios.put(`http://localhost:8080/demande/modifier/${demandeid}`, demande)

    //     .then((response) => {
    //       console.log("Erreur:", response);
    //       setOuvrirPop(true);
    //       setDemande({
    //         idstagiaire: "",
    //         idservice: "",
    //         motif: "",
    //         duree: "",
    //         datedemande: "",
    //         piece: "",
    //         datedebut: "",
    //         poste: "",
    //       });

    //       console.log("Modifier :" + response.data);
    //       setTimeout(() => {
    //         fonctionAnnuler(event);
    //       }, 1500);
    //       lister();
    //     })
    //     .catch((error) => {
    //       console.log("Erreur:", error);
    //     });
    // }
    
  };
  useEffect(() => {
    setOuvrirDemande(true);
  }, []);
  return (
    <div>
      {ouvrirStagiaire && <NouveauStagiaireSU />}
      {ouvrirDemande && (
        <div className={"demandePage"}>
          <Popup
            ouvrirPopup={ouvrirPop}
            titrePopup={titrePop}
            fermerPopup={changerIsOpen}
          />

          <Popup
            ouvrirPopup={ouvrir}
            titrePopup={titrebe}
            fermerPopup={changerIsOpen1}
          />

          <div className="corps">
            <div className="nouveauDemande">
              <div className="titreFormulaireDemande">
                <TitreFormulaire titre={titreDemande} />
              </div>

              <form onSubmit={CreateUpdateDemande}>
                <div className="formeNouveauDemande">
                  <div className="grandesection">
                    <div className="section2">
                      <SelectCom
                        label="Stagiaire autorisé"
                        name="idstagiaire"
                        value={demande.idstagiaire}
                        onChange={handleChange}
                      />

                      <SelectCom
                        label="Service"
                        value={demande.idservice}
                        onChange={handleChange}
                        name="idservice"
                      />

                      <CustomInput
                        type="date"
                        label="Date de demande"
                        value={demande.datedemande}
                        onChange={handleChange}
                        name="datedemande"
                      />

                      <CustomInput
                        type="texte"
                        label="Poste du stagiaire"
                        value={demande.poste}
                        onChange={handleChange}
                        name="poste"
                      />
                    </div>

                    <div className="section3">
                      <CustomInput
                        type="date"
                        label="Date de debut"
                        value={demande.datedebut}
                        onChange={handleChange}
                        name="datedebut"
                      />

                      <CustomInput
                        type="text"
                        label="Motif"
                        value={demande.motif}
                        onChange={handleChange}
                        name="motif"
                      />

                      <CustomInput
                        type="number"
                        label="Durée"
                        value={demande.duree}
                        onChange={handleChange}
                        name="duree"
                        placeholder="en mois"
                      />

                      <CustomInput
                        type="text"
                        label="Pièces"
                        value={demande.piece}
                        onChange={handleChange}
                        name="piece"
                      />
                    </div>
                  </div>

                  <div className="bouttonAjoutDemande">
                    <div className="BouttonDemande">
                      <BouttonMS
                        type="submit"
                        text={textBoutton}
                        name={nameBoutton}
                        couleur={couleurBoutton}
                        disabled={!isFormValid}
                      />

                      <BouttonMS
                        type="button"
                        text="Initialiser"
                        name="AnnulerButton"
                        onClick={fonctionAnnuler}
                        couleur={bleu}
                      />
                    </div>

                    <div className="page">{numPage}</div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandePage;
