import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./PopupModifierFacture.css";
import Popup from "../../../../Simple composants/Popup/Popup";
import FormulaireLigne from "../../../../Simple composants/FormulaireLigne/FormulaireLigne";
import { vert } from "../../../../Simple composants/Couleurs/couleur";
import FactureApercu from "../../../Taxateur/Facture/FactureApercu/FactureApercu";
import { URL_API, messageErreur } from "../../../../Simple composants/Outils/api";
import {
  cleLigne,
  ajouterLigne,
  remplacerLigne,
  verifierLigne,
  creerLigneWagon,
  calculerTotaux,
  lignesPourEnvoi,
} from "../../../../Simple composants/Outils/calculsFacture";

// Pop up "Modifier la facture" (page Statistique, chef de division et receveur).
// Seules les LIGNES (detailfacture) changent : le client, la destination, le numéro et la date restent.
// Le formulaire est le même que "Colis à expédier" (FormulaireLigne) ; les totaux sont recalculés
// avec les mêmes règles (calculsFacture.js), puis envoyés à PUT /facturemarchandise/modifier/:id.
//
// Wagon complet : la 1re ligne (le wagon) garde son prix et son poids facturé d'origine ;
// on modifie les marchandises chargées.
//
//  facture      : une facture de /statistique/marchandise (avec "details")
//  onEnregistre : appelé avec la facture modifiée (relue dans la base)

