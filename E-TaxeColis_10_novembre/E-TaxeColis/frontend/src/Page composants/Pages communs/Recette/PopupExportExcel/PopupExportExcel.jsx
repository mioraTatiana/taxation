import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Popup from "../../../../Simple composants/Popup/Popup";
import GroupeRadio from "../../../../Simple composants/GroupeRadio/GroupeRadio";
import SelectInput from "../../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../../Simple composants/Input/Input";
import FiltreDates from "../../../../Simple composants/FiltreDates/FiltreDates";
import { vert } from "../../../../Simple composants/Couleurs/couleur";
import { URL_API } from "../../../../Simple composants/Outils/api";
import { formaterDate } from "../../../../Simple composants/Outils/calculsStats";
import { exporterExcel } from "../../../../Simple composants/Outils/exportExcel";

// Pop up "Exporter en Excel" de la page Recette.
//  Période   : 1re décade (1 au 10), 2e décade (11 au 20), 3e décade (21 à la fin du mois)
//              pour un mois et une année ; ou une période à définir (date de début et de fin)
//  Transport : tous, marchandises, transport funéraire
//  Si marchandises : type de wagon (tous, Express, Wagon complet, Série 100, Série 400)
// Route du backend : /recette/parzone?debut=&fin=&transport=&typewagon=

const OPTIONS_PERIODE = [
  { value: "1", label: "1re décade (1 au 10)" },
  { value: "2", label: "2e décade (11 au 20)" },
  { value: "3", label: "3e décade (21 à la fin du mois)" },
  { value: "libre", label: "Période à définir" },
];

const OPTIONS_TRANSPORT = [
  { value: "tous", label: "Tous les transports" },
  { value: "marchandise", label: "Marchandises" },
  { value: "Funéraire", label: "Transport funéraire" },
];

const OPTIONS_WAGON = [
  { value: "tous", label: "Tous les wagons" },
  { value: "Express", label: "Express" },
  { value: "Wagon complet", label: "Wagon complet" },
  { value: "Série 100", label: "Série 100" },
  { value: "Série 400", label: "Série 400" },
];

const NOMS_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const OPTIONS_MOIS = NOMS_MOIS.map((nom, index) => ({ value: String(index + 1), label: nom }));

// 187.60000610351562 -> 187.6 (les poids sont des nombres réels dans la base)
function arrondir(nombre) {
  return Math.round(Number(nombre || 0) * 100) / 100;
}

// 2026, 9, "3" -> { debut: "2026-09-21", fin: "2026-09-30" }
function datesDecade(annee, mois, decade) {
  const mm = String(mois).padStart(2, "0");
  const dernierJour = new Date(annee, mois, 0).getDate(); // 28, 29, 30 ou 31
  if (decade === "1") return { debut: `${annee}-${mm}-01`, fin: `${annee}-${mm}-10` };
  if (decade === "2") return { debut: `${annee}-${mm}-11`, fin: `${annee}-${mm}-20` };
  return { debut: `${annee}-${mm}-21`, fin: `${annee}-${mm}-${dernierJour}` };
}

