import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Nouvellefacture.css";
import Etapes from "../../../Simple composants/Etapes/Etapes";
import Popup from "../../../Simple composants/Popup/Popup";
import ProgressionPopup from "../../../Simple composants/ProgressionPopup/ProgressionPopup";
import { rouge } from "../../../Simple composants/Couleurs/couleur";
import FactureClient from "./FactureClient/FactureClient";
import FactureEmbarquement, { EMBARQUEMENT_VIDE } from "./FactureEmbarquement/FactureEmbarquement";
import FactureColis from "./FactureColis/FactureColis";
import FactureFuneraire from "./FactureFuneraire/FactureFuneraire";
import Fcelogo from "../../../Image/logo.png";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";
import {
  calculerTotaux,
  calculerFuneraire,
  creerLigneWagon,
  estWagonComplet,
  trouverTarif,
  trouverTarifFuneraire,
} from "../../../Simple composants/Outils/calculsFacture";
import { genererPdfFacture, genererPdfFuneraire } from "../../../Simple composants/Outils/pdfFacture";

const CLE_STOCKAGE = "nouvelleFacture"; // clé du stockage local du navigateur

const ETAPES = [
  { numero: 1, libelle: "Client" },
  { numero: 2, libelle: "Détails sur l’embarquement" },
  { numero: 3, libelle: "Colis à expédier" },
];

const ETAT_INITIAL = {
  etape: 1,
  client: null, // ligne de la table client
  embarquement: EMBARQUEMENT_VIDE,
  embarquementValide: "", // copie de l'embarquement quand on est passé à l'étape 3
  lignes: [], // marchandises (sans la ligne "wagon complet", qui est calculée)
  nomdefunt: "", // transport funéraire
};

const DONNEES_VIDES = {
  clients: [],
  destinations: [],
  typesWagon: [],
  wagons: [],
  typesMarchandise: [],
  marchandises: [],
  tarifs: [],
  tarifsFuneraires: [],
};

// Les tables à charger, et la route du backend de chacune
const ROUTES = {
  clients: "/client/selectionnertout",
  destinations: "/destination/selectionnertout",
  typesWagon: "/typewagon/selectionnertout",
  wagons: "/wagon/selectionnertout",
  typesMarchandise: "/typemarchandise/selectionnertout",
  marchandises: "/marchandise/selectionnertout",
  tarifs: "/tarifmarchandise/selectionnertout",
  tarifsFuneraires: "/tariffuneraire/selectionnertout",
};

// ----- Stockage local du navigateur : on peut recharger la page sans rien perdre -----
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

