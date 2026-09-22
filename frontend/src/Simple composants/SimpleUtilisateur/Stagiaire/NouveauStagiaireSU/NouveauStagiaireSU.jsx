import React, { useState } from "react";
import NouveauStagiaire from "../Nouveu stagiaire/NouveauStagiaire";
import { bleu } from "../../../../Components/Couleurs/couleur";

const NouveauStagiaireSU = () => {
  const [stagiaire, setStagiaire] = useState({
    nom: "",
    email: "",
    tel: "",
    etab: "",
    filiere: "",
    niveau: "",
    diplome: ""

  });

  return (
    <div>
     
        <NouveauStagiaire
          titreFormulaireStagiaire="Nouveau stagiaire"
          textButton="Ajouter"
          couleurButton={bleu}
          nom={stagiaire.nom}
          email={stagiaire.email}
          tel={stagiaire.tel}
          etab={stagiaire.etab}
          filierestagiaire={stagiaire.filiere}
          niveaustagiaire={stagiaire.niveau}
          diplomestagiaire={stagiaire.diplome}
          fonction={(event) => {
            event.preventDefault();
            setStagiaire({
              nom: "",
              email: "",
              tel: "",
              etab: "",
              filiere: "",
              niveau: "",
              diplome: ""
      
            });
          }}
          page="1/2"
        />
   

    </div>
  );
};

export default NouveauStagiaireSU;
