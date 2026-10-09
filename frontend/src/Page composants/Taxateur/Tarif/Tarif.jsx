import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Tarif.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../Simple composants/Input/Input";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { idSuivant, trouverLibelle } from "../../../Simple composants/Outils/outils";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { ZONES_TEST, TYPES_TRAIN_TEST, TYPES_MARCHANDISE_TEST } from "../../../Simple composants/Outils/donneesTest";

const URL_TARIFS = "/api/tarifs"; // TODO : votre URL d'API
const URL_ZONES = "/api/zones";
const URL_TYPES_MARCHANDISE = "/api/types-marchandise";
const URL_TYPES_TRAIN = "/api/types-train";
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// tarif(idtarif, idzone, idtypemarchandise, idtypetrain, prixkg)
const DONNEES_TEST = [
  { idtarif: "TRF01", idzone: "ZN01", idtypemarchandise: "TP01", idtypetrain: "TRN01", prixkg: 150 },
  { idtarif: "TRF02", idzone: "ZN02", idtypemarchandise: "TP02", idtypetrain: "TRN02", prixkg: 300 },
];

const FORMULAIRE_VIDE = { idzone: "", idtypemarchandise: "", idtypetrain: "", prixkg: "" };

const SCHEMA = z.object({
  idzone: z.string().min(1, "Choisissez une zone"),
  idtypemarchandise: z.string().min(1, "Choisissez un type de marchandise"),
  idtypetrain: z.string().min(1, "Choisissez un type de train"),
  prixkg: z.coerce
    .number()
    .int("Le prix doit être un nombre entier")
    .positive("Le prix doit être supérieur à 0"),
});

function Tarif() {
  const [tarifs, setTarifs] = useState([]);
  const [zones, setZones] = useState([]);
  const [typesMarchandise, setTypesMarchandise] = useState([]);
  const [typesTrain, setTypesTrain] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    if (UTILISER_DONNEES_TEST) {
      setTarifs(DONNEES_TEST);
      setZones(ZONES_TEST);
      setTypesMarchandise(TYPES_MARCHANDISE_TEST);
      setTypesTrain(TYPES_TRAIN_TEST);
      return;
    }
    try {
      const [rTarifs, rZones, rMarchandises, rTrains] = await Promise.all([
        axios.get(URL_TARIFS),
        axios.get(URL_ZONES),
        axios.get(URL_TYPES_MARCHANDISE),
        axios.get(URL_TYPES_TRAIN),
      ]);
      setTarifs(rTarifs.data);
      setZones(rZones.data);
      setTypesMarchandise(rMarchandises.data);
      setTypesTrain(rTrains.data);
    } catch {
      toast.error("Impossible de charger les tarifs");
    }
  }

  // Options des trois selects (clés étrangères)
  const optionsZones = zones.map((zone) => ({
    value: zone.idzone,
    label: zone.libellezone,
    description: `${zone.kilometrage} km`,
  }));

  const optionsTypesMarchandise = typesMarchandise.map((type) => ({
    value: type.idtypemarchandise,
    label: type.libelletype,
    description: type.soumistva ? "Soumis à la TVA" : "Non soumis à la TVA",
  }));

  const optionsTypesTrain = typesTrain.map((type) => ({
    value: type.idtypetrain,
    label: type.libelletrain,
  }));

  const colonnes = [
    { titre: "ID", cle: "idtarif" },
    {
      titre: "Zone",
      cle: "idzone",
      afficher: (id) => trouverLibelle(zones, "idzone", id, "libellezone"),
    },
    {
      titre: "Type de marchandise",
      cle: "idtypemarchandise",
      afficher: (id) => trouverLibelle(typesMarchandise, "idtypemarchandise", id, "libelletype"),
    },
    {
      titre: "Type de train",
      cle: "idtypetrain",
      afficher: (id) => trouverLibelle(typesTrain, "idtypetrain", id, "libelletrain"),
    },
    {
      titre: "Prix / kg",
      cle: "prixkg",
      afficher: (valeur) => `${Number(valeur).toLocaleString("fr-FR")} Ar`,
    },
  ];

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(tarif) {
    setFormulaire({
      idzone: tarif.idzone,
      idtypemarchandise: tarif.idtypemarchandise,
      idtypetrain: tarif.idtypetrain,
      prixkg: String(tarif.prixkg),
    });
    setSelection(tarif);
    setMode("modifier");
  }

  function ouvrirSuppression(tarif) {
    setSelection(tarif);
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

  function boutonsDeLigne(tarif) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(tarif) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(tarif) },
    ];
  }

  async function enregistrer() {
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }

    try {
      if (mode === "ajouter") {
        let nouveau = { ...resultat.data };
        if (UTILISER_DONNEES_TEST) {
          nouveau.idtarif = idSuivant(tarifs, "idtarif", "TRF");
        } else {
          const reponse = await axios.post(URL_TARIFS, resultat.data);
          nouveau = reponse.data;
        }
        setTarifs([...tarifs, nouveau]);
        toast.success("Tarif ajouté");
      } else {
        const id = selection.idtarif;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_TARIFS}/${id}`, resultat.data);
        setTarifs(tarifs.map((t) => (t.idtarif === id ? { ...t, ...resultat.data } : t)));
        toast.success("Tarif modifié");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.idtarif;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_TARIFS}/${id}`);
      setTarifs(tarifs.filter((t) => t.idtarif !== id));
      toast.success("Tarif supprimé");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  return (
    <div>
      <h2 className="TarifTitre">Tarifs</h2>

      <BouttonNouveau texte="Nouveau tarif" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={colonnes}
        donnees={tarifs}
        cleLigne="idtarif"
        actions={boutonsDeLigne}
        messageVide="Aucun tarif"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau tarif" : "Modifier le tarif"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <SelectInput
            label="Zone"
            name="idzone"
            options={optionsZones}
            value={formulaire.idzone}
            onChange={(valeur) => changerSelect("idzone", valeur)}
            placeholder="Sélectionner une zone"
            searchPlaceholder="Rechercher une zone..."
          />
          <SelectInput
            label="Type de marchandise"
            name="idtypemarchandise"
            options={optionsTypesMarchandise}
            value={formulaire.idtypemarchandise}
            onChange={(valeur) => changerSelect("idtypemarchandise", valeur)}
            placeholder="Sélectionner un type"
            searchPlaceholder="Rechercher un type..."
          />
          <SelectInput
            label="Type de train"
            name="idtypetrain"
            options={optionsTypesTrain}
            value={formulaire.idtypetrain}
            onChange={(valeur) => changerSelect("idtypetrain", valeur)}
            placeholder="Sélectionner un type de train"
            searchPlaceholder="Rechercher un type de train..."
          />
          <CustomInput
            type="number"
            label="Prix par kg (Ar)"
            name="prixkg"
            value={formulaire.prixkg}
            onChange={changerChamp}
          />
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le tarif"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le tarif <strong>{selection.idtarif}</strong> (
            {trouverLibelle(zones, "idzone", selection.idzone, "libellezone")}) ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Tarif;

