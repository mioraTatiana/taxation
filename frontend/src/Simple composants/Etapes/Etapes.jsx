import React from "react";
import "./Etapes.css";

// Indicateur d'étapes : 1 ---- 2 ---- 3
//  etapes = [{ numero: 1, libelle: "Client" }, ...]
function Etapes({ etapes, etapeActuelle }) {
  return (
    <div className="Etapes">
      {etapes.map((etape, index) => {
        const atteinte = etape.numero <= etapeActuelle;

        return (
          <React.Fragment key={etape.numero}>
            {index > 0 && (
              <div className={atteinte ? "EtapeLigne EtapeLigneActive" : "EtapeLigne"} />
            )}

            <div className="Etape">
              <div className={atteinte ? "EtapeCercle EtapeCercleActif" : "EtapeCercle"}>
                {etape.numero}
              </div>
              <span className={atteinte ? "EtapeLibelle EtapeLibelleActif" : "EtapeLibelle"}>
                {etape.libelle}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Etapes;
