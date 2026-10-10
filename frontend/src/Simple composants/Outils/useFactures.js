import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CLIENTS_TEST,
  DESTINATIONS_TEST,
  ZONES_TEST,
  TYPES_TRAIN_TEST,
  TYPES_MARCHANDISE_TEST,
  MARCHANDISES_TEST,
  TARIFS_TEST,
  FACTURES_TEST,
} from "./donneesTest";
import { enrichirFactures, filtrerParDates } from "./calculsStats";

const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// TODO : vos URL d'API. /api/factures doit renvoyer chaque facture avec sa liste "details".
const URLS = {
  factures: "/api/factures",
  clients: "/api/clients",
  destinations: "/api/destinations",
  zones: "/api/zones",
  typesTrain: "/api/types-train",
  typesMarchandise: "/api/types-marchandise",
  marchandises: "/api/marchandises",
  tarifs: "/api/tarifs",
};

// Charge les factures et les tables liées, puis les filtre automatiquement
// à chaque changement de période (aucun bouton à cliquer).
//  toutes   : toutes les factures (pour le tableau de bord)
//  factures : factures de la période choisie
// Avec beaucoup de factures, envoyez plutôt debut/fin à l'API au lieu de filtrer ici.
export function useFactures(periode) {
  const [donnees, setDonnees] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    if (UTILISER_DONNEES_TEST) {
      setDonnees({
        factures: FACTURES_TEST,
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
      const noms = Object.keys(URLS);
      const reponses = await Promise.all(noms.map((nom) => axios.get(URLS[nom])));
      const resultat = {};
      noms.forEach((nom, index) => {
        resultat[nom] = reponses[index].data;
      });
      setDonnees(resultat);
    } catch {
      toast.error("Impossible de charger les factures");
      setDonnees({
        factures: [], clients: [], destinations: [], zones: [],
        typesTrain: [], typesMarchandise: [], marchandises: [], tarifs: [],
      });
    }
  }

  const toutes = donnees ? enrichirFactures(donnees.factures, donnees) : [];
  const factures = filtrerParDates(toutes, periode.debut, periode.fin);

  return { toutes, factures, chargement: donnees === null };
}
