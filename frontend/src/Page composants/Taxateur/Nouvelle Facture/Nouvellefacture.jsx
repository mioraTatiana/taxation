import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./NouvelleFacture.css";
import Etapes from "../../../Simple composants/Etapes/Etapes";
import Popup from "../../../Simple composants/Popup/Popup";
import ProgressionPopup from "../../../Simple composants/ProgressionPopup/ProgressionPopup";
import { trouverLibelle } from "../../../Simple composants/Outils/outils";
import { rouge } from "../../../Simple composants/Couleurs/couleur";
import FactureClient, { CLIENT_VIDE } from "./FactureClient/FactureClient";
import FactureEmbarquement, { EMBARQUEMENT_VIDE } from "./FactureEmbarquement/FactureEmbarquement";
import FactureColis from "./FactureColis/FactureColis";
import { calculerTotaux } from "./calculsFacture";
import {
  CLIENTS_TEST,
  DESTINATIONS_TEST,
  ZONES_TEST,
  TYPES_TRAIN_TEST,
  TYPES_MARCHANDISE_TEST,
  MARCHANDISES_TEST,
  TARIFS_TEST,
} from "../../../Simple composants/Outils//donneesTest";

const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête
const CLE_STOCKAGE = "nouvelleFacture"; // clé du stockage local du navigateur

// TODO : vos URL d'API
const URL_CLIENTS = "/api/clients";
const URL_DESTINATIONS = "/api/destinations";
const URL_ZONES = "/api/zones";
const URL_TYPES_TRAIN = "/api/types-train";
const URL_TYPES_MARCHANDISE = "/api/types-marchandise";
const URL_MARCHANDISES = "/api/marchandises";
const URL_TARIFS = "/api/tarifs";
const URL_FACTURES = "/api/factures";

const ETAPES = [
  { numero: 1, libelle: "Client" },
  { numero: 2, libelle: "Détails sur l’embarquement" },
  { numero: 3, libelle: "Colis à expédier" },
];

const ETAT_INITIAL = {
  etape: 1,
  client: CLIENT_VIDE,
  embarquement: EMBARQUEMENT_VIDE,
  embarquementValide: "", // copie de l'embarquement quand on est passé à l'étape 3
  lignes: [],
  numfacture: "",
};

const DONNEES_VIDES = {
  clients: [],
  destinations: [],
  zones: [],
  typesTrain: [],
  typesMarchandise: [],
  marchandises: [],
  tarifs: [],
};

// ----- Stockage local du navigateur -----
function lireStockage() {
  try {
    const texte = localStorage.getItem(CLE_STOCKAGE);
    return texte ? { ...ETAT_INITIAL, ...JSON.parse(texte) } : ETAT_INITIAL;
  } catch {
    return ETAT_INITIAL;
  }
}

function attendre(millisecondes) {
  return new Promise((resolve) => setTimeout(resolve, millisecondes));
}

// Même format que le trigger de la base : 001/09-10-2026 (utilisé seulement en mode test)
function numeroDeTest() {
  const date = new Date();
  const annee = date.getFullYear();
  const cle = `compteurFactureTest${annee}`;
  const suivant = (Number(localStorage.getItem(cle)) || 0) + 1;
  localStorage.setItem(cle, String(suivant));

  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  return `${String(suivant).padStart(3, "0")}/${jour}-${mois}-${annee}`;
}

