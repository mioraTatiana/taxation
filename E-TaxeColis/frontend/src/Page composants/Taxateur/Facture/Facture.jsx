import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import "./Facture.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import { bleu, rouge } from "../../../Simple composants/Couleurs/couleur";
import FactureApercu from "./FactureApercu/FactureApercu";
import { URL_API } from "../../../Simple composants/Outils/api";
import { formaterDate, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";
import { genererPdfFacture } from "../../../Simple composants/Outils/pdfFacture";
import Fcelogo from "../../../Image/logo.png";

// Route du backend : /facturemarchandise/complet/selectionnertout?debut=...&fin=...
// (chaque facture arrive avec le nom du client, la destination, la zone, le wagon et ses lignes)

const COLONNES = [
  { titre: "Numéro", cle: "numfacturemarchandise" },
  { titre: "Date", cle: "datefacturemarchandise", afficher: formaterDate },
  { titre: "Client", cle: "nomclient" },
  { titre: "Destination", cle: "nomdestination" },
  { titre: "Wagon", cle: "libelletypewagon" },
  { titre: "Colis", cle: "nombrecolistotal", afficher: formaterMontant },
  { titre: "Poids réel", cle: "poidsreeltotal", afficher: (valeur) => `${formaterMontant(valeur)} kg` },
  { titre: "Poids facturé", cle: "poidsfacturetotal", afficher: (valeur) => `${formaterMontant(valeur)} kg` },
  { titre: "Total HT", cle: "montanthttotal", afficher: formaterMontant },
  { titre: "TVA", cle: "tva", afficher: formaterMontant },
  { titre: "Piquire", cle: "piquiremarchandise", afficher: formaterMontant },
  { titre: "Total TTC", cle: "montantttc", afficher: (valeur) => `${formaterMontant(valeur)} Ar` },
];

function Facture() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [factureAffichee, setFactureAffichee] = useState(null);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  // On recharge les factures à chaque changement de période (le backend filtre les dates)
  useEffect(() => {
    chargerFactures();
  }, [periode]);

  async function chargerFactures() {
    setChargement(true);
    try {
      const reponse = await axios.get(
        `${URL_API}/facturemarchandise/complet/selectionnertout${parametresPeriode(periode)}`
      );
      setFactures(reponse.data);
    } catch {
      toast.error("Impossible de charger les factures");
    }
    setChargement(false);
  }

  // Deux boutons par ligne : Afficher et Imprimer
  function boutonsDeLigne(facture) {
    return [
      { texte: "Afficher", couleur: bleu, onClick: () => setFactureAffichee(facture) },
      { texte: "Imprimer", couleur: rouge, onClick: () => imprimer(facture) },
    ];
  }

  // Crée le PDF de la facture dans le front et le télécharge directement
  async function imprimer(facture) {
    if (pdfEnCours) return;
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
      <h2 className="FactureTitre">Factures des marchandises</h2>

      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      <div className="FactureTableauZone">
        <TableDonnees
          colonnes={COLONNES}
          donnees={factures}
          cleLigne="idfacturemarchandise"
          actions={boutonsDeLigne}
          messageVide={chargement ? "Chargement..." : "Aucune facture"}
        />
      </div>

      {/* Fenêtre qui affiche la facture (lecture seule) */}
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
            <FactureApercu
              facture={factureAffichee}
              texteAction="Imprimer"
              onAction={() => imprimer(factureAffichee)}
              actionDesactivee={pdfEnCours}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Facture;
