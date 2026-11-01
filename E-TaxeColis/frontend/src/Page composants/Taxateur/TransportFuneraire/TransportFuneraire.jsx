import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import "./TransportFuneraire.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import { bleu, rouge } from "../../../Simple composants/Couleurs/couleur";
import ApercuFuneraire from "./ApercuFuneraire/ApercuFuneraire";
import { URL_API } from "../../../Simple composants/Outils/api";
import { formaterDate, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";
import { genererPdfFuneraire } from "../../../Simple composants/Outils/pdfFacture";
import Fcelogo from "../../../Image/logo.png";

// Factures des transports funéraires : même structure que la page Facture (marchandises).
// Route du backend : /facturefuneraire/selectionnertout?debut=...&fin=...
// (chaque facture arrive avec le nom du client et le nom de la destination)

const COLONNES = [
  { titre: "Numéro", cle: "numfacturefuneraire" },
  { titre: "Date", cle: "datefacturefuneraire", afficher: formaterDate },
  { titre: "Client", cle: "nomclient" },
  { titre: "Défunt", cle: "nomdefunt" },
  { titre: "Destination", cle: "nomdestination" },
  { titre: "Montant HT", cle: "montanthttfuneraire", afficher: formaterMontant },
  { titre: "Piquire", cle: "piquirefuneraire", afficher: formaterMontant },
  { titre: "Total TTC", cle: "montantttcfunerare", afficher: (valeur) => `${formaterMontant(valeur)} Ar` },
];

function TransportFuneraire() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [factureAffichee, setFactureAffichee] = useState(null);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  useEffect(() => {
    chargerFactures();
  }, [periode]);

  async function chargerFactures() {
    setChargement(true);
    try {
      const reponse = await axios.get(`${URL_API}/facturefuneraire/selectionnertout${parametresPeriode(periode)}`);
      setFactures(reponse.data);
    } catch {
      toast.error("Impossible de charger les factures funéraires");
    }
    setChargement(false);
  }

  function boutonsDeLigne(facture) {
    return [
      { texte: "Afficher", couleur: bleu, onClick: () => setFactureAffichee(facture) },
      { texte: "Imprimer", couleur: rouge, onClick: () => imprimer(facture) },
    ];
  }

  async function imprimer(facture) {
    if (pdfEnCours) return;
    setPdfEnCours(true);
    try {
      await genererPdfFuneraire(facture, Fcelogo);
      toast.success("PDF téléchargé");
    } catch (erreur) {
      console.error(erreur);
      toast.error("Impossible de créer le PDF");
    }
    setPdfEnCours(false);
  }

  return (
    <div>
      <h2 className="TransportTitre">Factures des transports funéraires</h2>

      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      <div className="TransportTableauZone">
        <TableDonnees
          colonnes={COLONNES}
          donnees={factures}
          cleLigne="idfacturefuneraire"
          actions={boutonsDeLigne}
          messageVide={chargement ? "Chargement..." : "Aucune facture funéraire"}
        />
      </div>

      {factureAffichee && (
        <div className="TransportFenetreFond" onClick={() => setFactureAffichee(null)}>
          <div className="TransportFenetre" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="TransportFenetreFermer"
              onClick={() => setFactureAffichee(null)}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <ApercuFuneraire
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

export default TransportFuneraire;
