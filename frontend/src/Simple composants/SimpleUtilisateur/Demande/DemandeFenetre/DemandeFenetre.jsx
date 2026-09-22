import React, { useState } from "react";
import NouveauStagiaireSU from "../../Stagiaire/NouveauStagiaireSU/NouveauStagiaireSU";
import DemandeTable from "../DemandeTable";
import "./DemandeFenetre.css";

function DemandeFenetre() {
  const [titreDemande, setTitreDemande] = useState('nouveau')

  const nouveauDemandeFonction = () =>{

    switch (titreDemande) {
      case 'nouveau':
        return<NouveauStagiaireSU/>
      
       default:
        return <DemandeTable/>
    }
  }
  return (
    <div className="demandeFenetre">
      <div className="nav">
        <ul className="demandeul">
          <li className={titreDemande === "nouveau"? "activeD" : "demandeLI"} id="nouveau" onClick={(event)=>{
            event.preventDefault()
            setTitreDemande('nouveau')
          }}>
            Nouvelle demande
          </li>
          <li className= {titreDemande === "demandeTable"? "activeD" : "demandeLI"} id="demande"  onClick={(event) => {
            event.preventDefault()
            setTitreDemande('demandeTable')
          }}>
            Demande
          </li>
        </ul>
      </div>
      <div className="corpsDemande">
        {nouveauDemandeFonction()}
       
      </div>
    </div>
  );
}

export default DemandeFenetre;
