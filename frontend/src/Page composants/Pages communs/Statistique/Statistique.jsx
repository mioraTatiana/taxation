import React, { useState } from "react";
import toast from "react-hot-toast";
import "./Statistique.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { rouge } from "../../../Simple composants/Couleurs/couleur";
import Fcelogo from "../../../Image/logo.png";
import CarteFacture from "./CarteFacture/CarteFacture";
import { useFactures } from "../../../Simple composants/Outils/useFactures";
import { grouperParDate, filtrerParDates, formaterDate, recetteDe } from "../../../Simple composants/Outils/calculsStats";
import { genererPdfStatistique } from "./pdfStatistique";

const DESTINATAIRES = [
  { value: "Directeur", label: "Directeur" },
  { value: "Porter", label: "Porter" },
  { value: "Chef de division", label: "Chef de division" },
];

// Liste "en boucle" : une date, puis les factures de cette date
function GroupesFactures({ groupes }) {
  return (
    <>
      {groupes.map((groupe) => (
        <div key={groupe.date} className="StatistiqueGroupe">
          <h3 className="StatistiqueDate">{formaterDate(groupe.date)}</h3>
          {groupe.factures.map((facture) => (
            <CarteFacture key={facture.idfacture} facture={facture} />
          ))}
        </div>
      ))}
    </>
  );
}

function Statistique() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const { toutes, factures, chargement } = useFactures(periode);

  // Fenêtre "Imprimer des statistiques"
  const [popupOuvert, setPopupOuvert] = useState(false);
  const [impression, setImpression] = useState({ destinataire: "", debut: "", fin: "" });
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const groupes = grouperParDate(factures);

  function ouvrirImpression() {
    // La fenêtre démarre avec la période déjà choisie dans le filtre
    setImpression({ destinataire: "", debut: periode.debut, fin: periode.fin });
    setPopupOuvert(true);
  }

  // Crée le PDF dans le front et le télécharge (sans passer par l'impression du navigateur)
  async function lancerImpression() {
    if (pdfEnCours) return;

    if (!impression.destinataire) {
      toast.error("Choisissez le destinataire");
      return;
    }
    const selection = filtrerParDates(toutes, impression.debut, impression.fin);
    if (selection.length === 0) {
      toast.error("Aucune facture sur cette période");
      return;
    }

    setPdfEnCours(true);
    try {
      await genererPdfStatistique(
        {
          factures: selection,
          destinataire: impression.destinataire,
          debut: impression.debut,
          fin: impression.fin,
        },
        Fcelogo
      );
      setPopupOuvert(false);
      toast.success("PDF téléchargé");
    } catch (erreur) {
      console.error(erreur);
      toast.error("Impossible de créer le PDF");
    }
    setPdfEnCours(false);
  }

  return (
    <div>
      <div className="StatistiqueFiltre">
        <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

        <button
          type="button"
          className="StatistiqueImprimer"
          style={{ backgroundColor: rouge }}
          onClick={ouvrirImpression}
          disabled={toutes.length === 0}
        >
          Imprimer
        </button>
      </div>

      {chargement && <p className="StatistiqueMessage">Chargement...</p>}
      {!chargement && groupes.length === 0 && (
        <p className="StatistiqueMessage">Aucune facture pour cette période</p>
      )}

      <GroupesFactures groupes={groupes} />

      {/* Fenêtre "Imprimer des statistiques" */}
      {popupOuvert && (
        <Popup
          titre="Imprimer des statistiques"
          texteConfirmer={pdfEnCours ? "Création du PDF..." : "Imprimer"}
          couleur={rouge}
          onConfirmer={lancerImpression}
          onFermer={() => setPopupOuvert(false)}
        >
          <SelectInput
            label="Destiné"
            name="destinataire"
            options={DESTINATAIRES}
            value={impression.destinataire}
            onChange={(valeur) => setImpression({ ...impression, destinataire: valeur })}
            placeholder="Sélectionner un destinataire"
            searchPlaceholder="Rechercher..."
          />
          <FiltreDates
            debut={impression.debut}
            fin={impression.fin}
            onChange={(dates) => setImpression({ ...impression, ...dates })}
            afficherTitre={false}
            vertical
          />
        </Popup>
      )}
    </div>
  );
}

export default Statistique;
