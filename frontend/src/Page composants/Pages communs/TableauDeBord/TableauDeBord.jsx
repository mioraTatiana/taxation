import React, { useState } from "react";
import { Wallet, FileText, Scale, Package } from "lucide-react";
import "./TableauDeBord.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import CarteKpi from "../../../Simple composants/CarteKpi/CarteKpi";
import GraphiqueBarres from "../../../Simple composants/GraphiqueBarres/GraphiqueBarres";
import { useFactures } from "../../../Simple composants/Outils//useFactures";
import {
  totauxGlobaux,
  comparaisonMois,
  recetteParMois,
  sommeParCle,
  recetteDe,
  poidsDe,
} from "./calculsStats";
import { formaterMontant } from "./calculsFacture";

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
  const { toutes, factures } = useFactures(periode);

  const totaux = totauxGlobaux(factures);
  const moisCourant = comparaisonMois(toutes);

  const parMois = recetteParMois(factures);
  const parZone = sommeParCle(factures, (f) => f.zoneLibelle, recetteDe);
  const parWagon = sommeParCle(factures, (f) => f.wagon, recetteDe);
  const topClients = sommeParCle(factures, (f) => f.clientNom, recetteDe).slice(0, 5);

  // Poids par type de marchandise : on parcourt les lignes de toutes les factures
  const lignes = factures.flatMap((f) => f.details);
  const parTypeMarchandise = sommeParCle(lignes, (l) => l.libelletype, (l) => Number(l.poidsreel));

  let noteMois = "Pas de mois précédent à comparer";
  if (moisCourant.variation !== null) {
    noteMois = `${moisCourant.variation >= 0 ? "+" : ""}${moisCourant.variation} % par rapport au mois précédent`;
  }

  return (
    <div>
      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      {/* Indicateurs */}
      <div className="TableauKpis">
        <CarteKpi icone={Wallet} titre="Recette (période)" valeur={`${formaterMontant(totaux.recette)} Ar`} />
        <CarteKpi
          icone={Wallet}
          titre={`Recette de ${moisCourant.libelle}`}
          valeur={`${formaterMontant(moisCourant.recette)} Ar`}
          note={noteMois}
        />
        <CarteKpi icone={FileText} titre="Factures" valeur={formaterMontant(totaux.nombreFactures)} />
        <CarteKpi icone={Scale} titre="Poids transporté" valeur={`${formaterMontant(totaux.poids)} kg`} />
        <CarteKpi icone={Package} titre="Colis expédiés" valeur={formaterMontant(totaux.colis)} />
      </div>

      {/* Graphiques */}
      <div className="TableauBlocs">
        <Bloc titre="Recette par mois">
          <GraphiqueBarres donnees={parMois} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Recette par zone">
          <GraphiqueBarres donnees={parZone} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Recette par type de wagon">
          <GraphiqueBarres donnees={parWagon} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Top 5 des clients">
          <GraphiqueBarres donnees={topClients} format={formaterMontant} unite="Ar" />
        </Bloc>

        <Bloc titre="Poids par type de marchandise">
          <GraphiqueBarres donnees={parTypeMarchandise} format={formaterMontant} unite="kg" />
        </Bloc>
      </div>
    </div>
  );
}

export default TableauDeBord;
