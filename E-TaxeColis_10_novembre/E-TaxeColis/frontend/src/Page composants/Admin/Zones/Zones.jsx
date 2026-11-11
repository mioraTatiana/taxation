import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Zone.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import CustomInput from "../../../Simple composants/Input/Input";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Route du backend : Route/Admin/zonedestination.js
const URL_ZONES = `${URL_API}/zone`;

// zonedestination(idzone, libellezone, kilometrage) — idzone est créé par la base (ZN01...)
const FORMULAIRE_VIDE = { libellezone: "", kilometrage: "" };

const SCHEMA = z.object({
  libellezone: z
    .string()
    .trim()
    .min(2, "Saisissez le nom de la zone")
    .max(6, "Le nom de la zone : 6 caractères maximum"),
  kilometrage: z.coerce
    .number()
    .int("Le kilométrage doit être un nombre entier")
    .positive("Le kilométrage doit être supérieur à 0")
    .max(999, "Kilométrage : 3 chiffres maximum"),
});

const COLONNES = [
  { titre: "ID", cle: "idzone" },
  { titre: "Zone", cle: "libellezone" },
  { titre: "Kilométrage", cle: "kilometrage", afficher: (valeur) => `${valeur} km` },
];

function Zones() {
  const [zones, setZones] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerZones();
  }, []);

  async function chargerZones() {
    try {
      const reponse = await axios.get(`${URL_ZONES}/selectionnertout`);
      setZones(reponse.data);
    } catch {
      toast.error("Impossible de charger les zones");
    }
  }

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(zone) {
    setFormulaire({ libellezone: zone.libellezone, kilometrage: String(zone.kilometrage) });
    setSelection(zone);
    setMode("modifier");
  }

  function ouvrirSuppression(zone) {
    setSelection(zone);
    setMode("supprimer");
  }

  function fermerPopup() {
    setMode(null);
    setSelection(null);
  }

  function changerChamp(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  }

  function boutonsDeLigne(zone) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(zone) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(zone) },
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
        await axios.post(`${URL_ZONES}/ajouter`, resultat.data);
        toast.success("Zone ajoutée");
      } else {
        await axios.put(`${URL_ZONES}/modifier/${selection.idzone}`, resultat.data);
        toast.success("Zone modifiée");
      }
      fermerPopup();
      chargerZones(); // on relit la liste dans la base
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_ZONES}/supprimer/${selection.idzone}`);
      toast.success("Zone supprimée");
      fermerPopup();
      chargerZones();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="ZonesTitre">Zones</h2>

      <BouttonNouveau texte="Nouvelle zone" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={zones}
        cleLigne="idzone"
        actions={boutonsDeLigne}
        messageVide="Aucune zone"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouvelle zone" : "Modifier la zone"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput type="text" label="Nom de la zone" name="libellezone" value={formulaire.libellezone} onChange={changerChamp} />
          <CustomInput type="number" label="Kilométrage (km)" name="kilometrage" value={formulaire.kilometrage} onChange={changerChamp} />
        </Popup>
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer la zone"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer la zone <strong>{selection.libellezone}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Zones;