function PopupExportExcel({ onFermer }) {
  const maintenant = new Date();
  const [choix, setChoix] = useState({
    periode: "1",
    mois: String(maintenant.getMonth() + 1),
    annee: String(maintenant.getFullYear()),
    dates: { debut: "", fin: "" },
    transport: "tous",
    wagon: "tous",
  });
  const [enCours, setEnCours] = useState(false);

  function changer(champ, valeur) {
    setChoix((ancien) => ({ ...ancien, [champ]: valeur }));
  }

  async function exporter() {
    if (enCours) return;

    // ----- Période -----
    let dates;
    let libellePeriode;
    if (choix.periode === "libre") {
      if (!choix.dates.debut) {
        toast.error("Choisissez la date de début et la date de fin");
        return;
      }
      dates = { debut: choix.dates.debut, fin: choix.dates.fin || choix.dates.debut };
      libellePeriode = `du ${formaterDate(dates.debut)} au ${formaterDate(dates.fin)}`;
    } else {
      const annee = Number(choix.annee);
      if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) {
        toast.error("Saisissez une année valide");
        return;
      }
      dates = datesDecade(annee, Number(choix.mois), choix.periode);
      libellePeriode = `${OPTIONS_PERIODE.find((o) => o.value === choix.periode).label} ${NOMS_MOIS[choix.mois - 1]} ${annee}`;
    }

    // ----- Transport et type de wagon -> paramètres du backend -----
    const parametres = new URLSearchParams({ debut: dates.debut, fin: dates.fin });
    if (choix.transport === "Funéraire") {
      parametres.append("transport", "Funéraire");
    } else if (choix.transport === "marchandise") {
      if (choix.wagon === "Wagon complet") parametres.append("transport", "Wagon complet");
      else parametres.append("transport", "marchandise");
      if (choix.wagon !== "tous" && choix.wagon !== "Wagon complet") parametres.append("typewagon", choix.wagon);
    }

    setEnCours(true);
    try {
      const reponse = await axios.get(`${URL_API}/recette/parzone?${parametres.toString()}`);
      const lignes = reponse.data;
      if (lignes.length === 0) {
        toast.error("Aucune recette pour ces choix");
        setEnCours(false);
        return;
      }

      const lignesExcel = [...lignes]
        .sort((a, b) => a.datefacture.localeCompare(b.datefacture))
        .map((ligne) => ({
          Date: formaterDate(ligne.datefacture),
          Transport: ligne.transport,
          "Type de wagon": ligne.typewagon || "-",
          Zone: ligne.libellezone,
          "Nombre de factures": ligne.nombrefactures,
          "Recette (Ar)": arrondir(ligne.recette),
          "Poids transporté (kg)": arrondir(ligne.poids),
        }));
      lignesExcel.push({
        Date: "TOTAL",
        Transport: "",
        "Type de wagon": "",
        Zone: "",
        "Nombre de factures": lignes.reduce((t, l) => t + l.nombrefactures, 0),
        "Recette (Ar)": arrondir(lignes.reduce((t, l) => t + l.recette, 0)),
        "Poids transporté (kg)": arrondir(lignes.reduce((t, l) => t + l.poids, 0)),
      });

      const nomTransport =
        choix.transport === "marchandise" ? (choix.wagon === "tous" ? "marchandises" : choix.wagon) : choix.transport;
      const nomFichier = `recettes_${nomTransport}_${dates.debut}_${dates.fin}.xlsx`.replace(/\s/g, "-");
      exporterExcel(lignesExcel, "Recettes", nomFichier);
      toast.success(`Fichier Excel téléchargé (${libellePeriode})`);
      onFermer();
    } catch {
      toast.error("Impossible de charger les recettes");
    }
    setEnCours(false);
  }

  return (
    <Popup
      titre="Exporter en Excel"
      texteConfirmer={enCours ? "Export..." : "Exporter"}
      couleur={vert}
      onConfirmer={exporter}
      onFermer={onFermer}
    >
      <GroupeRadio label="Période" name="periode" options={OPTIONS_PERIODE} value={choix.periode} onChange={(v) => changer("periode", v)} />

      {choix.periode === "libre" ? (
        <FiltreDates debut={choix.dates.debut} fin={choix.dates.fin} onChange={(d) => changer("dates", d)} afficherTitre={false} />
      ) : (
        <>
          <SelectInput label="Mois" name="mois" options={OPTIONS_MOIS} value={choix.mois} onChange={(v) => changer("mois", v)} />
          <CustomInput type="number" label="Année" name="annee" value={choix.annee} onChange={(e) => changer("annee", e.target.value)} />
        </>
      )}

      <GroupeRadio label="Transport" name="transportExport" options={OPTIONS_TRANSPORT} value={choix.transport} onChange={(v) => changer("transport", v)} />

      {choix.transport === "marchandise" && (
        <GroupeRadio label="Type de wagon" name="wagonExport" options={OPTIONS_WAGON} value={choix.wagon} onChange={(v) => changer("wagon", v)} />
      )}
    </Popup>
  );
}

export default PopupExportExcel;
