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
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Route du backend : Route/Taxateur/typemarchandise.js
const URL_TYPES_MARCHANDISE = `${URL_API}/typemarchandise`;

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
    try {
      const reponse = await axios.get(`${URL_TYPES_MARCHANDISE}/selectionnertout`);
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
        await axios.post(`${URL_TYPES_MARCHANDISE}/ajouter`, donnees);
        toast.success("Type de marchandise ajouté");
      } else {
        await axios.put(`${URL_TYPES_MARCHANDISE}/modifier/${selection.idtypemarchandise}`, donnees);
        toast.success("Type de marchandise modifié");
      }
      fermerPopup();
      chargerTypes(); // on relit la liste dans la base
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_TYPES_MARCHANDISE}/supprimer/${selection.idtypemarchandise}`);
      toast.success("Type de marchandise supprimé");
      fermerPopup();
      chargerTypes();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
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
