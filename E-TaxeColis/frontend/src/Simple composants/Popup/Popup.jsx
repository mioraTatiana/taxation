import React from "react";
import "./Popup.css";

// Pop up réutilisable : confirmation OU changement de valeur
// (le contenu change selon ce qu'on met entre les balises <Popup>...</Popup>)
// sansAnnuler : pop up d'information avec un seul bouton (ex: "J'ai compris")
function Popup({ titre, onFermer, onConfirmer, texteConfirmer, couleur, sansAnnuler, children }) {
  function empecherFermeture(e) {
    e.stopPropagation();
  }

  return (
    <div className="PopupFond" onClick={onFermer}>
      <div className="PopupBoite" onClick={empecherFermeture}>
        <h3 className="PopupTitre">{titre}</h3>

        <div className="PopupContenu">{children}</div>

        <div className="PopupBoutons">
          {!sansAnnuler && (
            <button type="button" className="PopupAnnuler" onClick={onFermer}>
              Annuler
            </button>
          )}
          <button
            type="button"
            className="PopupConfirmer"
            style={{ backgroundColor: couleur }}
            onClick={onConfirmer}
          >
            {texteConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Popup;