function NouvelleFacture() {
  const [facture, setFacture] = useState(lireStockage);
  const [donnees, setDonnees] = useState(DONNEES_VIDES);
  const [progression, setProgression] = useState(null); // { pourcentage, message }
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false);

  // Chaque modification est gardée dans le stockage local
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
    try {
      const noms = Object.keys(ROUTES);
      const reponses = await Promise.all(noms.map((nom) => axios.get(`${URL_API}${ROUTES[nom]}`)));
      const resultat = {};
      noms.forEach((nom, index) => {
        resultat[nom] = reponses[index].data;
      });
      setDonnees(resultat);
    } catch {
      toast.error("Impossible de charger les données de la facture");
    }
  }

  // ----- Valeurs déduites des choix de l'étape 2 -----
  const { embarquement, client, lignes } = facture;
  const destination = donnees.destinations.find((d) => d.iddestination === embarquement.iddestination);
  const funeraire = embarquement.transport === "funeraire";
  const typeWagon = donnees.typesWagon.find((t) => t.idtypewagon === embarquement.idtypewagon);
  const wagonComplet = estWagonComplet(typeWagon);

  // Wagon complet : type de marchandise de la taxation (PPN ou Divers) et son tarif
  const typeMarchandiseWagon = donnees.typesMarchandise.find(
    (t) => t.idtypemarchandise === embarquement.idtypemarchandisewagon
  );
  const tarifWagon =
    wagonComplet && destination && typeMarchandiseWagon
      ? trouverTarif(donnees.tarifs, destination.idzone, typeMarchandiseWagon.idtypemarchandise, typeWagon.idtypewagon)
      : null;

  // Wagon complet : la 1re ligne est le wagon (colis et poids = somme des marchandises)
  const ligneWagon = wagonComplet
    ? creerLigneWagon(lignes, typeMarchandiseWagon, tarifWagon, typeWagon, embarquement.idwagon)
    : null;

  // Lignes de la facture (enregistrées dans detailfacture) et lignes qui comptent dans les totaux
  const lignesFacture = wagonComplet ? [ligneWagon, ...lignes] : lignes;
  const lignesFacturees = wagonComplet ? (lignes.length > 0 ? [ligneWagon] : []) : lignes;

  // TVA : Express = choix Avec / Sans ; wagon complet = selon le type PPN / Divers
  const avecTva = wagonComplet ? Boolean(typeMarchandiseWagon && typeMarchandiseWagon.soumistva) : embarquement.tva === "avec";
  const totaux = calculerTotaux(lignesFacturees, wagonComplet, avecTva);

  // Informations communes affichées sur les factures
  const enteteFacture = {
    nomclient: client ? client.nomclient : "",
    sigle: client ? client.sigle : "",
    telephone: client ? client.telephone : "",
    adresse: client ? client.adresse : "",
    nomdestination: destination ? destination.nomdestination : "",
    libellezone: destination ? destination.libellezone : "",
  };

  // Facture marchandise affichée (mêmes noms que les colonnes de la base)
  const factureMarchandise = {
    ...enteteFacture,
    numfacturemarchandise: "",
    libelletypewagon: typeWagon ? typeWagon.libelletypewagon : "",
    modefacturation: wagonComplet,
    details: lignesFacture,
    ...totaux,
  };

  // Transport funéraire : tarif de la zone de la destination
  const tarifFuneraire = destination ? trouverTarifFuneraire(donnees.tarifsFuneraires, destination.idzone) : null;
  const factureFuneraire = {
    ...enteteFacture,
    numfacturefuneraire: "",
    nomdefunt: facture.nomdefunt,
    ...calculerFuneraire(tarifFuneraire),
  };

  // ----- Modifications de l'état -----
  function modifier(champs) {
    setFacture((ancien) => ({ ...ancien, ...champs }));
  }

  function annulerTout() {
    localStorage.removeItem(CLE_STOCKAGE);
    setFacture(ETAT_INITIAL);
    setConfirmerAnnulation(false);
  }

  // Un nouveau client vient d'être ajouté dans la base (bouton "Nouveau client")
  function clientAjoute(nouveau) {
    setDonnees((ancien) => ({ ...ancien, clients: [...ancien.clients, nouveau] }));
    modifier({ client: nouveau });
  }

  // Nouvelle marchandise ajoutée depuis la section "Colis à expédier"
  function marchandiseAjoutee(nouvelle) {
    setDonnees((ancien) => ({ ...ancien, marchandises: [...ancien.marchandises, nouvelle] }));
  }

  // Étape 2 -> 3. Si l'embarquement a changé, les marchandises déjà saisies ne sont plus valables.
  function validerEmbarquement() {
    const instantane = JSON.stringify(embarquement);
    const aChange = facture.embarquementValide !== "" && facture.embarquementValide !== instantane;

    if (aChange && lignes.length > 0) {
      toast.error("L’embarquement a changé : les marchandises ont été effacées.");
      modifier({ etape: 3, embarquementValide: instantane, lignes: [] });
    } else {
      modifier({ etape: 3, embarquementValide: instantane });
    }
  }

  // ----- Facture marchandise : une seule requête (le backend enregistre la facture puis ses lignes) -----
  // Le taxateur (iduser) n'est pas envoyé : le backend le lit dans le jeton de connexion.
  async function enregistrerFacture() {
    if (progression) return; // déjà en cours
    if (lignes.length === 0) {
      toast.error("Ajoutez au moins une marchandise");
      return;
    }
    if (wagonComplet && !tarifWagon) {
      toast.error("Aucun tarif pour ce wagon complet dans la zone de cette destination");
      return;
    }

    setProgression({ pourcentage: 30, message: "Enregistrement de la facture..." });

    let enregistree;
    try {
      const reponse = await axios.post(`${URL_API}/facturemarchandise/ajouter`, {
        ...totaux,
        idclient: client.idclient,
        iddestination: destination.iddestination,
        lignes: lignesFacture.map((ligne) => ({
          nombrecolis: ligne.nombrecolis,
          poidsreel: ligne.poidsreel,
          poidsfacture: ligne.poidsfacture,
          prixapplicable: ligne.prixapplicable,
          montantht: ligne.montantht,
          idtarifmarchandise: ligne.idtarifmarchandise,
          idmarchandise: ligne.idmarchandise, // null pour la ligne "wagon complet"
          idwagon: ligne.idwagon,
        })),
      });
      enregistree = reponse.data; // { idfacturemarchandise, numfacturemarchandise, datefacturemarchandise }
    } catch (erreur) {
      setProgression(null);
      toast.error(messageErreur(erreur, "L’enregistrement a échoué"));
      return;
    }

    // Facture enregistrée : PDF (une page paysage, deux exemplaires).
    // S'il échoue, la facture reste enregistrée : on peut la réimprimer depuis la page Facture.
    setProgression({ pourcentage: 80, message: "Création du PDF..." });
    try {
      // On garde nos lignes (avec la désignation) et on ajoute le numéro et la date donnés par la base
      await genererPdfFacture(
        {
          ...factureMarchandise,
          numfacturemarchandise: enregistree.numfacturemarchandise,
          datefacturemarchandise: enregistree.datefacturemarchandise,
        },
        Fcelogo,
        true
      );
    } catch (erreurPdf) {
      console.error(erreurPdf);
      toast.error("Facture enregistrée, mais le PDF n’a pas pu être créé");
    }

    setProgression({ pourcentage: 100, message: "Terminé" });
    await attendre(400);
    setProgression(null);
    toast.success(`Facture ${enregistree.numfacturemarchandise} enregistrée`);
    annulerTout();
  }

  // ----- Transport funéraire : une seule facture, sans lignes de marchandises -----
  async function enregistrerFuneraire() {
    if (progression) return;
    if (facture.nomdefunt.trim() === "") {
      toast.error("Saisissez le nom du défunt");
      return;
    }
    if (!tarifFuneraire) {
      toast.error("Aucun tarif funéraire pour la zone de cette destination");
      return;
    }

    setProgression({ pourcentage: 30, message: "Enregistrement de la facture funéraire..." });

    let enregistree;
    try {
      const reponse = await axios.post(`${URL_API}/facturefuneraire/ajouter`, {
        piquirefuneraire: factureFuneraire.piquirefuneraire,
        montanthttfuneraire: factureFuneraire.montanthttfuneraire,
        montantttcfunerare: factureFuneraire.montantttcfunerare,
        nomdefunt: facture.nomdefunt.trim(),
        idclient: client.idclient,
        iddestination: destination.iddestination,
      });
      enregistree = reponse.data; // { idfacturefuneraire, numfacturefuneraire, datefacturefuneraire }
    } catch (erreur) {
      setProgression(null);
      toast.error(messageErreur(erreur, "L’enregistrement a échoué"));
      return;
    }

    setProgression({ pourcentage: 80, message: "Création du PDF..." });
    try {
      await genererPdfFuneraire(
        {
          ...factureFuneraire,
          numfacturefuneraire: enregistree.numfacturefuneraire,
          datefacturefuneraire: enregistree.datefacturefuneraire,
        },
        Fcelogo,
        true
      );
    } catch (erreurPdf) {
      console.error(erreurPdf);
      toast.error("Facture enregistrée, mais le PDF n’a pas pu être créé");
    }

    setProgression({ pourcentage: 100, message: "Terminé" });
    await attendre(400);
    setProgression(null);
    toast.success(`Facture ${enregistree.numfacturefuneraire} enregistrée`);
    annulerTout();
  }

  // L'étape 3 a besoin du client et de la destination (sinon on revient à l'étape qui manque)
  const etape3Possible = client && destination && (funeraire || typeWagon);

  return (
    <div className="NouvelleFacture">
      <Etapes etapes={ETAPES} etapeActuelle={facture.etape} />

      <div className="NouvelleFactureCorps">
        {facture.etape === 1 && (
          <FactureClient
            client={client}
            clients={donnees.clients}
            onChange={(choisi) => modifier({ client: choisi })}
            onClientAjoute={clientAjoute}
            onSuivant={() => modifier({ etape: 2 })}
          />
        )}

        {facture.etape === 2 && (
          <FactureEmbarquement
            embarquement={embarquement}
            destinations={donnees.destinations}
            typesWagon={donnees.typesWagon}
            typesMarchandise={donnees.typesMarchandise}
            wagons={donnees.wagons}
            onChange={(nouveau) => modifier({ embarquement: nouveau })}
            onRetour={() => modifier({ etape: 1 })}
            onSuivant={validerEmbarquement}
          />
        )}

        {facture.etape === 3 && !etape3Possible && (
          <p>
            Chargement... Si rien ne s’affiche, revenez à l’étape{" "}
            <button type="button" onClick={() => modifier({ etape: client ? 2 : 1 })}>
              précédente
            </button>
            .
          </p>
        )}

        {facture.etape === 3 && etape3Possible && funeraire && (
          <FactureFuneraire
            tarif={tarifFuneraire}
            facture={factureFuneraire}
            enregistrementEnCours={progression !== null}
            onChangeNomDefunt={(nomdefunt) => modifier({ nomdefunt })}
            onRetour={() => modifier({ etape: 2 })}
            onAnnuler={() => setConfirmerAnnulation(true)}
            onEnregistrer={enregistrerFuneraire}
          />
        )}

        {facture.etape === 3 && etape3Possible && !funeraire && (
          <FactureColis
            embarquement={embarquement}
            destination={destination}
            typeWagon={typeWagon}
            typeMarchandiseWagon={typeMarchandiseWagon}
            tarifWagon={tarifWagon}
            marchandises={donnees.marchandises}
            typesMarchandise={donnees.typesMarchandise}
            tarifs={donnees.tarifs}
            lignes={lignes}
            facture={factureMarchandise}
            enregistrementEnCours={progression !== null}
            onChangeLignes={(nouvelles) => modifier({ lignes: nouvelles })}
            onMarchandiseAjoutee={marchandiseAjoutee}
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
