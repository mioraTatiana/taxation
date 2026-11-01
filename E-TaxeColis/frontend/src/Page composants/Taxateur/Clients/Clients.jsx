import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Clients.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import PopupClient, { formaterCIN, formaterTelephone } from "../../../Simple composants/PopupClient/PopupClient";
import { vert, rouge } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

// Route du backend : Route/Taxateur/client.js
const URL_CLIENTS = `${URL_API}/client`;

// client(idclient, nomclient, sigle, cin, telephone, adresse, email) — idclient créé par la base (CLT01...)
const COLONNES = [
  { titre: "ID", cle: "idclient" },
  { titre: "Nom", cle: "nomclient" },
  { titre: "Sigle", cle: "sigle", afficher: (valeur) => valeur || "-" },
  { titre: "CIN", cle: "cin", afficher: (valeur) => (valeur ? formaterCIN(valeur) : "-") },
  { titre: "Téléphone", cle: "telephone", afficher: formaterTelephone },
  { titre: "Adresse", cle: "adresse", afficher: (valeur) => valeur || "-" },
  { titre: "Email", cle: "email", afficher: (valeur) => valeur || "-" },
];

function Clients() {
  const [clients, setClients] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    chargerClients();
  }, []);

  async function chargerClients() {
    try {
      const reponse = await axios.get(`${URL_CLIENTS}/selectionnertout`);
      setClients(reponse.data);
    } catch {
      toast.error("Impossible de charger les clients");
    }
  }

  function ouvrir(nouveauMode, client) {
    setSelection(client);
    setMode(nouveauMode);
  }

  function fermerPopup() {
    setMode(null);
    setSelection(null);
  }

  function boutonsDeLigne(client) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrir("modifier", client) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrir("supprimer", client) },
    ];
  }

  // Le pop up a enregistré le client : on relit la liste
  function apresEnregistrement() {
    fermerPopup();
    chargerClients();
  }

  async function supprimer() {
    try {
      await axios.delete(`${URL_CLIENTS}/supprimer/${selection.idclient}`);
      toast.success("Client supprimé");
      fermerPopup();
      chargerClients();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  return (
    <div>
      <h2 className="ClientsTitre">Clients</h2>

      <BouttonNouveau texte="Nouveau client" onClick={() => ouvrir("ajouter", null)} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={clients}
        cleLigne="idclient"
        actions={boutonsDeLigne}
        messageVide="Aucun client"
      />

      {/* Pop up d'ajout / modification (le même que dans la nouvelle facture) */}
      {(mode === "ajouter" || mode === "modifier") && (
        <PopupClient client={selection} onEnregistre={apresEnregistrement} onFermer={fermerPopup} />
      )}

      {/* Pop up de confirmation de suppression */}
      {mode === "supprimer" && (
        <Popup
          titre="Supprimer le client"
          texteConfirmer="Supprimer"
          couleur={rouge}
          onConfirmer={supprimer}
          onFermer={fermerPopup}
        >
          <p>
            Voulez-vous vraiment supprimer le client <strong>{selection.nomclient}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Clients;
