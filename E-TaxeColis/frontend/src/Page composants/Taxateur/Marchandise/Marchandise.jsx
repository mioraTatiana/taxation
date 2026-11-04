import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Marchandise.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import PopupMarchandise from "../../../Simple composants/PopupMarchandise/PopupMarchandise";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Routes du backend : Route/Taxateur/marchandise.js et Route/Taxateur/typemarchandise.js
const URL_MARCHANDISES = `${URL_API}/marchandise`;
const URL_TYPES_MARCHANDISE = `${URL_API}/typemarchandise`;

// marchandise(idmarchandise, designation, poidscolis, idtypemarchandise)
// Le pop up d'ajout / modification est partagé avec la nouvelle facture (PopupMarchandise)

function Marchandise() {
  const [marchandises, setMarchandises] = useState([]);
  const [typesMarchandise, setTypesMarchandise] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);

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
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(marchandise) {
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

  function boutonsDeLigne(marchandise) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(marchandise) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(marchandise) },
    ];
  }

  // Après l'ajout ou la modification dans le pop up
  function apresEnregistrement() {
    fermerPopup();
    chargerDonnees(); // on relit la liste dans la base
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
        <PopupMarchandise
          marchandise={mode === "modifier" ? selection : null}
          typesMarchandise={typesMarchandise}
          onEnregistre={apresEnregistrement}
          onFermer={fermerPopup}
        />
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

