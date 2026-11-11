import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Statistique.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import GroupeRadio from "../../../Simple composants/GroupeRadio/GroupeRadio";
import CustomInput from "../../../Simple composants/Input/Input";
import { rouge, bleu } from "../../../Simple composants/Couleurs/couleur";
import Fcelogo from "../../../Image/logo.png";
import CarteFacture from "./CarteFacture/CarteFacture";
import CarteFuneraire from "./CarteFuneraire/CarteFuneraire";
import PopupModifierFacture from "./PopupModifierFacture/PopupModifierFacture";
import { URL_API, utilisateurConnecte } from "../../../Simple composants/Outils/api";
import { aLeRole } from "../../../Simple composants/Layout/menus";
import { grouperParDate, formaterDate, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";
import { genererPdfBordereau } from "./pdfBordereau";
import { genererPdfStatistiqueMensuelle, NOMS_MOIS } from "./pdfStatistiqueMensuelle";

// Statistiques : les factures marchandise et les factures funéraires sont bien séparées.
// Routes du backend : /statistique/marchandise, /statistique/funeraire, /statistique/totaux,
//                     /statistique/mensuelle (bouton "Statistique en PDF")
// Boutons :
//  "Statistique en PDF" : fiche mensuelle (mois + année), Express, gare de Fianarantsoa
//  "Bordereau en PDF"   : factures rangées par zone > destination > transport > client > facture
// Chef de division et receveur : bouton "Modifier" sur chaque facture marchandise.

// Le bagagiste ne voit pas les montants ; les autres destinataires les voient
const DESTINATAIRES = [
  { value: "Directeur", label: "Directeur" },
  { value: "Bagagiste", label: "Bagagiste (sans les montants)" },
  { value: "Chef de division", label: "Chef de division" },
  { value: "Receveur", label: "Receveur" },
];

const OPTIONS_MOIS = NOMS_MOIS.map((nom, index) => ({ value: String(index + 1), label: nom }));

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
function GroupesFactures({ groupes, Carte, cleId, onModifier }) {
  return (
    <>
      {groupes.map((groupe) => (
        <div key={groupe.date} className="StatistiqueGroupe">
          <h3 className="StatistiqueDate">{formaterDate(groupe.date)}</h3>
          {groupe.factures.map((facture) => (
            <Carte key={facture[cleId]} facture={facture} onModifier={onModifier} />
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

  // Fenêtre "Bordereau en PDF"
  const [popupOuvert, setPopupOuvert] = useState(false);
  const [impression, setImpression] = useState({ destinataire: "", type: "tous", wagon: "tous", debut: "", fin: "" });
  const [pdfEnCours, setPdfEnCours] = useState(false);
  const [typesWagon, setTypesWagon] = useState([]);

  // Fenêtre "Statistique en PDF" (mois et année, le mois en cours par défaut)
  const [popupMensuel, setPopupMensuel] = useState(false);
  const [mensuel, setMensuel] = useState({ mois: "", annee: "" });

  // Facture en cours de modification (chef de division et receveur)
  const [factureModifiee, setFactureModifiee] = useState(null);
  const peutModifier = aLeRole(utilisateurConnecte(), "chef_division", "receveur");

  useEffect(() => {
    charger();
  }, [periode]);

  useEffect(() => {
    axios
      .get(`${URL_API}/typewagon/selectionnertout`)
      .then((reponse) => setTypesWagon(reponse.data))
      .catch(() => setTypesWagon([]));
  }, []);

  const optionsWagon = [
    { value: "tous", label: "Tous les wagons" },
    ...typesWagon.map((t) => ({ value: t.libelletypewagon, label: t.libelletypewagon })),
  ];

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
    // La fenêtre démarre avec la période déjà choisie
    setImpression({ destinataire: "", type: "tous", wagon: "tous", debut: periode.debut, fin: periode.fin });
    setPopupOuvert(true);
  }

  // Bordereau : crée le PDF dans le front et le télécharge
  async function lancerImpression() {
    if (pdfEnCours) return;
    if (!impression.destinataire) {
      toast.error("Choisissez le destinataire");
      return;
    }

    setPdfEnCours(true);
    try {
      const selection = await chargerPeriode(impression);
      // Le choix du wagon ne concerne que les marchandises ; un wagon choisi = pas de funéraire
      const marchandises =
        impression.type === "funeraire"
          ? []
          : selection.marchandises.filter((f) => impression.wagon === "tous" || f.libelletypewagon === impression.wagon);
      const funeraires = impression.type === "marchandise" || impression.wagon !== "tous" ? [] : selection.funeraires;

      if (marchandises.length === 0 && funeraires.length === 0) {
        toast.error("Aucune facture sur cette période");
      } else {
        await genererPdfBordereau(
          {
            marchandises,
            funeraires,
            destinataire: impression.destinataire,
            typeFactures:
              impression.type !== "funeraire" && impression.wagon !== "tous"
                ? "Marchandises seulement"
                : OPTIONS_IMPRESSION.find((o) => o.value === impression.type).label,
            wagon: impression.type === "funeraire" ? "-" : optionsWagon.find((o) => o.value === impression.wagon)?.label,
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

  function ouvrirMensuel() {
    const maintenant = new Date();
    setMensuel({ mois: String(maintenant.getMonth() + 1), annee: String(maintenant.getFullYear()) });
    setPopupMensuel(true);
  }

  // Statistique mensuelle (fiche "Statistiques voyageurs et marchandises")
  async function lancerMensuel() {
    if (pdfEnCours) return;
    const annee = Number(mensuel.annee);
    if (!mensuel.mois || !Number.isInteger(annee) || annee < 2000 || annee > 2100) {
      toast.error("Choisissez un mois et une année valides");
      return;
    }
    setPdfEnCours(true);
    try {
      const reponse = await axios.get(`${URL_API}/statistique/mensuelle?mois=${mensuel.mois}&annee=${annee}`);
      await genererPdfStatistiqueMensuelle(reponse.data, Fcelogo);
      setPopupMensuel(false);
      toast.success("PDF téléchargé");
    } catch (erreur) {
      console.error(erreur);
      toast.error("Impossible de créer la statistique");
    }
    setPdfEnCours(false);
  }

  // Facture modifiée : on recharge la page (cartes et totaux)
  function apresModification() {
    setFactureModifiee(null);
    charger();
  }

  return (
    <div>
      <div className="StatistiqueFiltre">
        <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

        <div className="StatistiqueBoutons">
          <button type="button" className="StatistiqueImprimer" style={{ backgroundColor: bleu }} onClick={ouvrirMensuel}>
            Statistique en PDF
          </button>
          <button type="button" className="StatistiqueImprimer" style={{ backgroundColor: rouge }} onClick={ouvrirImpression}>
            Bordereau en PDF
          </button>
        </div>
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
        <GroupesFactures
          groupes={groupes}
          Carte={CarteFacture}
          cleId="idfacturemarchandise"
          onModifier={peutModifier ? setFactureModifiee : undefined}
        />
      ) : (
        <GroupesFactures groupes={groupes} Carte={CarteFuneraire} cleId="idfacturefuneraire" />
      )}

      {/* Fenêtre "Bordereau en PDF" */}
      {popupOuvert && (
        <Popup
          titre="Bordereau en PDF"
          texteConfirmer={pdfEnCours ? "Création du PDF..." : "Créer le PDF"}
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
          {impression.type !== "funeraire" && (
            <SelectInput
              label="Wagon"
              name="wagon"
              options={optionsWagon}
              value={impression.wagon}
              onChange={(valeur) => setImpression({ ...impression, wagon: valeur })}
            />
          )}
          <FiltreDates
            debut={impression.debut}
            fin={impression.fin}
            onChange={(dates) => setImpression({ ...impression, ...dates })}
            afficherTitre={false}
          />
        </Popup>
      )}

      {/* Fenêtre "Statistique en PDF" : mois et année (le mois en cours par défaut) */}
      {popupMensuel && (
        <Popup
          titre="Statistique en PDF"
          texteConfirmer={pdfEnCours ? "Création du PDF..." : "Créer le PDF"}
          couleur={bleu}
          onConfirmer={lancerMensuel}
          onFermer={() => setPopupMensuel(false)}
        >
          <p className="StatistiqueNote">Statistique du mois, gare de Fianarantsoa, factures Express seulement.</p>
          <SelectInput
            label="Mois"
            name="mois"
            options={OPTIONS_MOIS}
            value={mensuel.mois}
            onChange={(valeur) => setMensuel({ ...mensuel, mois: valeur })}
          />
          <CustomInput
            type="number"
            label="Année"
            name="annee"
            value={mensuel.annee}
            onChange={(e) => setMensuel({ ...mensuel, annee: e.target.value })}
          />
        </Popup>
      )}

      {/* Modifier les lignes d'une facture (chef de division et receveur) */}
      {factureModifiee && (
        <PopupModifierFacture
          facture={factureModifiee}
          onEnregistre={apresModification}
          onFermer={() => setFactureModifiee(null)}
        />
      )}
    </div>
  );
}

export default Statistique;
