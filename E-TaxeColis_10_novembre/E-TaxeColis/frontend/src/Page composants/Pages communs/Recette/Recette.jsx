import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Recette.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { vert } from "../../../Simple composants/Couleurs/couleur";
import { URL_API } from "../../../Simple composants/Outils/api";
import { grouperRecettes, formaterDate, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";
import PopupExportExcel from "./PopupExportExcel/PopupExportExcel";

// Recettes des marchandises (Express, Wagon complet) ET des transports funéraires.
// Route du backend : /recette/parzone?debut=...&fin=...&transport=...
// Bouton "Exporter en Excel" : pop up PopupExportExcel (décades, transport, type de wagon)
// Une facture funéraire a un poids de 0.

const OPTIONS_TRANSPORT = [
  { value: "tous", label: "Tous les transports" },
  { value: "Express", label: "Express" },
  { value: "Wagon complet", label: "Wagon complet" },
  { value: "Funéraire", label: "Transport funéraire" },
];

// Une ligne : libellé, recette, poids
function LigneRecette({ classe, libelle, recette, poids }) {
  return (
    <div className={`RecetteLigne ${classe}`}>
      <span className="RecetteColLibelle">{libelle}</span>
      <span className="RecetteColValeur">{formaterMontant(recette)} Ar</span>
      <span className="RecetteColValeur">{formaterMontant(poids)} kg</span>
    </div>
  );
}

function Recette() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [transport, setTransport] = useState("tous");
  const [lignes, setLignes] = useState([]); // [{ datefacture, transport, libellezone, nombrefactures, recette, poids }]
  const [chargement, setChargement] = useState(true);
  const [popupExport, setPopupExport] = useState(false); // pop up "Exporter en Excel"

  // On recharge à chaque changement de période ou de transport (le backend filtre)
  useEffect(() => {
    chargerRecettes();
  }, [periode, transport]);

  async function chargerRecettes() {
    setChargement(true);
    try {
      const parametres = parametresPeriode(periode);
      const separateur = parametres ? "&" : "?";
      const reponse = await axios.get(
        `${URL_API}/recette/parzone${parametres}${separateur}transport=${encodeURIComponent(transport)}`
      );
      setLignes(reponse.data);
    } catch {
      toast.error("Impossible de charger les recettes");
    }
    setChargement(false);
  }

  // mois -> jours -> transports -> zones, avec la recette et le poids à chaque niveau
  const mois = grouperRecettes(lignes);

  return (
    <div>
      <div className="RecetteFiltres">
        <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

        <div className="RecetteTransport">
          <SelectInput
            label="Transport"
            name="transport"
            options={OPTIONS_TRANSPORT}
            value={transport}
            onChange={setTransport}
            placeholder="Tous les transports"
          />
        </div>

        <button
          type="button"
          className="RecetteExporter"
          style={{ backgroundColor: vert }}
          onClick={() => setPopupExport(true)}
        >
          Exporter en Excel
        </button>
      </div>

      {chargement && <p className="RecetteMessage">Chargement...</p>}
      {!chargement && mois.length === 0 && (
        <p className="RecetteMessage">Aucune recette pour cette période</p>
      )}

      {mois.length > 0 && (
        <div className="RecetteEnteteColonnes">
          <span className="RecetteColLibelle" />
          <span className="RecetteColValeur">Recette</span>
          <span className="RecetteColValeur">Poids transporté</span>
        </div>
      )}

      {/* Pop up : décade ou période, transport, type de wagon */}
      {popupExport && <PopupExportExcel onFermer={() => setPopupExport(false)} />}

      {mois.map((m) => (
        <div key={m.cle} className="RecetteMois">
          {/* Mois : total de la recette et du poids */}
          <LigneRecette classe="RecetteLigneMois" libelle={m.libelle} recette={m.recette} poids={m.poids} />

          {m.jours.map((jour) => (
            <div key={jour.date} className="RecetteJour">
              {/* Date : total du jour */}
              <LigneRecette
                classe="RecetteLigneJour"
                libelle={formaterDate(jour.date)}
                recette={jour.recette}
                poids={jour.poids}
              />

              {/* Transport : Express, Wagon complet, Funéraire */}
              {jour.transports.map((t) => (
                <div key={t.transport}>
                  <LigneRecette classe="RecetteLigneTransport" libelle={t.transport} recette={t.recette} poids={t.poids} />

                  {/* Zones : recette et poids de chaque zone, pour ce transport */}
                  {t.zones.map((zone) => (
                    <LigneRecette
                      key={zone.zone}
                      classe="RecetteLigneZone"
                      libelle={zone.zone}
                      recette={zone.recette}
                      poids={zone.poids}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Recette;
