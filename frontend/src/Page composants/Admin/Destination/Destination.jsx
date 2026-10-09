import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Destination.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../Simple composants/Input/Input";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { idSuivant, trouverLibelle } from "../../../Simple composants/Outils/outils";
import { bleu, rouge, vert } from "../../../Simple composants/Couleurs/couleur";
import { ZONES_TEST } from "../../../Simple composants/Outils/donneesTest";

const URL_DESTINATIONS = "/api/destinations"; // TODO : votre URL d'API
const URL_ZONES = "/api/zones";
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// destination(iddestination, nomdestination, typedestination, codegare, pointkilometrique, idzone)
const DONNEES_TEST = [
  { iddestination: "DST01", nomdestination: "Fianarantsoa", typedestination: "Gare", codegare: "FIA", pointkilometrique: 0, idzone: "ZN01" },
  { iddestination: "DST02", nomdestination: "Manakara", typedestination: "Gare", codegare: "MKR", pointkilometrique: 163, idzone: "ZN02" },
];

// typedestination = 12 caractères maximum : à adapter à vos vraies valeurs
const TYPES_DESTINATION = [
  { value: "Gare", label: "Gare", description: "Gare ferroviaire" },
  { value: "Halte", label: "Halte", description: "Arrêt sans gare" },
  { value: "Ville", label: "Ville", description: "Destination hors gare" },
];

const FORMULAIRE_VIDE = {
  nomdestination: "",
  typedestination: "",
  codegare: "",
  pointkilometrique: "",
  idzone: "",
};

// Tailles de la base : nom 50, code gare 4. Code gare et point km sont facultatifs.
const SCHEMA = z.object({
  nomdestination: z.string().trim().min(2, "Saisissez le nom de la destination").max(50, "Nom : 50 caractères maximum"),
  typedestination: z.string().min(1, "Choisissez un type de destination"),
  codegare: z.string().trim().max(4, "Code gare : 4 caractères maximum"),
  pointkilometrique: z
    .string()
    .trim()
    .refine((valeur) => valeur === "" || /^\d+$/.test(valeur), "Point kilométrique : nombre entier positif"),
  idzone: z.string().min(1, "Choisissez une zone"),
});

function Destination() {
  const [destinations, setDestinations] = useState([]);
  const [zones, setZones] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    if (UTILISER_DONNEES_TEST) {
      setDestinations(DONNEES_TEST);
      setZones(ZONES_TEST);
      return;
    }
    try {
      const [reponseDestinations, reponseZones] = await Promise.all([
        axios.get(URL_DESTINATIONS),
        axios.get(URL_ZONES),
      ]);
      setDestinations(reponseDestinations.data);
      setZones(reponseZones.data);
    } catch {
      toast.error("Impossible de charger les destinations");
    }
  }

  // Options du select de la clé étrangère
  const optionsZones = zones.map((zone) => ({
    value: zone.idzone,
    label: zone.libellezone,
    description: `${zone.kilometrage} km`,
  }));

  const colonnes = [
    { titre: "ID", cle: "iddestination" },
    { titre: "Destination", cle: "nomdestination" },
    { titre: "Type", cle: "typedestination" },
    { titre: "Code gare", cle: "codegare", afficher: (valeur) => valeur || "-" },
    {
      titre: "Point km",
      cle: "pointkilometrique",
      afficher: (valeur) => (valeur === null || valeur === undefined ? "-" : `${valeur} km`),
    },
    {
      titre: "Zone",
      cle: "idzone",
      afficher: (idzone) => trouverLibelle(zones, "idzone", idzone, "libellezone"),
    },
  ];

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(destination) {
    setFormulaire({
      nomdestination: destination.nomdestination,
      typedestination: destination.typedestination,
      codegare: destination.codegare ?? "",
      pointkilometrique: String(destination.pointkilometrique ?? ""),
      idzone: destination.idzone,
    });
    setSelection(destination);
    setMode("modifier");
  }

  function ouvrirSuppression(destination) {
    setSelection(destination);
    setMode("supprimer");
  }

  function fermerPopup() {
    setMode(null);
    setSelection(null);
  }

  function changerChamp(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  }

  function changerSelect(nom, valeur) {
    setFormulaire({ ...formulaire, [nom]: valeur });
  }

  function boutonsDeLigne(destination) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(destination) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(destination) },
    ];
  }

  async function enregistrer() {
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }

    // Les champs facultatifs vides deviennent null (comme dans la base)
    const donnees = {
      ...resultat.data,
      codegare: resultat.data.codegare === "" ? null : resultat.data.codegare,
      pointkilometrique:
        resultat.data.pointkilometrique === "" ? null : Number(resultat.data.pointkilometrique),
    };

    try {
      if (mode === "ajouter") {
        let nouvelle = { ...donnees };
        if (UTILISER_DONNEES_TEST) {
          nouvelle.iddestination = idSuivant(destinations, "iddestination", "DST");
        } else {
          const reponse = await axios.post(URL_DESTINATIONS, donnees);
          nouvelle = reponse.data;
        }
        setDestinations([...destinations, nouvelle]);
        toast.success("Destination ajoutée");
      } else {
        const id = selection.iddestination;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_DESTINATIONS}/${id}`, donnees);
        setDestinations(destinations.map((d) => (d.iddestination === id ? { ...d, ...donnees } : d)));
        toast.success("Destination modifiée");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.iddestination;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_DESTINATIONS}/${id}`);
      setDestinations(destinations.filter((d) => d.iddestination !== id));
      toast.success("Destination supprimée");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  return (
    <div>
      <h2 className="DestinationTitre">Destinations</h2>

      <BouttonNouveau texte="Nouvelle destination" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={colonnes}
        donnees={destinations}
        cleLigne="iddestination"
        actions={boutonsDeLigne}
        messageVide="Aucune destination"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouvelle destination" : "Modifier la destination"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Destination"
            name="nomdestination"
            value={formulaire.nomdestination}
            onChange={changerChamp}
          />
          <SelectInput
            label="Type de destination"
            name="typedestination"
            options={TYPES_DESTINATION}
            value={formulaire.typedestination}
            onChange={(valeur) => changerSelect("typedestination", valeur)}
            placeholder="Sélectionner un type"
            searchPlaceholder="Rechercher un type..."
          />
          <CustomInput
            type="text"
            label="Code gare (4 caractères max)"
            name="codegare"
            value={formulaire.codegare}
            onChange={changerChamp}
          />
          <CustomInput
            type="number"
            label="Point kilométrique (km)"
            name="pointkilometrique"
            value={formulaire.pointkilometrique}
            onChange={changerChamp}
          />
          <SelectInput
            label="Zone"
            name="idzone"
            options={optionsZones}
            value={formulaire.idzone}
            onChange={(valeur) => changerSelect("idzone", valeur)}
            placeholder="Sélectionner une zone"
            searchPlaceholder="Rechercher une zone..."
          />
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer la destination"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer la destination{" "}
            <strong>{selection.nomdestination}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Destination;
