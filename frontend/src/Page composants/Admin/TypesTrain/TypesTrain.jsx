import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./TypesTrain.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { idSuivant } from "../../../Simple composants/Outils/outils";
import CustomInput from "../../../Simple composants/Input/Input";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { bleu, rouge } from "../../../Simple composants/Couleurs/couleur";

const URL_TYPES_TRAIN = "/api/types-train"; // TODO : votre URL d'API
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// typetrain(idtypetrain, libelletrain, modefacturation, poidsfacturation)
const DONNEES_TEST = [
  { idtypetrain: "TRN01", libelletrain: "Omnibus", modefacturation: false, poidsfacturation: 0 },
  { idtypetrain: "TRN02", libelletrain: "Express", modefacturation: true, poidsfacturation: 100 },
];

// Dans la base, modefacturation est un booléen (vrai / faux).
// Les libellés ci-dessous sont à adapter à votre vraie règle de facturation.
const MODES_FACTURATION = [
  { value: "false", label: "Poids réel", description: "Facturé selon le poids réel du colis" },
  { value: "true", label: "Poids de facturation", description: "Facturé avec le poids de facturation du train" },
];

const FORMULAIRE_VIDE = { libelletrain: "", modefacturation: "", poidsfacturation: "" };

// Tailles de la base : libelletrain = 20 caractères maximum, poidsfacturation = entier
const SCHEMA = z
  .object({
    libelletrain: z
      .string()
      .trim()
      .min(2, "Saisissez le nom du type de train")
      .max(20, "Le nom du type de train : 20 caractères maximum"),
    modefacturation: z.string().min(1, "Choisissez un mode de facturation"),
    poidsfacturation: z.coerce
      .number()
      .int("Le poids doit être un nombre entier")
      .min(0, "Le poids ne peut pas être négatif"),
  })
  .superRefine((valeurs, contexte) => {
    if (valeurs.modefacturation === "true" && valeurs.poidsfacturation <= 0) {
      contexte.addIssue({
        code: "custom",
        path: ["poidsfacturation"],
        message: "Saisissez le poids de facturation",
      });
    }
  });

const COLONNES = [
  { titre: "ID", cle: "idtypetrain" },
  { titre: "Type de train", cle: "libelletrain" },
  {
    titre: "Mode de facturation",
    cle: "modefacturation",
    afficher: (valeur) => (valeur ? "Poids de facturation" : "Poids réel"),
  },
  { titre: "Poids de facturation", cle: "poidsfacturation", afficher: (valeur) => (valeur ? `${valeur} kg` : "-") },
];

function TypesTrain() {
  const [types, setTypes] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerTypes();
  }, []);

  async function chargerTypes() {
    if (UTILISER_DONNEES_TEST) {
      setTypes(DONNEES_TEST);
      return;
    }
    try {
      const reponse = await axios.get(URL_TYPES_TRAIN);
      setTypes(reponse.data);
    } catch {
      toast.error("Impossible de charger les types de train");
    }
  }

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(type) {
    setFormulaire({
      libelletrain: type.libelletrain,
      modefacturation: String(type.modefacturation),
      poidsfacturation: String(type.poidsfacturation ?? ""),
    });
    setSelection(type);
    setMode("modifier");
  }

  function ouvrirSuppression(type) {
    setSelection(type);
    setMode("supprimer");
  }

  function fermerPopup() {
    setMode(null);
    setSelection(null);
  }

  function changerChamp(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  }

  function changerMode(valeur) {
    setFormulaire({ ...formulaire, modefacturation: valeur });
  }

  function boutonsDeLigne(type) {
    return [
      { texte: "Modifier", couleur: bleu, onClick: () => ouvrirModification(type) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(type) },
    ];
  }

  async function enregistrer() {
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }

    // La base attend un booléen pour modefacturation
    const donnees = {
      ...resultat.data,
      modefacturation: resultat.data.modefacturation === "true",
    };

    try {
      if (mode === "ajouter") {
        let nouveau = { ...donnees };
        if (UTILISER_DONNEES_TEST) {
          nouveau.idtypetrain = idSuivant(types, "idtypetrain", "TRN");
        } else {
          const reponse = await axios.post(URL_TYPES_TRAIN, donnees);
          nouveau = reponse.data;
        }
        setTypes([...types, nouveau]);
        toast.success("Type de train ajouté");
      } else {
        const id = selection.idtypetrain;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_TYPES_TRAIN}/${id}`, donnees);
        setTypes(types.map((t) => (t.idtypetrain === id ? { ...t, ...donnees } : t)));
        toast.success("Type de train modifié");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.idtypetrain;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_TYPES_TRAIN}/${id}`);
      setTypes(types.filter((t) => t.idtypetrain !== id));
      toast.success("Type de train supprimé");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  return (
    <div>
      <h2 className="TypesTrainTitre">Types de train</h2>

      <BouttonNouveau texte="Nouveau type de train" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={types}
        cleLigne="idtypetrain"
        actions={boutonsDeLigne}
        messageVide="Aucun type de train"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau type de train" : "Modifier le type de train"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Type de train (20 caractères max)"
            name="libelletrain"
            value={formulaire.libelletrain}
            onChange={changerChamp}
          />
          <SelectInput
            label="Mode de facturation"
            name="modefacturation"
            options={MODES_FACTURATION}
            value={formulaire.modefacturation}
            onChange={changerMode}
            placeholder="Sélectionner un mode"
            searchPlaceholder="Rechercher un mode..."
          />
          <CustomInput
            type="number"
            label="Poids de facturation (kg)"
            name="poidsfacturation"
            value={formulaire.poidsfacturation}
            onChange={changerChamp}
          />
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le type de train"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le type de train{" "}
            <strong>{selection.libelletrain}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default TypesTrain;
