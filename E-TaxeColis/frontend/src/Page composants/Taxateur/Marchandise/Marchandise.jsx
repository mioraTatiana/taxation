import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Marchandise.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../Simple composants/Input/Input";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Routes du backend : Route/Taxateur/marchandise.js et Route/Taxateur/typemarchandise.js
const URL_MARCHANDISES = `${URL_API}/marchandise`;
const URL_TYPES_MARCHANDISE = `${URL_API}/typemarchandise`;

// marchandise(idmarchandise, designation, poidscolis, idtypemarchandise)
// idmarchandise est un entier auto-incrémenté ; poidscolis = poids d'un colis en kg
const FORMULAIRE_VIDE = { designation: "", poidscolis: "", idtypemarchandise: "" };

// designation = 50 caractères maximum ; poidscolis est un réel (décimales acceptées)
const SCHEMA = z.object({
  designation: z.string().trim().min(2, "Saisissez la désignation").max(50, "Désignation : 50 caractères maximum"),
  poidscolis: z.coerce.number().positive("Le poids du colis doit être supérieur à 0"),
  idtypemarchandise: z.string().min(1, "Choisissez un type de marchandise"),
});

function Marchandise() {
  const [marchandises, setMarchandises] = useState([]);
  const [typesMarchandise, setTypesMarchandise] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [rMarchandises, rTypes] = await Promise.all([
        axios.get(`${URL_MARCHANDISES}/selectionnertout`),
        axios.get(`${URL_TYPES_MARCHANDISE}/selectionnertout`),
      ]);
      setMarchandises(rMarchandises.data);
      setTypesMarchandise(rTypes.data);
    } catch {
      toast.error("Impossible de charger les marchandises");
    }
  }

  const optionsTypesMarchandise = typesMarchandise.map((type) => ({
    value: type.idtypemarchandise,
    label: type.libelletype,
    description: type.soumistva ? "Soumis à la TVA" : "Non soumis à la TVA",
  }));

  const colonnes = [
    { titre: "ID", cle: "idmarchandise" },
    { titre: "Désignation", cle: "designation" },
    { titre: "Poids du colis", cle: "poidscolis", afficher: (valeur) => `${Number(valeur).toLocaleString("fr-FR")} kg` },
    {
      titre: "Type de marchandise",
      cle: "idtypemarchandise",
      afficher: (id, ligne) => ligne.libelletype || id,
    },
  ];

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(marchandise) {
    setFormulaire({
      designation: marchandise.designation,
      poidscolis: String(marchandise.poidscolis),
      idtypemarchandise: marchandise.idtypemarchandise ?? "",
    });
    setSelection(marchandise);
    setMode("modifier");
  }

  function ouvrirSuppression(marchandise) {
    setSelection(marchandise);
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

  function boutonsDeLigne(marchandise) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(marchandise) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(marchandise) },
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
        await axios.post(`${URL_MARCHANDISES}/ajouter`, resultat.data);
        toast.success("Marchandise ajoutée");
      } else {
        await axios.put(`${URL_MARCHANDISES}/modifier/${selection.idmarchandise}`, resultat.data);
        toast.success("Marchandise modifiée");
      }
      fermerPopup();
      chargerDonnees(); // on relit la liste dans la base
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_MARCHANDISES}/supprimer/${selection.idmarchandise}`);
      toast.success("Marchandise supprimée");
      fermerPopup();
      chargerDonnees();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="MarchandiseTitre">Marchandises</h2>

      <BouttonNouveau texte="Nouvelle marchandise" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={colonnes}
        donnees={marchandises}
        cleLigne="idmarchandise"
        actions={boutonsDeLigne}
        messageVide="Aucune marchandise"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouvelle marchandise" : "Modifier la marchandise"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Désignation"
            name="designation"
            value={formulaire.designation}
            onChange={changerChamp}
          />
          <CustomInput
            type="number"
            label="Poids du colis (kg)"
            name="poidscolis"
            value={formulaire.poidscolis}
            onChange={changerChamp}
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
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer la marchandise"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer la marchandise{" "}
            <strong>{selection.designation}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Marchandise;

