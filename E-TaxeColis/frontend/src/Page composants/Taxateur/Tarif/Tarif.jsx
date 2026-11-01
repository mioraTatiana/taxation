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
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Routes du backend : Route/Taxateur/tarifmarchandise.js (+ zone, typemarchandise, typewagon)
const URL_TARIFS = `${URL_API}/tarifmarchandise`;

// tarifmarchandise(idtarifmarchandise, idzone, idtypemarchandise, idtypewagon, prixkg)
// Un seul tarif par zone + type de marchandise + type de wagon
const FORMULAIRE_VIDE = { idzone: "", idtypemarchandise: "", idtypewagon: "", prixkg: "" };

const SCHEMA = z.object({
  idzone: z.string().min(1, "Choisissez une zone"),
  idtypemarchandise: z.string().min(1, "Choisissez un type de marchandise"),
  idtypewagon: z.string().min(1, "Choisissez un type de wagon"),
  prixkg: z.coerce
    .number()
    .int("Le prix doit être un nombre entier")
    .positive("Le prix doit être supérieur à 0")
    .max(9999, "Prix au kg : 4 chiffres maximum"),
});

// Le backend renvoie déjà les libellés (jointures)
const COLONNES = [
  { titre: "ID", cle: "idtarifmarchandise" },
  { titre: "Zone", cle: "libellezone" },
  { titre: "Type de marchandise", cle: "libelletype" },
  { titre: "Type de wagon", cle: "libelletypewagon" },
  {
    titre: "Prix / kg",
    cle: "prixkg",
    afficher: (valeur) => `${Number(valeur).toLocaleString("fr-FR")} Ar`,
  },
];

function Tarif() {
  const [tarifs, setTarifs] = useState([]);
  const [zones, setZones] = useState([]);
  const [typesMarchandise, setTypesMarchandise] = useState([]);
  const [typesWagon, setTypesWagon] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [rTarifs, rZones, rTypes, rWagons] = await Promise.all([
        axios.get(`${URL_TARIFS}/selectionnertout`),
        axios.get(`${URL_API}/zone/selectionnertout`),
        axios.get(`${URL_API}/typemarchandise/selectionnertout`),
        axios.get(`${URL_API}/typewagon/selectionnertout`),
      ]);
      setTarifs(rTarifs.data);
      setZones(rZones.data);
      setTypesMarchandise(rTypes.data);
      setTypesWagon(rWagons.data);
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

  const optionsTypesWagon = typesWagon.map((type) => ({
    value: type.idtypewagon,
    label: type.libelletypewagon,
    description: type.modefacturation ? "Wagon complet" : "Par les marchandises",
  }));

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(tarif) {
    setFormulaire({
      idzone: tarif.idzone,
      idtypemarchandise: tarif.idtypemarchandise,
      idtypewagon: tarif.idtypewagon,
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
        await axios.post(`${URL_TARIFS}/ajouter`, resultat.data);
        toast.success("Tarif ajouté");
      } else {
        await axios.put(`${URL_TARIFS}/modifier/${selection.idtarifmarchandise}`, resultat.data);
        toast.success("Tarif modifié");
      }
      fermerPopup();
      chargerDonnees(); // on relit la liste dans la base
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_TARIFS}/supprimer/${selection.idtarifmarchandise}`);
      toast.success("Tarif supprimé");
      fermerPopup();
      chargerDonnees();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="TarifTitre">Tarifs des marchandises</h2>

      <BouttonNouveau texte="Nouveau tarif" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={tarifs}
        cleLigne="idtarifmarchandise"
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
            label="Type de wagon"
            name="idtypewagon"
            options={optionsTypesWagon}
            value={formulaire.idtypewagon}
            onChange={(valeur) => changerSelect("idtypewagon", valeur)}
            placeholder="Sélectionner un type de wagon"
            searchPlaceholder="Rechercher un type de wagon..."
          />
          <CustomInput
            type="number"
            label="Prix par kg (Ar)"
            name="prixkg"
            value={formulaire.prixkg}
            onChange={(e) => changerSelect("prixkg", e.target.value)}
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
            Voulez-vous vraiment supprimer le tarif <strong>{selection.idtarifmarchandise}</strong> (
            {selection.libellezone}, {selection.libelletype}, {selection.libelletypewagon}) ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Tarif;
