import React, { useState } from "react";
import toast from "react-hot-toast";
import { Package } from "lucide-react";
import "./FactureColis.css";
import Popup from "../../../../Simple composants/Popup/Popup";
import PopupMarchandise from "../../../../Simple composants/PopupMarchandise/PopupMarchandise";
import FormulaireLigne from "../../../../Simple composants/FormulaireLigne/FormulaireLigne";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import BarreProgression from "../../../../Simple composants/BarreProgression/BarreProgression";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";
import { rouge } from "../../../../Simple composants/Couleurs/couleur";
import FactureApercu from "../../Facture/FactureApercu/FactureApercu";
import {
  formaterMontant,
  ajouterLigne,
  remplacerLigne,
  verifierLigne,
  cleLigne,
  estWagonComplet,
  poidsMaxWagon,
  MAX_LIGNES_EXPRESS,
  POIDS_MINIMUM_EXPRESS,
} from "../../../../Simple composants/Outils/calculsFacture";

// Section 3 : colis à expédier (marchandises).
//
//  Le formulaire d'une ligne est le composant FormulaireLigne (aussi utilisé pour modifier une facture
//  dans la page Statistique) :
//    - désignation choisie dans la liste OU écrite à la main (on choisit alors le type)
//    - "Poids réglé" (nombre de colis x poids d'un colis) ou "Poids non réglé" (poids réel écrit)
//  Express (avec / sans TVA) :
//    - avec TVA : marchandises soumises à la TVA ; sans TVA : marchandises non soumises (TVA = 0)
//    - prix applicable = tarif ; poids facturé = poids réel ; montant = poids facturé x prix
//    - 11 marchandises au maximum ; minimum 20 kg facturés
//  Wagon complet (série 100 / 400) :
//    - la 1re ligne (le wagon) est calculée toute seule
//    - les marchandises ajoutées ont un tarif 0 et augmentent les colis / le poids de la 1re ligne
//    - le poids chargé ne doit pas dépasser le poids SUPPORTÉ du wagon (table typewagon)
//  Une marchandise ajoutée deux fois : ses colis et ses poids sont additionnés.

