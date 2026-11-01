import React, { useState } from "react";
import toast from "react-hot-toast";
import { UserRound } from "lucide-react";
import "./FactureClient.css";
import CustomInput from "../../../../Simple composants/Input/Input";
import ChampSuggestions from "../../../../Simple composants/ChampSuggestions/ChampSuggestions";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";
import BouttonNouveau from "../../../../Simple composants/BouttonNouveau/BouttonNouveau";
import PopupClient, { formaterCIN } from "../../../../Simple composants/PopupClient/PopupClient";

// Section 1 : le client.
//  On cherche le client par son téléphone OU par son nom.
//  S'il n'est pas dans la base, le bouton "Nouveau client" ouvre le même pop up que la page Client ;
//  dès qu'il est ajouté, ses informations s'affichent dans la section.
//
//  client         : le client choisi (ligne de la table client) ou null
//  clients        : tous les clients de la base
//  onChange       : appelé avec le client choisi (ou null)
//  onClientAjoute : appelé avec le nouveau client enregistré dans la base

function sansEspaces(texte) {
  return String(texte || "").replace(/\s/g, "");
}

function FactureClient({ client, clients, onChange, onClientAjoute, onSuivant }) {
  // Ce qui est tapé dans les deux champs de recherche
  const [recherche, setRecherche] = useState({
    telephone: client ? client.telephone : "",
    nomclient: client ? client.nomclient : "",
  });
  const [popupOuvert, setPopupOuvert] = useState(false);

  // ----- Suggestions -----
  const suggestionsTelephone = clients
    .filter((c) => sansEspaces(c.telephone).includes(sansEspaces(recherche.telephone)))
    .slice(0, 6)
    .map((c) => ({ cle: c.idclient, titre: c.telephone, description: c.nomclient }));

  const suggestionsNom = clients
    .filter((c) => c.nomclient.toLowerCase().includes(recherche.nomclient.trim().toLowerCase()))
    .slice(0, 6)
    .map((c) => ({ cle: c.idclient, titre: c.nomclient, description: c.telephone }));

  function choisirClient(idclient) {
    const trouve = clients.find((c) => c.idclient === idclient);
    if (!trouve) return;
    setRecherche({ telephone: trouve.telephone, nomclient: trouve.nomclient });
    onChange(trouve);
  }

  // On tape dans un champ : si le texte correspond exactement à un client, il est choisi.
  // Sinon, le client choisi avant est retiré.
  function taper(champ, texte) {
    setRecherche({ ...recherche, [champ]: texte });

    const trouve =
      champ === "telephone"
        ? clients.find((c) => sansEspaces(c.telephone) === sansEspaces(texte))
        : clients.find((c) => c.nomclient.toLowerCase() === texte.trim().toLowerCase());

    if (trouve) {
      setRecherche({ telephone: trouve.telephone, nomclient: trouve.nomclient });
      onChange(trouve);
    } else if (client) {
      onChange(null);
    }
  }

  // Le nouveau client est enregistré dans la base : on l'affiche dans la section
  function apresAjout(nouveau) {
    setPopupOuvert(false);
    setRecherche({ telephone: nouveau.telephone, nomclient: nouveau.nomclient });
    onClientAjoute(nouveau);
  }

  function annuler() {
    setRecherche({ telephone: "", nomclient: "" });
    onChange(null);
  }

  function suivant() {
    if (!client) {
      toast.error("Choisissez un client, ou ajoutez-le avec le bouton « Nouveau client »");
      return;
    }
    onSuivant();
  }

  // Client introuvable : on a tapé un nom ou un numéro, mais aucun client ne correspond
  const clientInconnu =
    !client && (recherche.nomclient.trim().length >= 2 || sansEspaces(recherche.telephone).length >= 8);

  return (
    <div>
      <EnteteSection
        icone={UserRound}
        titre="Informations sur le client"
        sousTitre="Rechercher le client par son téléphone ou par son nom"
      />

      <div className="FactureFormulaire">
        <div className="FactureColonne">
          <ChampSuggestions
            label="Téléphone"
            name="telephone"
            value={recherche.telephone}
            onChange={(texte) => taper("telephone", texte)}
            suggestions={suggestionsTelephone}
            onSelectionner={choisirClient}
            placeholder="Rechercher par téléphone"
            required
          />
          <ChampSuggestions
            label="Nom"
            name="nomclient"
            value={recherche.nomclient}
            onChange={(texte) => taper("nomclient", texte)}
            suggestions={suggestionsNom}
            onSelectionner={choisirClient}
            placeholder="Rechercher par nom"
            required
          />
          <CustomInput type="text" label="Sigle" name="sigle" value={client?.sigle || ""} readOnly />
        </div>

        <div className="FactureColonne">
          <CustomInput type="text" label="CIN" name="cin" value={formaterCIN(client?.cin)} readOnly />
          <CustomInput type="text" label="Adresse" name="adresse" value={client?.adresse || ""} readOnly />
          <CustomInput type="email" label="Email" name="email" value={client?.email || ""} readOnly />
        </div>
      </div>

      {clientInconnu && (
        <div className="FactureClientInconnu">
          <span>Ce client n’est pas encore dans la base de données.</span>
          <BouttonNouveau texte="Nouveau client" onClick={() => setPopupOuvert(true)} />
        </div>
      )}

      <BarreNavigation onAnnuler={annuler} onSuivant={suivant} />

      {/* Même pop up que la page Client, avec ce qui a déjà été tapé */}
      {popupOuvert && (
        <PopupClient
          client={null}
          valeursDepart={{ nomclient: recherche.nomclient.trim(), telephone: sansEspaces(recherche.telephone) }}
          onEnregistre={apresAjout}
          onFermer={() => setPopupOuvert(false)}
        />
      )}
    </div>
  );
}

export default FactureClient;
