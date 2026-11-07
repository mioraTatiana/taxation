import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Statistique.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import GroupeRadio from "../../../Simple composants/GroupeRadio/GroupeRadio";
import { rouge } from "../../../Simple composants/Couleurs/couleur";
import Fcelogo from "../../../Image/logo.png";
import CarteFacture from "./CarteFacture/CarteFacture";
import CarteFuneraire from "./CarteFuneraire/CarteFuneraire";
import { URL_API } from "../../../Simple composants/Outils/api";
import { grouperParDate, formaterDate, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";
import { genererPdfStatistique } from "./pdfStatistique";

// Statistiques : les factures marchandise et les factures funéraires sont bien séparées.
// Routes du backend : /statistique/marchandise, /statistique/funeraire, /statistique/totaux

const DESTINATAIRES = [
  { value: "Directeur", label: "Directeur" },
  { value: "Chef de division", label: "Chef de division" },
   { value: "Porteur", label: "Bagagiste" },
];

const OPTIONS_AFFICHAGE = [
  { value: "marchandise", label: "Marchandises" },
  { value: "funeraire", label: "Transports funéraires" },
];

const OPTIONS_IMPRESSION = [
  { value: "tous", label: "Marchandises et transports funéraires" },
  { value: "marchandise", label: "Marchandises seulement" },
  { value: "funeraire", label: "Transports funéraires seulement" },
];

// Liste "en boucle" : une date, puis les factures de cette date
function GroupesFactures({ groupes, Carte, cleId }) {
  return (
    <>
      {groupes.map((groupe) => (
        <div key={groupe.date} className="StatistiqueGroupe">
          <h3 className="StatistiqueDate">{formaterDate(groupe.date)}</h3>
          {groupe.factures.map((facture) => (
            <Carte key={facture[cleId]} facture={facture} />
          ))}
        </div>
      ))}
    </>
  );
}

// Charge les factures marchandise et funéraires d'une période
async function chargerPeriode(periode) {
  const parametres = parametresPeriode(periode);
  const [rMarchandises, rFuneraires, rTotaux] = await Promise.all([
    axios.get(`${URL_API}/statistique/marchandise${parametres}`),
    axios.get(`${URL_API}/statistique/funeraire${parametres}`),
    axios.get(`${URL_API}/statistique/totaux${parametres}`),
  ]);
  return { marchandises: rMarchandises.data, funeraires: rFuneraires.data, totaux: rTotaux.data };
}

function Statistique() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [affichage, setAffichage] = useState("marchandise");
  const [donnees, setDonnees] = useState({ marchandises: [], funeraires: [], totaux: [] });
  const [chargement, setChargement] = useState(true);

  // Fenêtre "Imprimer des statistiques"
  const [popupOuvert, setPopupOuvert] = useState(false);
  const [impression, setImpression] = useState({ destinataire: "", type: "tous", debut: "", fin: "" });
  const [pdfEnCours, setPdfEnCours] = useState(false);

  useEffect(() => {
    charger();
  }, [periode]);

  async function charger() {
    setChargement(true);
    try {
      setDonnees(await chargerPeriode(periode));
    } catch {
      toast.error("Impossible de charger les statistiques");
    }
    setChargement(false);
  }

  const groupes =
    affichage === "marchandise"
      ? grouperParDate(donnees.marchandises, "datefacturemarchandise")
      : grouperParDate(donnees.funeraires, "datefacturefuneraire");

  function ouvrirImpression() {
    // La fenêtre démarre avec la période et le type déjà choisis
    setImpression({ destinataire: "", type: "tous", debut: periode.debut, fin: periode.fin });
    setPopupOuvert(true);
  }

  // Crée le PDF dans le front et le télécharge (sans passer par l'impression du navigateur)
  async function lancerImpression() {
    if (pdfEnCours) return;
    if (!impression.destinataire) {
      toast.error("Choisissez le destinataire");
      return;
    }

    setPdfEnCours(true);
    try {
      const selection = await chargerPeriode(impression);
      const marchandises = impression.type === "funeraire" ? [] : selection.marchandises;
      const funeraires = impression.type === "marchandise" ? [] : selection.funeraires;

      if (marchandises.length === 0 && funeraires.length === 0) {
        toast.error("Aucune facture sur cette période");
      } else {
        await genererPdfStatistique(
          {
            marchandises,
            funeraires,
            destinataire: impression.destinataire,
            debut: impression.debut,
            fin: impression.fin,
          },
          Fcelogo
        );
        setPopupOuvert(false);
        toast.success("PDF téléchargé");
      }
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
        >
          Imprimer
        </button>
      </div>

      {/* Totaux de chaque transport sur la période */}
      <div className="StatistiqueTotaux">
        {donnees.totaux.map((total) => (
          <div key={total.transport} className="StatistiqueTotal">
            {total.transport} : {total.nombrefactures} facture(s)
            <strong>{formaterMontant(total.recette)} Ar</strong>
          </div>
        ))}
      </div>

      <div className="StatistiqueChoix">
        <GroupeRadio
          label="Afficher"
          name="affichage"
          options={OPTIONS_AFFICHAGE}
          value={affichage}
          onChange={setAffichage}
        />
      </div>

      {chargement && <p className="StatistiqueMessage">Chargement...</p>}
      {!chargement && groupes.length === 0 && (
        <p className="StatistiqueMessage">Aucune facture pour cette période</p>
      )}

      {affichage === "marchandise" ? (
        <GroupesFactures groupes={groupes} Carte={CarteFacture} cleId="idfacturemarchandise" />
      ) : (
        <GroupesFactures groupes={groupes} Carte={CarteFuneraire} cleId="idfacturefuneraire" />
      )}

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
          <SelectInput
            label="Factures"
            name="type"
            options={OPTIONS_IMPRESSION}
            value={impression.type}
            onChange={(valeur) => setImpression({ ...impression, type: valeur })}
          />
          <FiltreDates
            debut={impression.debut}
            fin={impression.fin}
            onChange={(dates) => setImpression({ ...impression, ...dates })}
            afficherTitre={false}
          />
        </Popup>
      )}
    </div>
  );
}

export default Statistique;
