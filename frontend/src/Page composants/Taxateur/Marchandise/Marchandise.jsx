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
import { trouverLibelle } from "../../../Simple composants/Outils/outils";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { TYPES_MARCHANDISE_TEST } from "../../../Simple composants/Outils/donneesTest";

const URL_MARCHANDISES = "/api/marchandises"; // TODO : votre URL d'API
const URL_TYPES_MARCHANDISE = "/api/types-marchandise";
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// marchandise(idmarchandise, designation, poidscolis, idtypemarchandise)
// idmarchandise est un entier auto-incrémenté
const DONNEES_TEST = [
  { idmarchandise: 1, designation: "Sac de riz", poidscolis: 50, idtypemarchandise: "TP01" },
  { idmarchandise: 2, designation: "Sac de ciment", poidscolis: 25, idtypemarchandise: "TP02" },
];

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
    if (UTILISER_DONNEES_TEST) {
      setMarchandises(DONNEES_TEST);
      setTypesMarchandise(TYPES_MARCHANDISE_TEST);
      return;
    }
    try {
      const [rMarchandises, rTypes] = await Promise.all([
        axios.get(URL_MARCHANDISES),
        axios.get(URL_TYPES_MARCHANDISE),
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
    { titre: "Poids du colis", cle: "poidscolis", afficher: (valeur) => `${valeur} kg` },
    {
      titre: "Type de marchandise",
      cle: "idtypemarchandise",
      afficher: (id) => trouverLibelle(typesMarchandise, "idtypemarchandise", id, "libelletype"),
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
        let nouvelle = { ...resultat.data };
        if (UTILISER_DONNEES_TEST) {
          nouvelle.idmarchandise = Math.max(0, ...marchandises.map((m) => m.idmarchandise)) + 1;
        } else {
          const reponse = await axios.post(URL_MARCHANDISES, resultat.data);
          nouvelle = reponse.data;
        }
        setMarchandises([...marchandises, nouvelle]);
        toast.success("Marchandise ajoutée");
      } else {
        const id = selection.idmarchandise;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_MARCHANDISES}/${id}`, resultat.data);
        setMarchandises(marchandises.map((m) => (m.idmarchandise === id ? { ...m, ...resultat.data } : m)));
        toast.success("Marchandise modifiée");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.idmarchandise;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_MARCHANDISES}/${id}`);
      setMarchandises(marchandises.filter((m) => m.idmarchandise !== id));
      toast.success("Marchandise supprimée");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
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