function FactureColis({
  embarquement,
  destination,
  typeWagon,
  typeMarchandiseWagon,
  tarifWagon,
  marchandises,
  typesMarchandise,
  tarifs,
  lignes,
  facture,
  enregistrementEnCours,
  onChangeLignes,
  onMarchandiseAjoutee,
  onRetour,
  onAnnuler,
  onEnregistrer,
}) {
  const [cleModif, setCleModif] = useState(null); // clé de la ligne en cours de modification
  const [departFormulaire, setDepartFormulaire] = useState(null); // ligne mise dans le formulaire
  const [numeroFormulaire, setNumeroFormulaire] = useState(0); // change -> le formulaire se vide
  const [confirmation, setConfirmation] = useState(null); // { type: "supprimer", cle } ou { type: "effacer" }
  const [popupMarchandise, setPopupMarchandise] = useState(false); // pop up "Nouvelle marchandise"

  const wagonComplet = estWagonComplet(typeWagon);
  const avecTva = embarquement.tva === "avec";
  const poidsMax = poidsMaxWagon(typeWagon);

  // Poids déjà chargé (wagon complet)
  const poidsCharge = lignes.reduce((total, ligne) => total + ligne.poidsreel, 0);
  const pourcentageWagon = poidsMax > 0 ? (poidsCharge / poidsMax) * 100 : 0;

  // Types proposés pour une nouvelle marchandise : les mêmes règles de TVA que la liste
  const typesAutorises = wagonComplet
    ? typesMarchandise
    : typesMarchandise.filter((type) => Boolean(type.soumistva) === avecTva);

  // Remet le formulaire à zéro (ou y met une ligne)
  function remplirFormulaire(ligne, cle) {
    setDepartFormulaire(ligne);
    setCleModif(cle);
    setNumeroFormulaire((n) => n + 1);
  }

  // Le formulaire a calculé une ligne : on vérifie puis on l'ajoute (ou on remplace la ligne modifiée)
  function validerLigne(ligne) {
    const erreur = verifierLigne(lignes, ligne, cleModif, typeWagon);
    if (erreur) {
      toast.error(erreur);
      return false;
    }

    if (cleModif !== null) {
      const index = lignes.findIndex((l) => cleLigne(l) === cleModif);
      onChangeLignes(remplacerLigne(lignes, index, ligne, wagonComplet));
      toast.success("Marchandise modifiée");
    } else {
      const dejaPresente = lignes.some((l) => cleLigne(l) === cleLigne(ligne));
      onChangeLignes(ajouterLigne(lignes, ligne, wagonComplet));
      toast.success(dejaPresente ? "Marchandise déjà présente : les poids ont été additionnés" : "Marchandise ajoutée");
    }
    remplirFormulaire(null, null);
    return true;
  }

  // La nouvelle marchandise est enregistrée dans la base : on l'ajoute à la liste et on la sélectionne
  function apresAjoutMarchandise(nouvelle) {
    setPopupMarchandise(false);
    onMarchandiseAjoutee(nouvelle);
    remplirFormulaire({ idmarchandise: nouvelle.idmarchandise, poidsregle: true }, null);
  }

  // Modifier : renvoie la ligne dans le formulaire
  function commencerModification(cle) {
    const ligne = lignes.find((l) => cleLigne(l) === cle);
    if (ligne) remplirFormulaire(ligne, cle);
  }

  function confirmerAction() {
    if (confirmation.type === "supprimer") {
      onChangeLignes(lignes.filter((ligne) => cleLigne(ligne) !== confirmation.cle));
      if (cleModif === confirmation.cle) remplirFormulaire(null, null);
      toast.success("Marchandise supprimée");
    } else {
      onChangeLignes([]); // Effacer : vide toutes les marchandises du stockage local
      remplirFormulaire(null, null);
    }
    setConfirmation(null);
  }

  return (
    <div>
      <div className="ColisEntete">
        <EnteteSection
          icone={Package}
          titre="Colis à expédier"
          sousTitre={
            wagonComplet
              ? `${typeWagon.libelletypewagon} – taxé en ${typeMarchandiseWagon ? typeMarchandiseWagon.libelletype : ""}`
              : `Express ${avecTva ? "avec TVA" : "sans TVA"}`
          }
        />

        {/* Compteur : nombre de marchandises (express) ou poids chargé (wagon complet) */}
        <div className="ColisCompteur">
          {wagonComplet ? (
            <>
              <strong>Poids : {formaterMontant(poidsCharge)} kg</strong>
              <BarreProgression pourcentage={pourcentageWagon} afficherTexte={false} />
              <span className="ColisCompteurNote">
                supporté : {formaterMontant(poidsMax)} kg – facturé : {formaterMontant(typeWagon.poidsfacturation)} kg
              </span>
            </>
          ) : (
            <>
              <strong>
                {lignes.length} / {MAX_LIGNES_EXPRESS} marchandises
              </strong>
              <span className="ColisCompteurNote">Minimum facturé : {POIDS_MINIMUM_EXPRESS} kg</span>
            </>
          )}
        </div>
      </div>

      {wagonComplet && !tarifWagon && (
        <p className="ColisErreur">
          Aucun tarif {typeMarchandiseWagon ? typeMarchandiseWagon.libelletype : ""} en {typeWagon.libelletypewagon} pour
          la zone de cette destination : ajoutez-le dans la page Tarif.
        </p>
      )}

      <div className="ColisCorps">
        {/* ===== 1er div : enregistrement des marchandises ===== */}
        <div className="ColisFormulaire">
          <FormulaireLigne
            key={numeroFormulaire}
            wagonComplet={wagonComplet}
            avecTva={avecTva}
            idzone={destination.idzone}
            typeWagon={typeWagon}
            tarifWagon={tarifWagon}
            idwagon={embarquement.idwagon}
            marchandises={marchandises}
            typesMarchandise={typesMarchandise}
            tarifs={tarifs}
            ligneDepart={departFormulaire}
            onValider={validerLigne}
            texteBouton={cleModif !== null ? "Modifier" : "Ajouter"}
            onNouvelleMarchandise={cleModif === null ? () => setPopupMarchandise(true) : undefined}
          >
            {cleModif !== null && (
              <button type="button" className="LigneSecondaire" style={{ borderColor: "#6b7280", color: "#6b7280" }} onClick={() => remplirFormulaire(null, null)}>
                Annuler la modification
              </button>
            )}
            <button
              type="button"
              className="LigneSecondaire"
              style={{ borderColor: rouge, color: rouge }}
              onClick={() => setConfirmation({ type: "effacer" })}
              disabled={lignes.length === 0}
            >
              Effacer
            </button>
          </FormulaireLigne>
        </div>

        {/* ===== 2e div : facture avec les données enregistrées ===== */}
        <div className="ColisApercu">
          <FactureApercu
            facture={facture}
            onModifier={commencerModification}
            onSupprimer={(cle) => setConfirmation({ type: "supprimer", cle })}
            texteAction={enregistrementEnCours ? "Enregistrement..." : "Enregistrer et imprimer"}
            onAction={onEnregistrer}
            actionDesactivee={enregistrementEnCours || lignes.length === 0}
          />
        </div>
      </div>

      {/* Pas de bouton Suivant dans cette section */}
      <BarreNavigation onRetour={onRetour} onAnnuler={onAnnuler} />

      {popupMarchandise && (
        <PopupMarchandise
          marchandise={null}
          typesMarchandise={typesAutorises}
          valeursDepart={typesAutorises.length === 1 ? { idtypemarchandise: String(typesAutorises[0].idtypemarchandise) } : {}}
          onEnregistre={apresAjoutMarchandise}
          onFermer={() => setPopupMarchandise(false)}
        />
      )}

      {confirmation && (
        <Popup
          titre={confirmation.type === "supprimer" ? "Supprimer la marchandise" : "Effacer les marchandises"}
          texteConfirmer={confirmation.type === "supprimer" ? "Supprimer" : "Effacer"}
          couleur={rouge}
          onConfirmer={confirmerAction}
          onFermer={() => setConfirmation(null)}
        >
          <p>
            {confirmation.type === "supprimer"
              ? "Voulez-vous vraiment supprimer cette marchandise ?"
              : "Voulez-vous vraiment effacer toutes les marchandises enregistrées ?"}
          </p>
        </Popup>
      )}
    </div>
  );
}

export default FactureColis;
