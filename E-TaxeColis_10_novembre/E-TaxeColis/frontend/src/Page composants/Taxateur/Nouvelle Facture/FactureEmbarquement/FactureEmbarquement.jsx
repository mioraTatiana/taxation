import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { Truck } from "lucide-react";
import "./FactureEmbarquement.css";
import SelectInput from "../../../../Simple composants/SelectInput/SelectInput";
import GroupeRadio from "../../../../Simple composants/GroupeRadio/GroupeRadio";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";
import { estWagonComplet, typeAutoriseEnWagonComplet } from "../../../../Simple composants/Outils/calculsFacture";

// Section 2 : détails sur l'embarquement. Ces choix décident des calculs et de la section 3 :
//  transport = "marchandise" ou "funeraire"
//    Funéraire          : pas de type de wagon, pas de TVA
//    Express            : choix Avec TVA / Sans TVA
//    Série 100 / 400    : pas de TVA à choisir ; on choisit le type de marchandise (PPN ou Divers)
//                         et le wagon (facultatif)
export const EMBARQUEMENT_VIDE = {
  iddestination: "",
  transport: "marchandise",
  idtypewagon: "",
  tva: "avec", // "avec" ou "sans" (Express seulement)
  idtypemarchandisewagon: "", // PPN ou Divers (wagon complet seulement)
  idwagon: "", // wagon utilisé (wagon complet, facultatif)
};

const OPTIONS_TRANSPORT = [
  { value: "marchandise", label: "Marchandise" },
  { value: "funeraire", label: "Transport Funéraire" },
];

const OPTIONS_TVA = [
  { value: "avec", label: "Avec TVA" },
  { value: "sans", label: "Sans TVA" },
];

function FactureEmbarquement({
  embarquement,
  destinations,
  typesWagon,
  typesMarchandise,
  wagons,
  onChange,
  onRetour,
  onSuivant,
}) {
  // Par défaut : le type de wagon Express (celui qui n'est pas un wagon complet) est coché
  useEffect(() => {
    if (!embarquement.idtypewagon && typesWagon.length > 0) {
      const express = typesWagon.find((type) => !type.modefacturation) || typesWagon[0];
      onChange({ ...embarquement, idtypewagon: express.idtypewagon });
    }
  }, [typesWagon, embarquement.idtypewagon]);

  const typeWagon = typesWagon.find((type) => type.idtypewagon === embarquement.idtypewagon);
  const wagonComplet = estWagonComplet(typeWagon);
  const funeraire = embarquement.transport === "funeraire";

  // ----- Options -----
  const optionsDestinations = destinations.map((destination) => ({
    value: destination.iddestination,
    label: destination.nomdestination,
    description: `${destination.libellezone} – ${destination.typedestination}`,
  }));

  const optionsWagons = typesWagon.map((type) => ({
    value: type.idtypewagon,
    label: type.libelletypewagon,
  }));

  // Wagon complet : seulement PPN et Divers
  const optionsTypesWagonComplet = typesMarchandise
    .filter((type) => typeAutoriseEnWagonComplet(type.libelletype))
    .map((type) => ({ value: type.idtypemarchandise, label: type.libelletype }));

  // Wagons (numéros) de ce type
  const optionsNumerosWagon = wagons
    .filter((wagon) => wagon.idtypewagon === embarquement.idtypewagon)
    .map((wagon) => ({ value: String(wagon.idwagon), label: wagon.libellewagon }));

  // ----- Changements -----
  function changerWagon(valeur) {
    onChange({ ...embarquement, idtypewagon: valeur, idtypemarchandisewagon: "", idwagon: "" });
  }

  function annuler() {
    const express = typesWagon.find((type) => !type.modefacturation) || typesWagon[0];
    onChange({ ...EMBARQUEMENT_VIDE, idtypewagon: express ? express.idtypewagon : "" });
  }

  function suivant() {
    if (!embarquement.iddestination) {
      toast.error("Choisissez une destination");
      return;
    }
    if (!funeraire && !embarquement.idtypewagon) {
      toast.error("Choisissez un type de wagon");
      return;
    }
    if (!funeraire && wagonComplet && !embarquement.idtypemarchandisewagon) {
      toast.error("Choisissez le type de marchandise du wagon (PPN ou Divers)");
      return;
    }
    onSuivant();
  }

  return (
    <div>
      <EnteteSection
        icone={Truck}
        titre="Détails sur l’embarquement"
        sousTitre="Insérer les informations sur l’embarquement"
      />

      <div className="FactureFormulaire">
        <div className="FactureColonne">
          <SelectInput
            label="Destination *"
            name="iddestination"
            options={optionsDestinations}
            value={embarquement.iddestination}
            onChange={(valeur) => onChange({ ...embarquement, iddestination: valeur })}
            placeholder="Sélectionner une destination"
            searchPlaceholder="Rechercher une destination..."
          />

          <GroupeRadio
            label="A transporter"
            name="transport"
            options={OPTIONS_TRANSPORT}
            value={embarquement.transport}
            onChange={(valeur) => onChange({ ...embarquement, transport: valeur })}
            requis
          />
        </div>

        {/* Transport funéraire : ni type de wagon, ni TVA */}
        {!funeraire && (
          <div className="FactureColonne">
            <GroupeRadio
              label="Type de wagon"
              name="idtypewagon"
              options={optionsWagons}
              value={embarquement.idtypewagon}
              onChange={changerWagon}
              requis
            />

            {/* Express : avec ou sans TVA */}
            {!wagonComplet && (
              <GroupeRadio
                label="Taxes à Valeurs Ajoutées"
                name="tva"
                options={OPTIONS_TVA}
                value={embarquement.tva}
                onChange={(valeur) => onChange({ ...embarquement, tva: valeur })}
                requis
              />
            )}

            {/* Série 100 / 400 : type de marchandise de la taxation (PPN ou Divers) */}
            {wagonComplet && (
              <>
                <GroupeRadio
                  label="Type de marchandises"
                  name="idtypemarchandisewagon"
                  options={optionsTypesWagonComplet}
                  value={embarquement.idtypemarchandisewagon}
                  onChange={(valeur) => onChange({ ...embarquement, idtypemarchandisewagon: valeur })}
                  requis
                />
                <SelectInput
                  label="Wagon (facultatif)"
                  name="idwagon"
                  options={optionsNumerosWagon}
                  value={embarquement.idwagon}
                  onChange={(valeur) => onChange({ ...embarquement, idwagon: valeur })}
                  placeholder="Sélectionner un wagon"
                  searchPlaceholder="Rechercher un wagon..."
                />
              </>
            )}
          </div>
        )}
      </div>

      <BarreNavigation onRetour={onRetour} onAnnuler={annuler} onSuivant={suivant} />
    </div>
  );
}

export default FactureEmbarquement;
