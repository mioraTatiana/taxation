import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./TarifFuneraire.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import CustomInput from "../../../Simple composants/Input/Input";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Route du backend : Route/Taxateur/tariffuneraire.js
// Même structure que la page Tarif (tarifs des marchandises).
const URL_TARIFS_FUNERAIRES = `${URL_API}/tariffuneraire`;

// tariffuneraire(idtariffuneraire, idzone, prixfixe, prixzone) — idtariffuneraire créé par la base (TF01...)
// Facture funéraire : montant HT = prix fixe x tarif de la zone
// Un seul tarif funéraire par zone
const FORMULAIRE_VIDE = { idzone: "", prixfixe: "", prixzone: "" };

// Tailles de la base : prixfixe = 5 chiffres, prixzone = 4 chiffres
const SCHEMA = z.object({
  idzone: z.string().min(1, "Choisissez une zone"),
  prixfixe: z.coerce
    .number()
    .int("Le prix fixe doit être un nombre entier")
    .positive("Le prix fixe doit être supérieur à 0")
    .max(99999, "Prix fixe : 5 chiffres maximum"),
  prixzone: z.coerce
    .number()
    .int("Le tarif doit être un nombre entier")
    .positive("Le tarif doit être supérieur à 0")
    .max(9999, "Tarif de la zone : 4 chiffres maximum"),
});

function formaterAr(valeur) {
  return `${Number(valeur || 0).toLocaleString("fr-FR")} Ar`;
}

const COLONNES = [
  { titre: "ID", cle: "idtariffuneraire" },
  { titre: "Zone", cle: "libellezone", afficher: (valeur) => valeur || "-" },
  { titre: "Prix fixe", cle: "prixfixe", afficher: (valeur) => Number(valeur).toLocaleString("fr-FR") },
  { titre: "Tarif de la zone", cle: "prixzone", afficher: formaterAr },
  {
    titre: "Montant HT (= prix fixe × tarif)",
    cle: "montant",
    afficher: (valeur, tarif) => formaterAr(tarif.prixfixe * tarif.prixzone),
  },
];

function TarifFuneraire() {
  const [tarifs, setTarifs] = useState([]);
  const [zones, setZones] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [rTarifs, rZones] = await Promise.all([
        axios.get(`${URL_TARIFS_FUNERAIRES}/selectionnertout`),
        axios.get(`${URL_API}/zone/selectionnertout`),
      ]);
      setTarifs(rTarifs.data);
      setZones(rZones.data);
    } catch {
      toast.error("Impossible de charger les tarifs funéraires");
    }
  }

  const optionsZones = zones.map((zone) => ({
    value: zone.idzone,
    label: zone.libellezone,
    description: `${zone.kilometrage} km`,
  }));

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(tarif) {
    setFormulaire({
      idzone: tarif.idzone || "",
      prixfixe: String(tarif.prixfixe),
      prixzone: String(tarif.prixzone ?? ""),
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

  function changerChamp(nom, valeur) {
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
        await axios.post(`${URL_TARIFS_FUNERAIRES}/ajouter`, resultat.data);
        toast.success("Tarif funéraire ajouté");
      } else {
        await axios.put(`${URL_TARIFS_FUNERAIRES}/modifier/${selection.idtariffuneraire}`, resultat.data);
        toast.success("Tarif funéraire modifié");
      }
      fermerPopup();
      chargerDonnees();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_TARIFS_FUNERAIRES}/supprimer/${selection.idtariffuneraire}`);
      toast.success("Tarif funéraire supprimé");
      fermerPopup();
      chargerDonnees();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  // Aperçu du montant HT dans le pop up
  const montantApercu = Number(formulaire.prixfixe || 0) * Number(formulaire.prixzone || 0);

  return (
    <div>
      <h2 className="TarifFuneraireTitre">Tarifs des transports funéraires</h2>

      <BouttonNouveau texte="Nouveau tarif funéraire" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={tarifs}
        cleLigne="idtariffuneraire"
        actions={boutonsDeLigne}
        messageVide="Aucun tarif funéraire"
      />

      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau tarif funéraire" : "Modifier le tarif funéraire"}
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
            onChange={(valeur) => changerChamp("idzone", valeur)}
            placeholder="Sélectionner une zone"
            searchPlaceholder="Rechercher une zone..."
          />
          <CustomInput
            type="number"
            label="Prix fixe"
            name="prixfixe"
            value={formulaire.prixfixe}
            onChange={(e) => changerChamp("prixfixe", e.target.value)}
          />
          <CustomInput
            type="number"
            label="Tarif de la zone (Ar)"
            name="prixzone"
            value={formulaire.prixzone}
            onChange={(e) => changerChamp("prixzone", e.target.value)}
          />
          <CustomInput
            type="text"
            label="Montant HT d'une facture (= prix fixe × tarif)"
            name="montant"
            value={montantApercu > 0 ? formaterAr(montantApercu) : ""}
            readOnly
          />
        </Popup>
      )}

      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le tarif funéraire"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le tarif <strong>{selection.idtariffuneraire}</strong> (
            {selection.libellezone || "sans zone"}) ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default TarifFuneraire;