function NouvelleFacture() {
  const [facture, setFacture] = useState(lireStockage);
  const [donnees, setDonnees] = useState(DONNEES_VIDES);
  const [progression, setProgression] = useState(null); // { pourcentage, message }
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false);

  // Chaque modification est gardée dans le stockage local (on peut recharger la page)
  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(facture));
    } catch {
      // stockage plein ou indisponible : on continue sans
    }
  }, [facture]);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    if (UTILISER_DONNEES_TEST) {
      setDonnees({
        clients: CLIENTS_TEST,
        destinations: DESTINATIONS_TEST,
        zones: ZONES_TEST,
        typesTrain: TYPES_TRAIN_TEST,
        typesMarchandise: TYPES_MARCHANDISE_TEST,
        marchandises: MARCHANDISES_TEST,
        tarifs: TARIFS_TEST,
      });
      return;
    }
    try {
      const reponses = await Promise.all([
        axios.get(URL_CLIENTS),
        axios.get(URL_DESTINATIONS),
        axios.get(URL_ZONES),
        axios.get(URL_TYPES_TRAIN),
        axios.get(URL_TYPES_MARCHANDISE),
        axios.get(URL_MARCHANDISES),
        axios.get(URL_TARIFS),
      ]);
      setDonnees({
        clients: reponses[0].data,
        destinations: reponses[1].data,
        zones: reponses[2].data,
        typesTrain: reponses[3].data,
        typesMarchandise: reponses[4].data,
        marchandises: reponses[5].data,
        tarifs: reponses[6].data,
      });
    } catch {
      toast.error("Impossible de charger les données de la facture");
    }
  }

  // ----- Valeurs déduites des choix de l'étape 2 -----
  const destination = donnees.destinations.find((d) => d.iddestination === facture.embarquement.iddestination);
  const zoneLibelle = destination ? trouverLibelle(donnees.zones, "idzone", destination.idzone, "libellezone") : "";
  const typeTrain = donnees.typesTrain.find((t) => t.idtypetrain === facture.embarquement.idtypetrain);
  const avecTva = facture.embarquement.tva === "avec";
  const wagonComplet = Boolean(typeTrain && typeTrain.modefacturation);
  const totaux = calculerTotaux(facture.lignes, typeTrain, avecTva);

  // ----- Modifications de l'état -----
  function modifier(champs) {
    setFacture((ancien) => ({ ...ancien, ...champs }));
  }

  function annulerTout() {
    localStorage.removeItem(CLE_STOCKAGE);
    setFacture(ETAT_INITIAL);
    setConfirmerAnnulation(false);
  }

  // Étape 2 -> 3. Si l'embarquement a changé, les prix des colis déjà saisis ne sont plus valables.
  function validerEmbarquement() {
    const instantane = JSON.stringify(facture.embarquement);
    const aChange = facture.embarquementValide !== "" && facture.embarquementValide !== instantane;

    if (aChange && facture.lignes.length > 0) {
      toast.error("L’embarquement a changé : les colis ont été effacés.");
      modifier({ etape: 3, embarquementValide: instantane, lignes: [] });
    } else {
      modifier({ etape: 3, embarquementValide: instantane });
    }
  }

  // Supprimer : retire la ligne ; si elle est déjà en base, on la supprime aussi dans la base
  async function supprimerLigne(index) {
    const ligne = facture.lignes[index];
    try {
      if (!UTILISER_DONNEES_TEST && ligne.iddetailfacture) {
        await axios.delete(`${URL_FACTURES}/details/${ligne.iddetailfacture}`);
      }
      modifier({ lignes: facture.lignes.filter((l, i) => i !== index) });
      toast.success("Marchandise supprimée");
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  // ----- Enregistrement petit à petit, avec barre de progression, puis impression -----
  async function enregistrerFacture() {
    if (facture.lignes.length === 0) {
      toast.error("Ajoutez au moins une marchandise");
      return;
    }
    if (progression) return; // déjà en cours

    const { client, lignes } = facture;
    let idclient = client.idclient;
    let idfacture = null;
    let numero = "";

    // Liste des tâches : chacune fait avancer la barre
    const taches = [];

    if (client.idclient === "") {
      taches.push({
        message: "Enregistrement du client...",
        executer: async () => {
          if (UTILISER_DONNEES_TEST) return attendre(400);
          const { idclient: vide, ...nouveauClient } = client;
          const reponse = await axios.post(URL_CLIENTS, nouveauClient);
          idclient = reponse.data.idclient;
        },
      });
    }

    taches.push({
      message: "Enregistrement de la facture...",
      executer: async () => {
        if (UTILISER_DONNEES_TEST) {
          await attendre(400);
          numero = numeroDeTest();
          return;
        }
        // numfacture est généré par le trigger de la base
        const reponse = await axios.post(URL_FACTURES, {
          datefacture: new Date().toISOString().slice(0, 10),
          nombrecolistotal: totaux.nombrecolistotal,
          poidsreeltotal: totaux.poidsreeltotal,
          poidsfacturetotal: totaux.poidsfacturetotal,
          piquire: totaux.piquire,
          tva: totaux.tva,
          montanthttotal: totaux.montanthttotal,
          montantttc: totaux.montantttc,
          idclient,
          iddestination: facture.embarquement.iddestination,
        });
        idfacture = reponse.data.idfacture;
        numero = reponse.data.numfacture;
      },
    });

    lignes.forEach((ligne, index) => {
      taches.push({
        message: `Enregistrement du colis ${index + 1} sur ${lignes.length}...`,
        executer: async () => {
          if (UTILISER_DONNEES_TEST) return attendre(300);
          await axios.post(`${URL_FACTURES}/${idfacture}/details`, {
            nombrecolis: ligne.nombrecolis,
            poidsreel: ligne.poidsreel,
            poidsfacture: ligne.poidsfacture,
            prixapplicable: ligne.prixapplicable,
            montantht: ligne.montantht,
            idtarif: ligne.idtarif,
            idmarchandise: ligne.idmarchandise,
            nomdefunt: ligne.nomdefunt || null,
          });
        },
      });
    });

    try {
      for (let i = 0; i < taches.length; i++) {
        setProgression({
          pourcentage: Math.round((i / taches.length) * 100),
          message: taches[i].message,
        });
        await taches[i].executer();
      }
      setProgression({ pourcentage: 100, message: "Enregistrement terminé" });
      await attendre(500);

      modifier({ numfacture: numero });
      setProgression(null);

      if (wagonComplet) {
        // Wagon complet : pas d'impression, on revient à la section Client
        toast.success("Facture enregistrée");
        annulerTout();
      } else {
        await attendre(300); // laisse l'écran afficher le numéro avant l'impression
        window.print();
        toast.success("Facture enregistrée");
        annulerTout();
      }
    } catch (erreur) {
      setProgression(null);
      toast.error(erreur.response?.data?.message || "L’enregistrement a échoué");
    }
  }

  return (
    <div className="NouvelleFacture">
      <Etapes etapes={ETAPES} etapeActuelle={facture.etape} />

      <div className="NouvelleFactureCorps">
        {facture.etape === 1 && (
          <FactureClient
            client={facture.client}
            clients={donnees.clients}
            onChange={(client) => modifier({ client })}
            onSuivant={() => modifier({ etape: 2 })}
          />
        )}

        {facture.etape === 2 && (
          <FactureEmbarquement
            embarquement={facture.embarquement}
            destinations={donnees.destinations}
            zones={donnees.zones}
            typesTrain={donnees.typesTrain}
            onChange={(embarquement) => modifier({ embarquement })}
            onRetour={() => modifier({ etape: 1 })}
            onSuivant={validerEmbarquement}
          />
        )}

        {facture.etape === 3 && destination && typeTrain && (
          <FactureColis
            embarquement={facture.embarquement}
            client={facture.client}
            destination={destination}
            zoneLibelle={zoneLibelle}
            typeTrain={typeTrain}
            marchandises={donnees.marchandises}
            typesMarchandise={donnees.typesMarchandise}
            tarifs={donnees.tarifs}
            lignes={facture.lignes}
            totaux={totaux}
            numfacture={facture.numfacture}
            enregistrementEnCours={progression !== null}
            onChangeLignes={(lignes) => modifier({ lignes })}
            onSupprimerLigne={supprimerLigne}
            onRetour={() => modifier({ etape: 2 })}
            onAnnuler={() => setConfirmerAnnulation(true)}
            onEnregistrer={enregistrerFacture}
          />
        )}
      </div>

      {progression && (
        <ProgressionPopup
          titre="Enregistrement de la facture"
          message={progression.message}
          pourcentage={progression.pourcentage}
        />
      )}

      {confirmerAnnulation && (
        <Popup
          titre="Annuler la facture"
          texteConfirmer="Annuler la facture"
          couleur={rouge}
          onConfirmer={annulerTout}
          onFermer={() => setConfirmerAnnulation(false)}
        >
          <p>
            Toutes les données de cette facture seront effacées et vous reviendrez à la section Client.
          </p>
        </Popup>
      )}
    </div>
  );
}

export default NouvelleFacture;
