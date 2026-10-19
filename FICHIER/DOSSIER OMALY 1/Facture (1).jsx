import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import "./Facture.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import { bleu, rouge } from "../../../Simple composants/Couleurs/couleur";
import Fcelogo from "../../../Image/logo.png";
import FactureApercu from "./FactureApercu/FactureApercu";
import { useFactures } from "../../../Simple composants/Outils/useFactures";
import { formaterDate } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";
import { genererPdfFacture } from "../../../Simple composants/Outils/pdfFacture";

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

// Facture complète affichée dans la fenêtre (lecture seule : pas de Modifier / Supprimer)
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
  const [pdfEnCours, setPdfEnCours] = useState(false);

  // Les plus récentes d'abord
  const liste = [...factures].sort((a, b) =>
    a.datefacture === b.datefacture ? b.idfacture - a.idfacture : b.datefacture.localeCompare(a.datefacture)
  );

  // Deux boutons par ligne : Afficher et Imprimer
  function boutonsDeLigne(facture) {
    return [
      { texte: "Afficher", couleur: bleu, onClick: () => setFactureAffichee(facture) },
      { texte: "Imprimer", couleur: rouge, onClick: () => imprimer(facture) },
    ];
  }

  // Crée le PDF de la facture dans le front et le télécharge directement
  // (sans passer par l'impression du navigateur)
  async function imprimer(facture) {
    if (pdfEnCours) return; // création déjà en cours
    setPdfEnCours(true);
    try {
      await genererPdfFacture(facture, Fcelogo);
      toast.success("PDF téléchargé");
    } catch (erreur) {
      console.error(erreur);
      toast.error("Impossible de créer le PDF");
    }
    setPdfEnCours(false);
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
            <ApercuDeFacture
              facture={factureAffichee}
              texteAction="Imprimer"
              onAction={() => imprimer(factureAffichee)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Facture;
