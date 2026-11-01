import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Wagon.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import CustomInput from "../../../Simple composants/Input/Input";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Routes du backend : Route/Admin/wagon.js et Route/Admin/typewagon.js
const URL_WAGONS = `${URL_API}/wagon`;
const URL_TYPES_WAGON = `${URL_API}/typewagon`;

// wagon(idwagon, libellewagon, idtypewagon) — idwagon est un entier créé par la base
const FORMULAIRE_VIDE = { libellewagon: "", idtypewagon: "" };

// libellewagon = 20 caractères maximum
const SCHEMA = z.object({
  libellewagon: z.string().trim().min(2, "Saisissez le nom du wagon").max(20, "Nom du wagon : 20 caractères maximum"),
  idtypewagon: z.string().min(1, "Choisissez un type de wagon"),
});

// Le backend renvoie déjà le libellé du type (jointure)
const COLONNES = [
  { titre: "ID", cle: "idwagon" },
  { titre: "Wagon", cle: "libellewagon" },
  { titre: "Type de wagon", cle: "libelletypewagon" },
];

function Wagon() {
  const [wagons, setWagons] = useState([]);
  const [typesWagon, setTypesWagon] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [rWagons, rTypes] = await Promise.all([
        axios.get(`${URL_WAGONS}/selectionnertout`),
        axios.get(`${URL_TYPES_WAGON}/selectionnertout`),
      ]);
      setWagons(rWagons.data);
      setTypesWagon(rTypes.data);
    } catch {
      toast.error("Impossible de charger les wagons");
    }
  }

  const optionsTypes = typesWagon.map((type) => ({
    value: type.idtypewagon,
    label: type.libelletypewagon,
    description: type.modefacturation ? "Wagon complet" : "Par les marchandises",
  }));

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(wagon) {
    setFormulaire({ libellewagon: wagon.libellewagon, idtypewagon: wagon.idtypewagon });
    setSelection(wagon);
    setMode("modifier");
  }

  function ouvrirSuppression(wagon) {
    setSelection(wagon);
    setMode("supprimer");
  }

  function fermerPopup() {
    setMode(null);
    setSelection(null);
  }

  function boutonsDeLigne(wagon) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(wagon) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(wagon) },
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
        await axios.post(`${URL_WAGONS}/ajouter`, resultat.data);
        toast.success("Wagon ajouté");
      } else {
        await axios.put(`${URL_WAGONS}/modifier/${selection.idwagon}`, resultat.data);
        toast.success("Wagon modifié");
      }
      fermerPopup();
      chargerDonnees();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_WAGONS}/supprimer/${selection.idwagon}`);
      toast.success("Wagon supprimé");
      fermerPopup();
      chargerDonnees();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="WagonTitre">Wagons</h2>

      <BouttonNouveau texte="Nouveau wagon" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={wagons}
        cleLigne="idwagon"
        actions={boutonsDeLigne}
        messageVide="Aucun wagon"
      />

      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau wagon" : "Modifier le wagon"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput
            type="text"
            label="Nom du wagon (ex: S100-01)"
            name="libellewagon"
            value={formulaire.libellewagon}
            onChange={(e) => setFormulaire({ ...formulaire, libellewagon: e.target.value })}
          />
          <SelectInput
            label="Type de wagon"
            name="idtypewagon"
            options={optionsTypes}
            value={formulaire.idtypewagon}
            onChange={(valeur) => setFormulaire({ ...formulaire, idtypewagon: valeur })}
            placeholder="Sélectionner un type de wagon"
            searchPlaceholder="Rechercher un type..."
          />
        </Popup>
      )}

      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le wagon"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le wagon <strong>{selection.libellewagon}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Wagon;
