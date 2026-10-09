import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./TypeMarchandise.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../Simple composants/Input/Input";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { idSuivant } from "../../../Simple composants/Outils/outils";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { TYPES_MARCHANDISE_TEST } from "../../../Simple composants/Outils/donneesTest";

const URL_TYPES_MARCHANDISE = "/api/types-marchandise"; // TODO : votre URL d'API
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// typemarchandise(idtypemarchandise, libelletype, soumistva)
// soumistva est un booléen dans la base : le select envoie "true" / "false" (converti avant l'envoi)
const OPTIONS_TVA = [
  { value: "true", label: "Oui", description: "La TVA s'applique" },
  { value: "false", label: "Non", description: "Pas de TVA" },
];

const FORMULAIRE_VIDE = { libelletype: "", soumistva: "" };

// libelletype = 20 caractères maximum dans la base
const SCHEMA = z.object({
  libelletype: z
    .string()
    .trim()
    .min(2, "Saisissez le type de marchandise")
    .max(20, "Type de marchandise : 20 caractères maximum"),
  soumistva: z.string().min(1, "Indiquez si le type est soumis à la TVA"),
});

const COLONNES = [
  { titre: "ID", cle: "idtypemarchandise" },
  { titre: "Type de marchandise", cle: "libelletype" },
  { titre: "Soumis à la TVA", cle: "soumistva", afficher: (valeur) => (valeur ? "Oui" : "Non") },
];

function TypeMarchandise() {
  const [types, setTypes] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerTypes();
  }, []);

  async function chargerTypes() {
    if (UTILISER_DONNEES_TEST) {
      setTypes(TYPES_MARCHANDISE_TEST);
      return;
    }
    try {
      const reponse = await axios.get(URL_TYPES_MARCHANDISE);
      setTypes(reponse.data);
    } catch {
      toast.error("Impossible de charger les types de marchandise");
    }
  }

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(type) {
    setFormulaire({
      libelletype: type.libelletype,
      soumistva: String(type.soumistva),
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

  function changerSelect(nom, valeur) {
    setFormulaire({ ...formulaire, [nom]: valeur });
  }

  function boutonsDeLigne(type) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(type) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(type) },
    ];
  }

  async function enregistrer() {
    const resultat = SCHEMA.safeParse(formulaire);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }

    // La base attend un booléen pour soumistva
    const donnees = {
      ...resultat.data,
      soumistva: resultat.data.soumistva === "true",
    };

    try {
      if (mode === "ajouter") {
        let nouveau = { ...donnees };
        if (UTILISER_DONNEES_TEST) {
          nouveau.idtypemarchandise = idSuivant(types, "idtypemarchandise", "TP");
        } else {
          const reponse = await axios.post(URL_TYPES_MARCHANDISE, donnees);
          nouveau = reponse.data;
        }
        setTypes([...types, nouveau]);
        toast.success("Type de marchandise ajouté");
      } else {
        const id = selection.idtypemarchandise;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_TYPES_MARCHANDISE}/${id}`, donnees);
        setTypes(types.map((t) => (t.idtypemarchandise === id ? { ...t, ...donnees } : t)));
        toast.success("Type de marchandise modifié");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.idtypemarchandise;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_TYPES_MARCHANDISE}/${id}`);
      setTypes(types.filter((t) => t.idtypemarchandise !== id));
      toast.success("Type de marchandise supprimé");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  return (
    <div>
      <h2 className="TypeMarchandiseTitre">Types de marchandise</h2>

      <BouttonNouveau texte="Nouveau type de marchandise" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={types}
        cleLigne="idtypemarchandise"
        actions={boutonsDeLigne}
        messageVide="Aucun type de marchandise"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau type de marchandise" : "Modifier le type de marchandise"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Type de marchandise (20 caractères max)"
            name="libelletype"
            value={formulaire.libelletype}
            onChange={changerChamp}
          />
          <SelectInput
            label="Soumis à la TVA"
            name="soumistva"
            options={OPTIONS_TVA}
            value={formulaire.soumistva}
            onChange={(valeur) => changerSelect("soumistva", valeur)}
            placeholder="Sélectionner"
            searchPlaceholder="Rechercher..."
          />
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le type de marchandise"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le type de marchandise{" "}
            <strong>{selection.libelletype}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default TypeMarchandise;
