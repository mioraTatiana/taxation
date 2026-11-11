import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import "./EnregistrementFacture.css";
import FiltreDates from "../../../Simple composants/FiltreDates/FiltreDates";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import ChampRecherche, { contient } from "../../../Simple composants/ChampRecherche/ChampRecherche";
import { bleu } from "../../../Simple composants/Couleurs/couleur";
import { URL_API } from "../../../Simple composants/Outils/api";
import { formaterDate, parametresPeriode } from "../../../Simple composants/Outils/calculsStats";
import { formaterMontant } from "../../../Simple composants/Outils/calculsFacture";

// Page admin "Enregistrement facture" : les personnes qui ont enregistré des factures
// (marchandise et funéraires), avec le nombre de factures et le montant total.
// Routes du backend : Route/Admin/enregistrement.js
//   /enregistrement/parutilisateur      : une ligne par personne
//   /enregistrement/factures/:iduser    : les factures d'une personne

const LIBELLES_ROLES = {
  admin: "Administrateur",
  taxateur: "Taxateur",
  directeur: "Directeur",
  "chef de division": "Chef de division",
  receveur: "Receveur",
};

const LIBELLES_STATUT = {
  "en attente": "En attente",
  actif: "Actif",
  desactive: "Désactivé",
};

// Tableau principal : une ligne par personne
const COLONNES = [
  { titre: "ID", cle: "iduser" },
  { titre: "Nom", cle: "nomutilisateur" },
  { titre: "Email", cle: "emailutilisateur", afficher: (valeur) => valeur || "-" },
  { titre: "Rôle", cle: "typeutilisateur", afficher: (valeur) => LIBELLES_ROLES[valeur] || valeur || "-" },
  { titre: "Statut", cle: "statut", afficher: (valeur) => LIBELLES_STATUT[valeur] || valeur || "-" },
  { titre: "Factures", cle: "nombrefactures" },
  { titre: "Express", cle: "nombreexpress" },
  { titre: "Wagon complet", cle: "nombrewagon" },
  { titre: "Funéraire", cle: "nombrefuneraire" },
  { titre: "Montant total", cle: "montanttotal", afficher: (valeur) => `${formaterMontant(valeur)} Ar` },
  { titre: "Première facture", cle: "premierefacture", afficher: formaterDate },
  { titre: "Dernière facture", cle: "dernierefacture", afficher: formaterDate },
];

// Fenêtre : les factures d'une personne
const COLONNES_FACTURES = [
  { titre: "Numéro", cle: "numfacture" },
  { titre: "Date", cle: "datefacture", afficher: formaterDate },
  { titre: "Transport", cle: "transport" },
  { titre: "Client", cle: "nomclient" },
  { titre: "Destination", cle: "nomdestination" },
  { titre: "Montant TTC", cle: "recette", afficher: (valeur) => `${formaterMontant(valeur)} Ar` },
];

function EnregistrementFacture() {
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [personnes, setPersonnes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState(null); // personne dont on affiche les factures
  const [factures, setFactures] = useState([]);
  const [periodeFactures, setPeriodeFactures] = useState({ debut: "", fin: "" }); // période dans la fenêtre
  const [recherche, setRecherche] = useState(""); // recherche par nom

  // On recharge à chaque changement de période (le backend filtre les dates)
  useEffect(() => {
    chargerPersonnes();
  }, [periode]);

  async function chargerPersonnes() {
    setChargement(true);
    try {
      const reponse = await axios.get(`${URL_API}/enregistrement/parutilisateur${parametresPeriode(periode)}`);
      setPersonnes(reponse.data);
    } catch {
      toast.error("Impossible de charger les enregistrements");
    }
    setChargement(false);
  }

  // Ouvre la fenêtre des factures d'une personne, avec la même période que la page
  function afficherFactures(personne) {
    setSelection(personne);
    setPeriodeFactures(periode);
  }

  // Les factures de la personne choisie, rechargées à chaque changement de période dans la fenêtre
  useEffect(() => {
    if (!selection) return;
    axios
      .get(`${URL_API}/enregistrement/factures/${selection.iduser}${parametresPeriode(periodeFactures)}`)
      .then((reponse) => setFactures(reponse.data))
      .catch(() => toast.error("Impossible de charger les factures de cette personne"));
  }, [selection, periodeFactures]);

  const personnesAffichees = personnes.filter((p) => contient(p.nomutilisateur, recherche));
  const totalFactures = factures.reduce((somme, f) => somme + Number(f.recette || 0), 0);

  function boutonsDeLigne(personne) {
    return [{ texte: "Voir les factures", couleur: bleu, onClick: () => afficherFactures(personne) }];
  }

  return (
    <div>
      <h2 className="EnregistrementTitre">Enregistrement des factures</h2>

      <FiltreDates debut={periode.debut} fin={periode.fin} onChange={setPeriode} />

      <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Rechercher une personne par nom..." />

      <div className="EnregistrementTableau">
        <TableDonnees
          colonnes={COLONNES}
          donnees={personnesAffichees}
          cleLigne="iduser"
          actions={boutonsDeLigne}
          messageVide={chargement ? "Chargement..." : "Aucune facture enregistrée sur cette période"}
        />
      </div>

      {/* Fenêtre : les factures enregistrées par la personne choisie */}
      {selection && (
        <div className="EnregistrementFenetreFond" onClick={() => setSelection(null)}>
          <div className="EnregistrementFenetre" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="EnregistrementFermer"
              onClick={() => setSelection(null)}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <h3 className="EnregistrementFenetreTitre">Factures enregistrées par {selection.nomutilisateur}</h3>
            <FiltreDates
              debut={periodeFactures.debut}
              fin={periodeFactures.fin}
              onChange={setPeriodeFactures}
            />
            <p className="EnregistrementFenetreSousTitre">
              {factures.length} facture(s) – {formaterMontant(totalFactures)} Ar
            </p>
            <TableDonnees
              colonnes={COLONNES_FACTURES}
              donnees={factures}
              cleLigne="numfacture"
              messageVide="Aucune facture"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EnregistrementFacture;
