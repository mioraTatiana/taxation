import React, { useState } from "react";
import Axios from "axios";
import CustomInput from "../../../../Components/InputCom/CustomInput";
import TitreFormulaire from "../../../../Components/TitreFormulaire/TitreFormulaire";
import "./NouveauStagiaire.css";
import Boutton from "../../../../Components/boutton/Boutton";
import BouttonMS from "../../../../Components/bouttonMS/BouttonMS";
import NouveauDemandeSU from "../../Demande/NouveauDemande/NouveauDemandeSU";
import "../../../../Components/popup/popup.css";
import Popup from "../../../../Components/popup/Popup";
import Modal from "react-modal";
import SelectCom from "../../../../Components/SelectCom/SelectCom";
Modal.setAppElement("#root");

const NouveauStagiaire = ({
  titreFormulaireStagiaire,
  textButton,
  couleurButton,
  id,
  nom,
  email,
  tel,
  etab,
  filierestagiaire,
  sexestagiaire,
  diplomestagiaire,
  niveaustagiaire,
  fonction,
  page,
  lister,
}) => {
  const [ouvrirNouvDemande, setOuvrirNouvelleDemande] = useState(false);
  const [ouvrirNouvStagiaire, setOuvrirNouvelleStagiaire] = useState(true);
  const [confirmation, setConfirmation] = useState({
    ouvrir: false,
    texte: "",
    couleur: "",
  });

  const [stagiaire, setStagiaire] = useState({
    nomstagiaire: nom,
    emailstagiaire: email,
    telstagiaire: tel,
    idetab: etab,
    filiere: filierestagiaire,
    sexe: sexestagiaire,
    niveau: niveaustagiaire,
    diplome: diplomestagiaire,
  });

  const [ouvrirPop, setOuvrirPop] = useState(false);
  const changerIsOpen = () => {
    setOuvrirPop(false);
  };

  const isFormValid =
    stagiaire.nomstagiaire !== "" &&
    stagiaire.emailstagiaire !== "" &&
    stagiaire.telstagiaire !== "" &&
    stagiaire.idetab !== "" &&
    stagiaire.filiere !== "" &&
    stagiaire.diplome !== "" &&
    stagiaire.niveau !== "" &&
    stagiaire.sexe !== "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setStagiaire({
      ...stagiaire,
      [name]: value,
    });
  };

  const fonctionAnnuler = (event) => {
    event.preventDefault();
    if (titreFormulaireStagiaire === "Nouveau stagiaire") {
      setStagiaire({
        nomstagiaire: "",
        emailstagiaire: "",
        telstagiaire: "",
        idetab: "",
        filiere: "",
        sexe: "",
        niveau: "",
        diplome: "",
      });
    } else {
      fonction();
    }
  };
  const CreateUpdateStagiaire = (event) => {
    event.preventDefault();

    if (isFormValid && titreFormulaireStagiaire === "Nouveau stagiaire") {

      Axios.post("http://localhost:8080/stagiaire/ajouter", stagiaire)

        .then((response) => {

          setStagiaire({
            nomstagiaire: "",
            emailstagiaire: "",
            telstagiaire: "",
            idetab: "",
            filiere: "",
            sexe: "",
            niveau: "",
            diplome: "",
          });

          console.log("Ajouter:", response.data);
          setOuvrirPop(true);
          setTimeout(() => {
            setOuvrirNouvelleDemande(true);
            setOuvrirNouvelleStagiaire(false);
          }, 1500);
        })
        .catch((error) => {
          alert(error);

          console.error("Erreur lors de la récupération des stagiaires", error);
        });
    } else if (
      isFormValid &&
      titreFormulaireStagiaire === "Modifier un stagiaire"
    ) {
      console.log("Modifié :", stagiaire);
      Axios.put(`http://localhost:8080/stagiaire/modifier/${id}`, stagiaire)
        .then((response) => {
          console.log("Modifier:", response.data);
          setStagiaire({
            nomstagiaire: "",
            emailstagiaire: "",
            telstagiaire: "",
            idetab: "",
            filiere: "",
            sexe: "F",
            niveau: "",
            diplome: "",
          });

          setOuvrirPop(true);
          setTimeout(() => {
            lister();
            fonction();
          }, 2000);
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des stagiaires", error);
          setConfirmation({
            ouvrir: true,
            texte: "Error !",
            couleur: "red",
          });

          setTimeout(() => {
            fonction();
            setOuvrirNouvelleStagiaire(false);
          }, 2000);
        });
    } else if (!isFormValid) {
      alert("Veuillez remplir tous les champs");
    } else {
      console.log(Error);
    }
  };

  const titrePopupStagiaire =
    titreFormulaireStagiaire === "Nouveau stagiaire"
      ? "Bien ajouté"
      : "Bien modifié";

  return (
    <div
      className={
        titreFormulaireStagiaire === "Nouveau stagiaire" ? "" : "backFormulaire"
      }
    >
      <div className={""}>
        {ouvrirNouvDemande && <NouveauDemandeSU />}
        {ouvrirNouvStagiaire && (
          <div className={"nouveauStagiaire"}>
            <div className="">
              <Popup
                ouvrirPopup={ouvrirPop}
                titrePopup={titrePopupStagiaire}
                fermerPopup={changerIsOpen}
              />
            </div>

            <div className="formulaireStagiaireMA">
              <div>
                <TitreFormulaire titre={titreFormulaireStagiaire} />
              </div>

              <form onSubmit={CreateUpdateStagiaire}>
                <div className="FormulaireStagiaire">
                  <div className="divFormulaire">
                    <div>
                      <CustomInput
                        label="Noms"
                        type="text"
                        value={stagiaire.nomstagiaire}
                        onChange={handleChange}
                        name="nomstagiaire"
                      />

                      <div className="radiosexe">
                        <div>
                          <label htmlFor="">Genre </label>
                        </div>
                        {stagiaire.sexe === "M" ? (
                          <div>
                            <div className="radioFM">
                              <input
                                type="radio"
                                name="sexe"
                                id="feminin"
                                value="F"
                                onChange={handleChange}
                              />

                              <label htmlFor="">Femme</label>
                            </div>

                            <div className="radioFM">
                              <input
                                type="radio"
                                name="sexe"
                                id="masculin"
                                value="M"
                                onChange={handleChange}
                                checked
                              />

                              <label htmlFor="">Homme</label>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="radioFM">
                              <input
                                type="radio"
                                name="sexe"
                                id="feminin"
                                value="F"
                                onChange={handleChange}
                                checked
                              />

                              <label htmlFor="">Femme</label>
                            </div>

                            <div className="radioFM">
                              <input
                                type="radio"
                                name="sexe"
                                id="masculin"
                                value="M"
                                onChange={handleChange}
                              />

                              <label htmlFor="">Homme</label>
                            </div>
                          </div>
                        )}
                      </div>

                      <CustomInput
                        label="Email"
                        type="email"
                        value={stagiaire.emailstagiaire}
                        onChange={handleChange}
                        name="emailstagiaire"
                        placeholder="ex: miora@gmail.com"
                      />

                      <CustomInput
                        label="Téléphone"
                        type="text"
                        value={stagiaire.telstagiaire}
                        onChange={handleChange}
                        name="telstagiaire"
                        placeholder="ex : 0340011100"
                      />
                    </div>

                    <div className="">
                      <SelectCom
                        label="Niveau"
                        value={stagiaire.niveau}
                        onChange={handleChange}
                        name="niveau"
                      />
                      <CustomInput
                        label="Diplome"
                        type="text"
                        value={stagiaire.diplome}
                        onChange={handleChange}
                        name="diplome"
                      />

                      <CustomInput
                        label="Filière"
                        type="text"
                        value={stagiaire.filiere}
                        onChange={handleChange}
                        name="filiere"
                      />

                      <SelectCom
                        label="Etablissement"
                        value={stagiaire.idetab}
                        onChange={handleChange}
                        name="idetab"
                      />
                    </div>
                  </div>

                  <div className="bouttonClass">
                    <BouttonMS
                      type="submit"
                      text={textButton}
                      name="AjouterStagiaire"
                      couleur={couleurButton}
                      disabled={!isFormValid}
                      onClick={CreateUpdateStagiaire}
                    />

                    <Boutton
                      type="button"
                      text="Initialiser"
                      name="fermer"
                      onClick={fonctionAnnuler}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="page">{page}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NouveauStagiaire;
