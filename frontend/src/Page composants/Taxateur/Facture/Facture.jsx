import React, { useState } from "react";
import { X } from "lucide-react";
import "./Facture.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import ImpressionPortail from "../../../Simple composants/ImpressionPortail/ImpressionPortail";
import { bleu } from "../../../Simple composants/Couleurs/couleur";
import FactureApercu from "./FactureApercu/FactureApercu";
import { useFactures } from "../../../Simple composants/Outils/useFactures";
import { formaterDate } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";

function attendre(millisecondes) {
  return new Promise((resolve) => setTimeout(resolve, millisecondes));
}

// Colonnes de la table facture (clientNom et destinationNom = noms liés à idclient et iddestination)
const COLONNES = [
  { titre: "Numéro", cle: "numfacture" },
  { titre: "Date", cle: "datefacture", afficher: formaterDate },
  { titre: "Client", cle: "clientNom" },
  { titre: "Destination", cle: "destinationNom" },
  { titre: "Colis", cle: "nombrecolistotal", afficher: formaterMontant },
  { titre: "Poids réel", cle: "poidsreeltotal", afficher: (valeur) => `${formaterMontant(valeur)} kg` },
  { titre: "Poids facturé", cle: "poidsfacturetotal", afficher: (valeur) => `${formaterMontant(valeur)} kg` },
  { titre: "Total HT", cle: "montanthttotal", afficher: formaterMontant },
  { titre: "TVA", cle: "tva", afficher: formaterMontant },
  { titre: "Piquire", cle: "piquire", afficher: formaterMontant },
  { titre: "Total TTC", cle: "montantttc", afficher: (valeur) => `${formaterMontant(valeur)} Ar` },
];

// Facture complète affichée dans la fenêtre et dans l'impression (lecture seule : pas de Modifier / Supprimer)
function ApercuDeFacture({ facture, texteAction, onAction }) {
  return (
    <FactureApercu
      client={{
        nomclient: facture.clientNom,
        telephone: facture.clientTelephone,
        adresse: facture.clientAdresse,
      }}
      destinationNom={facture.destinationNom}
      zoneLibelle={facture.zoneLibelle}
      typeTrain={facture.typeTrain}
      lignes={facture.details}
      totaux={facture}
      numfacture={facture.numfacture}
      dateFacture={facture.datefacture}
      wagonComplet={facture.wagonComplet}
      texteAction={texteAction}
      onAction={onAction}
    />
  );
}

function Facture() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const { factures, chargement } = useFactures(periode);
  const [factureAffichee, setFactureAffichee] = useState(null);
  const [enImpression, setEnImpression] = useState(false);

  // Les plus récentes d'abord
  const liste = [...factures].sort((a, b) =>
    a.datefacture === b.datefacture ? b.idfacture - a.idfacture : b.datefacture.localeCompare(a.datefacture)
  );

  // Un seul bouton par ligne : Afficher
  function boutonsDeLigne(facture) {
    return [{ texte: "Afficher", couleur: bleu, onClick: () => setFactureAffichee(facture) }];
  }

  async function imprimer() {
    setEnImpression(true);
    await attendre(300);
    window.print(); // dans la fenêtre d'impression : "Enregistrer au format PDF"
    setEnImpression(false);
  }

  return (
    <div>
      <h2 className="FactureTitre">Factures</h2>

      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      <div className="FactureTableauZone">
        <TableDonnees
          colonnes={COLONNES}
          donnees={liste}
          cleLigne="idfacture"
          actions={boutonsDeLigne}
          messageVide={chargement ? "Chargement..." : "Aucune facture"}
        />
      </div>

      {/* Fenêtre qui affiche la facture (FactureApercu) */}
      {factureAffichee && (
        <div className="FactureFenetreFond" onClick={() => setFactureAffichee(null)}>
          <div className="FactureFenetre" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="FactureFenetreFermer"
              onClick={() => setFactureAffichee(null)}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <ApercuDeFacture facture={factureAffichee} texteAction="Imprimer" onAction={imprimer} />
          </div>
        </div>
      )}

      {/* Copie imprimée de la facture (invisible à l'écran) */}
      {enImpression && factureAffichee && (
        <ImpressionPortail>
          <ApercuDeFacture facture={factureAffichee} />
        </ImpressionPortail>
      )}
    </div>
  );
}

export default Facture;
