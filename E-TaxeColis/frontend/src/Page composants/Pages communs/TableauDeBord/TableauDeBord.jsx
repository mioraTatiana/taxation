import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Wallet, FileText, Scale, Package, Flower2, Truck } from "lucide-react";
import "./TableauDeBord.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import CarteKpi from "../../../Simple composants/CarteKpi/CarteKpi";
import GraphiqueBarres from "../../../Simple composants/GraphiqueBarres/GraphiqueBarres";
import { URL_API } from "../../../Simple composants/Outils/api";
import { libelleMois, libellesDeMois, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";

// Tableau de bord : marchandises ET transports funéraires.
// Routes du backend : Route/Direction/tableaudebord.js

const TOTAUX_VIDES = {
  nombrefactures: 0,
  recette: 0,
  poids: 0,
  colis: 0,
  nombremarchandise: 0,
  nombrefuneraire: 0,
  recettemarchandise: 0,
  recettefuneraire: 0,
};

const DONNEES_VIDES = {
  totaux: TOTAUX_VIDES,
  moiscourant: { moiscourant: 0, moisprecedent: 0, funerairemoiscourant: 0 },
  parmois: [],
  partransport: [],
  parzone: [],
  topclients: [],
  parmarchandise: [],
};

// Un bloc du tableau de bord : titre + contenu
function Bloc({ titre, children }) {
  return (
    <div className="TableauBloc">
      <h3 className="TableauBlocTitre">{titre}</h3>
      {children}
    </div>
  );
}

function TableauDeBord() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [donnees, setDonnees] = useState(DONNEES_VIDES);

  useEffect(() => {
    chargerDonnees();
  }, [periode]);

  async function chargerDonnees() {
    const parametres = parametresPeriode(periode);
    const routes = Object.keys(DONNEES_VIDES); // totaux, moiscourant, parmois, ...

    try {
      const reponses = await Promise.all(
        routes.map((route) =>
          // Le mois en cours ne dépend pas de la période choisie
          axios.get(`${URL_API}/tableaudebord/${route}${route === "moiscourant" ? "" : parametres}`)
        )
      );
      const resultat = {};
      routes.forEach((route, index) => {
        resultat[route] = reponses[index].data;
      });
      setDonnees(resultat);
    } catch {
      toast.error("Impossible de charger le tableau de bord");
    }
  }

  const { totaux, moiscourant } = donnees;

  // Variation du mois en cours par rapport au mois précédent
  let noteMois = "Pas de mois précédent à comparer";
  if (moiscourant.moisprecedent > 0) {
    const variation = Math.round(
      ((moiscourant.moiscourant - moiscourant.moisprecedent) / moiscourant.moisprecedent) * 100
    );
    noteMois = `${variation >= 0 ? "+" : ""}${variation} % par rapport au mois précédent`;
  }

  const date = new Date();
  const cleMoisCourant = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      {/* Indicateurs */}
      <div className="TableauKpis">
        <CarteKpi
          icone={Wallet}
          titre="Recette totale (période)"
          valeur={`${formaterMontant(totaux.recette)} Ar`}
        />
        <CarteKpi
          icone={Truck}
          titre="Recette des marchandises"
          valeur={`${formaterMontant(totaux.recettemarchandise)} Ar`}
          note={`${formaterMontant(totaux.nombremarchandise)} facture(s)`}
        />
        <CarteKpi
          icone={Flower2}
          titre="Recette des transports funéraires"
          valeur={`${formaterMontant(totaux.recettefuneraire)} Ar`}
          note={`${formaterMontant(totaux.nombrefuneraire)} facture(s)`}
        />
        <CarteKpi
          icone={Wallet}
          titre={`Recette de ${libelleMois(cleMoisCourant)}`}
          valeur={`${formaterMontant(moiscourant.moiscourant)} Ar`}
          note={`${noteMois} — dont funéraire : ${formaterMontant(moiscourant.funerairemoiscourant)} Ar`}
        />
        <CarteKpi icone={FileText} titre="Factures" valeur={formaterMontant(totaux.nombrefactures)} />
        <CarteKpi icone={Scale} titre="Poids transporté" valeur={`${formaterMontant(totaux.poids)} kg`} />
        <CarteKpi icone={Package} titre="Colis expédiés" valeur={formaterMontant(totaux.colis)} />
      </div>

      {/* Graphiques */}
      <div className="TableauBlocs">
        <Bloc titre="Recette par mois">
          <GraphiqueBarres donnees={libellesDeMois(donnees.parmois)} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Recette par transport (Express, Wagon complet, Funéraire)">
          <GraphiqueBarres donnees={donnees.partransport} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Recette par zone">
          <GraphiqueBarres donnees={donnees.parzone} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Top 5 des clients">
          <GraphiqueBarres donnees={donnees.topclients} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Poids par type de marchandise">
          <GraphiqueBarres donnees={donnees.parmarchandise} format={formaterMontant} unite="kg" />
        </Bloc>
      </div>
    </div>
  );
}

export default TableauDeBord;
