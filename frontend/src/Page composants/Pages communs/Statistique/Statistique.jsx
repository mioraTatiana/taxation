import React, { useState } from "react";
import toast from "react-hot-toast";
import "./Statistique.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import ImpressionPortail from "../../../Simple composants/ImpressionPortail/ImpressionPortail";
import { rouge } from "../../../Simple composants/Couleurs/couleur";
import Fcelogo from "../../../Image/logo.png";
import CarteFacture from "./CarteFacture/CarteFacture";
import { useFactures } from "../../../Simple composants/Outils/useFactures";
import { grouperParDate, filtrerParDates, formaterDate, recetteDe } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";

// Valeurs du select "Destiné" (maquette de la fenêtre d'impression)
const DESTINATAIRES = [
  { value: "Directeur", label: "Directeur" },
  { value: "Porter", label: "Porter" },
  { value: "Chef de division", label: "Chef de division" },
];

function attendre(millisecondes) {
  return new Promise((resolve) => setTimeout(resolve, millisecondes));
}

function texteDePeriode(debut, fin) {
  if (!debut) return "Toutes les dates";
  if (debut === fin) return `Le ${formaterDate(debut)}`;
  return `Du ${formaterDate(debut)} au ${formaterDate(fin)}`;
}

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

  // Fenêtre d'impression
  const [popupOuvert, setPopupOuvert] = useState(false);
  const [impression, setImpression] = useState({ destinataire: "", debut: "", fin: "" });
  const [aImprimer, setAImprimer] = useState(null); // { factures, destinataire, debut, fin }

  const groupes = grouperParDate(factures);

  function ouvrirImpression() {
    // La fenêtre démarre avec la période déjà choisie dans le filtre
    setImpression({ destinataire: "", debut: periode.debut, fin: periode.fin });
    setPopupOuvert(true);
  }

  async function lancerImpression() {
    if (!impression.destinataire) {
      toast.error("Choisissez le destinataire");
      return;
    }
    const selection = filtrerParDates(toutes, impression.debut, impression.fin);
    if (selection.length === 0) {
      toast.error("Aucune facture sur cette période");
      return;
    }

    setPopupOuvert(false);
    setAImprimer({ ...impression, factures: selection });
    await attendre(300); // laisse l'écran préparer le contenu à imprimer
    window.print(); // dans la fenêtre d'impression : "Enregistrer au format PDF"
    setAImprimer(null);
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
          texteConfirmer="Imprimer"
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

      {/* Contenu imprimé : invisible à l'écran, seul visible à l'impression */}
      {aImprimer && (
        <ImpressionPortail>
          <div className="StatistiqueImpression">
            <div className="StatistiqueImpressionEntete">
              <img src={Fcelogo} alt="FCE" />
              <div>
                <h2>Statistiques des factures</h2>
                <p>Destiné à : <strong>{aImprimer.destinataire}</strong></p>
                <p>Période : {texteDePeriode(aImprimer.debut, aImprimer.fin)}</p>
                <p>Édité le {new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            <GroupesFactures groupes={grouperParDate(aImprimer.factures)} />

            <p className="StatistiqueImpressionTotal">
              {aImprimer.factures.length} facture(s) – Total TTC :{" "}
              {formaterMontant(aImprimer.factures.reduce((total, f) => total + recetteDe(f), 0))} Ar
            </p>
          </div>
        </ImpressionPortail>
      )}
    </div>
  );
}

export default Statistique;
