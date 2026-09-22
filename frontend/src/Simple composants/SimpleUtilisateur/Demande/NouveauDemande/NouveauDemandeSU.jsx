import React, { useState } from 'react'
import DemandePage from './DemandePage'
import {bleu} from'../../../../Components/Couleurs/couleur'
import './DemandePage.css'

const NouveauDemandeSU = () => {
  const [demande, setDemande] = useState({
    stagiaire:"",
    service:"",
    motifdemande:"",
    dureedemande:"",
    datededemande:"",
    piecedemande:"",
    datededebut:"",
    posteStagiaire:""

  })
  return (
    <div className='demandePageFenetre'>
      <DemandePage 
       titreDemande="Ajouter une demande"
       textBoutton="Ajouter"
       nameBoutton="demandeAjout"
       couleurBoutton={bleu}
       numPage="2/2"
       demandeid=''
       stagiaire={demande.stagiaire}
       service={demande.service}
       motifdemande={demande.motifdemande}
       dureedemande={demande.dureedemande}
       datededemande={demande.datededemande}
       piecedemande={demande.piecedemande}
       datededebut={demande.datededebut}
       posteStagiaire={demande.posteStagiaire}
       fonctionAnnuler={() => {
        setDemande(
          {
            stagiaire:"",
            service:"",
            motifdemande:"",
            dureedemande:"",
            datededemande:"",
            piecedemande:"",
            datededebut:"",
            posteStagiaire:""
        
        
        
          }
        )
       }}
     
      />
    </div>
  )
}

export default NouveauDemandeSU
