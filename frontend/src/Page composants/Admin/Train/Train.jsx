import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Train.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../Simple composants/Input/Input";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { trouverLibelle } from "../../../Simple composants/Outils/outils";
import { bleu, rouge } from "../../../Simple composants/Couleurs/couleur";
import { TYPES_TRAIN_TEST } from "../../../Simple composants/Outils/donneesTest";

const URL_TRAINS = "/api/trains"; // TODO : votre URL d'API
const URL_TYPES_TRAIN = "/api/types-train";
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// train(idtrain, libelletrain, idtypetrain) : idtrain est un entier auto-incrémenté
const DONNEES_TEST = [
  { idtrain: 1, libelletrain: "Train 1", idtypetrain: "TRN01" },
  { idtrain: 2, libelletrain: "Train 2", idtypetrain: "TRN02" },
];

const FORMULAIRE_VIDE = { libelletrain: "", idtypetrain: "" };

// libelletrain = 10 caractères maximum dans la base
const SCHEMA = z.object({
  libelletrain: z.string().trim().min(1, "Saisissez le nom du train").max(10, "Nom du train : 10 caractères maximum"),
  idtypetrain: z.string().min(1, "Choisissez un type de train"),
});

function Train() {
  const [trains, setTrains] = useState([]);
  const [typesTrain, setTypesTrain] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    if (UTILISER_DONNEES_TEST) {
      setTrains(DONNEES_TEST);
      setTypesTrain(TYPES_TRAIN_TEST);
      return;
    }
    try {
      const [rTrains, rTypes] = await Promise.all([
        axios.get(URL_TRAINS),
        axios.get(URL_TYPES_TRAIN),
      ]);
      setTrains(rTrains.data);
      setTypesTrain(rTypes.data);
    } catch {
      toast.error("Impossible de charger les trains");
    }
  }

  const optionsTypesTrain = typesTrain.map((type) => ({
    value: type.idtypetrain,
    label: type.libelletrain,
    description: type.modefacturation ? "Poids de facturation" : "Poids réel",
  }));

  const colonnes = [
    { titre: "ID", cle: "idtrain" },
    { titre: "Train", cle: "libelletrain" },
    {
      titre: "Type de train",
      cle: "idtypetrain",
      afficher: (id) => trouverLibelle(typesTrain, "idtypetrain", id, "libelletrain"),
    },
  ];

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(train) {
    setFormulaire({ libelletrain: train.libelletrain, idtypetrain: train.idtypetrain });
    setSelection(train);
    setMode("modifier");
  }

  function ouvrirSuppression(train) {
    setSelection(train);
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

  function boutonsDeLigne(train) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(train) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(train) },
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
          nouveau.idtrain = Math.max(0, ...trains.map((t) => t.idtrain)) + 1;
        } else {
          const reponse = await axios.post(URL_TRAINS, resultat.data);
          nouveau = reponse.data;
        }
        setTrains([...trains, nouveau]);
        toast.success("Train ajouté");
      } else {
        const id = selection.idtrain;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_TRAINS}/${id}`, resultat.data);
        setTrains(trains.map((t) => (t.idtrain === id ? { ...t, ...resultat.data } : t)));
        toast.success("Train modifié");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.idtrain;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_TRAINS}/${id}`);
      setTrains(trains.filter((t) => t.idtrain !== id));
      toast.success("Train supprimé");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  return (
    <div>
      <h2 className="TrainTitre">Trains</h2>

      <BouttonNouveau texte="Nouveau train" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={colonnes}
        donnees={trains}
        cleLigne="idtrain"
        actions={boutonsDeLigne}
        messageVide="Aucun train"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau train" : "Modifier le train"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Train (10 caractères max)"
            name="libelletrain"
            value={formulaire.libelletrain}
            onChange={changerChamp}
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
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le train"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le train{" "}
            <strong>{selection.libelletrain}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Train;