function PopupModifierFacture({ facture, onEnregistre, onFermer }) {
  const [tables, setTables] = useState(null); // marchandises, types, tarifs, types de wagon
  const wagonComplet = Boolean(facture.modefacturation);
  const ligneWagonDepart = wagonComplet ? facture.details[0] : null;

  // Les lignes modifiables (wagon complet : sans la ligne du wagon)
  const [lignes, setLignes] = useState(() =>
    (wagonComplet ? facture.details.slice(1) : facture.details).map((l) => ({ ...l, cle: cleLigne(l) }))
  );
  const [cleModif, setCleModif] = useState(null);
  const [depart, setDepart] = useState(null);
  const [numeroFormulaire, setNumeroFormulaire] = useState(0);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${URL_API}/marchandise/selectionnertout`),
      axios.get(`${URL_API}/typemarchandise/selectionnertout`),
      axios.get(`${URL_API}/tarifmarchandise/selectionnertout`),
      axios.get(`${URL_API}/typewagon/selectionnertout`),
    ])
      .then(([m, t, ta, tw]) => setTables({ marchandises: m.data, types: t.data, tarifs: ta.data, typesWagon: tw.data }))
      .catch(() => toast.error("Impossible de charger les marchandises et les tarifs"));
  }, []);

  if (!tables) {
    return (
      <Popup titre="Modifier la facture" texteConfirmer="Fermer" sansAnnuler onConfirmer={onFermer} onFermer={onFermer}>
        <p>Chargement...</p>
      </Popup>
    );
  }

  // ----- L'embarquement de la facture -----
  const typeWagonBase = tables.typesWagon.find((t) => t.idtypewagon === facture.idtypewagon) || {
    idtypewagon: facture.idtypewagon,
    modefacturation: wagonComplet,
    poidsfacturation: facture.poidsfacturation,
    poidssupporte: facture.poidssupporte,
  };
  // Wagon complet : on garde le poids facturé et le prix de la facture d'origine
  const typeWagon = wagonComplet ? { ...typeWagonBase, poidsfacturation: ligneWagonDepart.poidsfacture } : typeWagonBase;
  const tarifWagon = wagonComplet
    ? { idtarifmarchandise: ligneWagonDepart.idtarifmarchandise, prixkg: ligneWagonDepart.prixapplicable }
    : null;
  const typeMarchandiseWagon = wagonComplet
    ? { idtypemarchandise: ligneWagonDepart.idtypemarchandise, libelletype: ligneWagonDepart.designation }
    : null;
  const idwagon = wagonComplet ? ligneWagonDepart.idwagon : null;
  const avecTva = Number(facture.tva) > 0;

  // ----- Facture recalculée -----
  const ligneWagon = wagonComplet ? creerLigneWagon(lignes, typeMarchandiseWagon, tarifWagon, typeWagon, idwagon) : null;
  const lignesFacture = wagonComplet ? [ligneWagon, ...lignes] : lignes;
  const totaux = calculerTotaux(wagonComplet ? (lignes.length > 0 ? [ligneWagon] : []) : lignes, wagonComplet, avecTva);
  const factureAffichee = { ...facture, details: lignesFacture, ...totaux, piquiremarchandise: totaux.piquiremarchandise };

  function remplir(ligne, cle) {
    setDepart(ligne);
    setCleModif(cle);
    setNumeroFormulaire((n) => n + 1);
  }

  function validerLigne(ligne) {
    const erreur = verifierLigne(lignes, ligne, cleModif, typeWagon);
    if (erreur) {
      toast.error(erreur);
      return false;
    }
    if (cleModif !== null) {
      const index = lignes.findIndex((l) => cleLigne(l) === cleModif);
      setLignes(remplacerLigne(lignes, index, ligne, wagonComplet));
    } else {
      setLignes(ajouterLigne(lignes, ligne, wagonComplet));
    }
    remplir(null, null);
    return true;
  }

  function supprimerLigne(cle) {
    setLignes(lignes.filter((l) => cleLigne(l) !== cle));
    if (cleModif === cle) remplir(null, null);
  }

  async function enregistrer() {
    if (enCours) return;
    if (lignes.length === 0) {
      toast.error("La facture doit garder au moins une marchandise");
      return;
    }
    setEnCours(true);
    try {
      const reponse = await axios.put(`${URL_API}/facturemarchandise/modifier/${facture.idfacturemarchandise}`, {
        ...totaux,
        lignes: lignesPourEnvoi(lignesFacture),
      });
      toast.success(`Facture ${facture.numfacturemarchandise} modifiée`);
      onEnregistre(reponse.data);
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
    setEnCours(false);
  }

  return (
    <Popup
      large
      titre={`Modifier la facture ${facture.numfacturemarchandise}`}
      texteConfirmer={enCours ? "Enregistrement..." : "Enregistrer les modifications"}
      couleur={vert}
      onConfirmer={enregistrer}
      onFermer={onFermer}
    >
      <p className="ModifierFactureInfo">
        Client : <strong>{facture.nomclient}</strong> – Destination : <strong>{facture.nomdestination}</strong> –{" "}
        {wagonComplet ? `Wagon complet ${facture.libelletypewagon}` : `Express ${avecTva ? "avec TVA" : "sans TVA"}`}
      </p>

      <div className="ModifierFactureCorps">
        <div className="ModifierFactureFormulaire">
          <FormulaireLigne
            key={numeroFormulaire}
            wagonComplet={wagonComplet}
            avecTva={avecTva}
            idzone={facture.idzone}
            typeWagon={typeWagon}
            tarifWagon={tarifWagon}
            idwagon={idwagon}
            marchandises={tables.marchandises}
            typesMarchandise={tables.types}
            tarifs={tables.tarifs}
            ligneDepart={depart}
            onValider={validerLigne}
            texteBouton={cleModif !== null ? "Modifier la ligne" : "Ajouter la ligne"}
          >
            {cleModif !== null && (
              <button
                type="button"
                className="LigneSecondaire"
                style={{ borderColor: "#6b7280", color: "#6b7280" }}
                onClick={() => remplir(null, null)}
              >
                Annuler la modification de la ligne
              </button>
            )}
          </FormulaireLigne>
        </div>

        <div className="ModifierFactureApercu">
          <FactureApercu
            facture={factureAffichee}
            onModifier={(cle) => remplir(lignes.find((l) => cleLigne(l) === cle), cle)}
            onSupprimer={supprimerLigne}
          />
        </div>
      </div>
    </Popup>
  );
}

export default PopupModifierFacture;
