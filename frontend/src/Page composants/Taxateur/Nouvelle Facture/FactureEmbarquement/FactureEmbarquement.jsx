import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { Truck } from "lucide-react";
import "./FactureEmbarquement.css";
import SelectInput from "../../../../Simple composants/SelectInput/SelectInput";
import GroupeRadio from "../../../../Simple composants/GroupeRadio/GroupeRadio";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";
import { trouverLibelle } from "../../../../Simple composants/Outils/outils";

// transport : "marchandise" ou "funeraire" ; tva : "avec" ou "sans"
export const EMBARQUEMENT_VIDE = {
  iddestination: "",
  idtypetrain: "",
  transport: "marchandise",
  tva: "avec",
};

const OPTIONS_TRANSPORT = [
  { value: "marchandise", label: "Marchandise" },
  { value: "funeraire", label: "Transport Funéraire" },
];

const OPTIONS_TVA = [
  { value: "avec", label: "Avec TVA" },
  { value: "sans", label: "Sans TVA" },
];

function FactureEmbarquement({ embarquement, destinations, zones, typesTrain, onChange, onRetour, onSuivant }) {
  // Par défaut : le premier type de wagon (Express) est coché
  useEffect(() => {
    if (!embarquement.idtypetrain && typesTrain.length > 0) {
      onChange({ ...embarquement, idtypetrain: typesTrain[0].idtypetrain });
    }
  }, [typesTrain, embarquement.idtypetrain]);

  const optionsDestinations = destinations.map((destination) => ({
    value: destination.iddestination,
    label: destination.nomdestination,
    description: trouverLibelle(zones, "idzone", destination.idzone, "libellezone"),
  }));

  const optionsWagons = typesTrain.map((type) => ({
    value: type.idtypetrain,
    label: type.libelletrain,
  }));

  // Wagon complet : les types sont Divers et PPN, avec TVA (le choix Avec / Sans TVA ne concerne que l'Express)
  const wagonChoisi = typesTrain.find((type) => type.idtypetrain === embarquement.idtypetrain);
  const wagonComplet = Boolean(wagonChoisi && wagonChoisi.modefacturation);

  function changerWagon(valeur) {
    const type = typesTrain.find((t) => t.idtypetrain === valeur);
    onChange({
      ...embarquement,
      idtypetrain: valeur,
      tva: type && type.modefacturation ? "avec" : embarquement.tva,
    });
  }

  function changerTransport(valeur) {
    // Le transport funéraire n'est pas soumis à la TVA
    onChange({
      ...embarquement,
      transport: valeur,
      tva: valeur === "funeraire" ? "sans" : embarquement.tva,
    });
  }

  function annuler() {
    onChange({ ...EMBARQUEMENT_VIDE, idtypetrain: typesTrain.length > 0 ? typesTrain[0].idtypetrain : "" });
  }

  function suivant() {
    if (!embarquement.iddestination) {
      toast.error("Choisissez une destination");
      return;
    }
    if (!embarquement.idtypetrain) {
      toast.error("Choisissez un type de wagon");
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
            onChange={changerTransport}
            requis
          />
        </div>

        <div className="FactureColonne">
          <GroupeRadio
            label="Type de wagon"
            name="idtypetrain"
            options={optionsWagons}
            value={embarquement.idtypetrain}
            onChange={changerWagon}
            requis
          />

          {embarquement.transport === "marchandise" && !wagonComplet && (
            <GroupeRadio
              label="Taxes à Valeurs Ajoutées"
              name="tva"
              options={OPTIONS_TVA}
              value={embarquement.tva}
              onChange={(valeur) => onChange({ ...embarquement, tva: valeur })}
              requis
            />
          )}
        </div>
      </div>

      <BarreNavigation onRetour={onRetour} onAnnuler={annuler} onSuivant={suivant} />
    </div>
  );
}

export default FactureEmbarquement;
