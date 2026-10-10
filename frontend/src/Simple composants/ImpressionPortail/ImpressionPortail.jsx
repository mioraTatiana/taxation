import React from "react";
import { createPortal } from "react-dom";
import "./ImpressionPortail.css";

// Affiche son contenu dans <body>, invisible à l'écran.
// Au moment d'imprimer, tout le reste de la page est masqué : seul ce contenu est imprimé.
// À utiliser ainsi : {enImpression && <ImpressionPortail>...</ImpressionPortail>}
// puis window.print() (dans la fenêtre d'impression : "Enregistrer au format PDF").
function ImpressionPortail({ children }) {
  return createPortal(<div className="ImpressionPortail">{children}</div>, document.body);
}

export default ImpressionPortail;
