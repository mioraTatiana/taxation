import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./TypesWagon.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import CustomInput from "../../../Simple composants/Input/Input";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Route du backend : Route/Admin/typewagon.js
const URL_TYPES_WAGON = `${URL_API}/typewagon`;

// typewagon(idtypewagon, libelletypewagon, modefacturation, poidsfacturation, poidssupporte)
// Wagon complet : poids FACTURÉ (série 100 : 20 000 kg) et poids SUPPORTÉ = charge maximum (15 000 kg)
// modefacturation est un booléen dans la base :
//   false = Express : facturé selon les marchandises
//   true  = wagon complet (série 100, série 400) : facturé sur le poids du wagon
const MODES_FACTURATION = [
  { value: "false", label: "Par les marchandises", description: "Express : facturé selon le poids des marchandises" },
  { value: "true", label: "Wagon complet", description: "Série 100 / 400 : facturé sur le poids du wagon" },
];

const FORMULAIRE_VIDE = { libelletypewagon: "", modefacturation: "", poidsfacturation: "", poidssupporte: "" };

// Tailles de la base : libelletypewagon = 10 caractères, poidsfacturation = 5 chiffres
const SCHEMA = z
  .object({
    libelletypewagon: z
      .string()
      .trim()
      .min(2, "Saisissez le nom du type de wagon")
      .max(10, "Le nom du type de wagon : 10 caractères maximum"),
    modefacturation: z.string().min(1, "Choisissez un mode de facturation"),
    poidsfacturation: z.coerce
      .number()
      .int("Le poids doit être un nombre entier")
      .min(0, "Le poids ne peut pas être négatif")
      .max(99999, "Poids : 5 chiffres maximum"),
    poidssupporte: z.coerce
      .number()
      .int("Le poids doit être un nombre entier")
      .min(0, "Le poids ne peut pas être négatif")
      .max(99999, "Poids : 5 chiffres maximum"),
  })
  .superRefine((valeurs, contexte) => {
    if (valeurs.modefacturation === "true" && valeurs.poidsfacturation <= 0) {
      contexte.addIssue({
        code: "custom",
        path: ["poidsfacturation"],
        message: "Saisissez le poids facturé du wagon complet (ex: 20000)",
      });
    }
    if (valeurs.modefacturation === "true" && valeurs.poidssupporte <= 0) {
      contexte.addIssue({
        code: "custom",
        path: ["poidssupporte"],
        message: "Saisissez le poids supporté du wagon complet (ex: 15000)",
      });
    }
  });

const COLONNES = [
  { titre: "ID", cle: "idtypewagon" },
  { titre: "Type de wagon", cle: "libelletypewagon" },
  {
    titre: "Mode de facturation",
    cle: "modefacturation",
    afficher: (valeur) => (valeur ? "Wagon complet" : "Par les marchandises"),
  },
  {
    titre: "Poids facturé",
    cle: "poidsfacturation",
    afficher: (valeur) => (valeur ? `${Number(valeur).toLocaleString("fr-FR")} kg` : "-"),
  },
  {
    titre: "Poids supporté",
    cle: "poidssupporte",
    afficher: (valeur) => (valeur ? `${Number(valeur).toLocaleString("fr-FR")} kg` : "-"),
  },
];

function TypesWagon() {
  const [types, setTypes] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerTypes();
  }, []);

  async function chargerTypes() {
    try {
      const reponse = await axios.get(`${URL_TYPES_WAGON}/selectionnertout`);
      setTypes(reponse.data);
    } catch {
      toast.error("Impossible de charger les types de wagon");
    }
  }

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(type) {
    setFormulaire({
      libelletypewagon: type.libelletypewagon,
      modefacturation: String(type.modefacturation),
      poidsfacturation: String(type.poidsfacturation ?? 0),
      poidssupporte: String(type.poidssupporte ?? 0),
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

    // Le select donne "true" / "false" : on envoie un vrai booléen à la base
    const donnees = {
      ...resultat.data,
      modefacturation: resultat.data.modefacturation === "true",
      poidsfacturation: resultat.data.modefacturation === "true" ? resultat.data.poidsfacturation : 0,
      poidssupporte: resultat.data.modefacturation === "true" ? resultat.data.poidssupporte : 0,
    };

    try {
      if (mode === "ajouter") {
        await axios.post(`${URL_TYPES_WAGON}/ajouter`, donnees);
        toast.success("Type de wagon ajouté");
      } else {
        await axios.put(`${URL_TYPES_WAGON}/modifier/${selection.idtypewagon}`, donnees);
        toast.success("Type de wagon modifié");
      }
      fermerPopup();
      chargerTypes();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_TYPES_WAGON}/supprimer/${selection.idtypewagon}`);
      toast.success("Type de wagon supprimé");
      fermerPopup();
      chargerTypes();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="TypesWagonTitre">Types de wagon</h2>

      <BouttonNouveau texte="Nouveau type de wagon" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={types}
        cleLigne="idtypewagon"
        actions={boutonsDeLigne}
        messageVide="Aucun type de wagon"
      />

      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau type de wagon" : "Modifier le type de wagon"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Type de wagon (ex: Express, Série 100)"
            name="libelletypewagon"
            value={formulaire.libelletypewagon}
            onChange={changerChamp}
          />
          <SelectInput
            label="Mode de facturation"
            name="modefacturation"
            options={MODES_FACTURATION}
            value={formulaire.modefacturation}
            onChange={(valeur) => setFormulaire({ ...formulaire, modefacturation: valeur })}
            placeholder="Sélectionner un mode"
          />
          {formulaire.modefacturation === "true" && (
            <>
              <CustomInput
                type="number"
                label="Poids facturé (kg)"
                name="poidsfacturation"
                value={formulaire.poidsfacturation}
                onChange={changerChamp}
              />
              <CustomInput
                type="number"
                label="Poids supporté (kg) – charge maximum"
                name="poidssupporte"
                value={formulaire.poidssupporte}
                onChange={changerChamp}
              />
            </>
          )}
        </Popup>
      )}

      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le type de wagon"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le type de wagon <strong>{selection.libelletypewagon}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default TypesWagon;
