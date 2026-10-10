import React from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { UserRound } from "lucide-react";
import "./FactureClient.css";
import CustomInput from "../../../../Simple composants/Input/Input";
import ChampSuggestions from "../../../../Simple composants/ChampSuggestions/ChampSuggestions";
import BarreNavigation from "../../../../Simple composants/BarreNavigation/BarreNavigation";
import EnteteSection from "../../../../Simple composants/EnteteSection/EnteteSection";

// idclient vide = client pas encore enregistré dans la base
export const CLIENT_VIDE = {
  idclient: "",
  telephone: "",
  nomclient: "",
  sigle: "",
  adresse: "",
  email: "",
};

// Tailles de la base : téléphone 13, nom 100, sigle 10, adresse 100, email 50
const SCHEMA = z.object({
  telephone: z.string().trim().min(8, "Numéro de téléphone invalide").max(13, "Téléphone : 13 caractères maximum"),
  nomclient: z.string().trim().min(2, "Saisissez le nom du client").max(100, "Nom : 100 caractères maximum"),
  sigle: z.string().trim().min(1, "Saisissez le sigle").max(10, "Sigle : 10 caractères maximum"),
  adresse: z.string().trim().min(2, "Saisissez l’adresse").max(100, "Adresse : 100 caractères maximum"),
  email: z.string().trim().email("Adresse email invalide").max(50, "Email : 50 caractères maximum").or(z.literal("")),
});

function sansEspaces(telephone) {
  return String(telephone).replace(/\s/g, "");
}

function versClient(client) {
  return {
    idclient: client.idclient,
    telephone: client.telephone,
    nomclient: client.nomclient,
    sigle: client.sigle || "",
    adresse: client.adresse || "",
    email: client.email || "",
  };
}

function FactureClient({ client, clients, onChange, onSuivant }) {
  const clientExistant = client.idclient !== "";

  // Suggestions : les clients dont le téléphone contient ce qui est tapé
  const suggestions = clients
    .filter((c) => sansEspaces(c.telephone).includes(sansEspaces(client.telephone)))
    .slice(0, 6)
    .map((c) => ({ cle: c.idclient, titre: c.telephone, description: c.nomclient }));

  function changerTelephone(texte) {
    const trouve = clients.find((c) => sansEspaces(c.telephone) === sansEspaces(texte));

    if (trouve) {
      onChange(versClient(trouve)); // remplit automatiquement les autres champs
    } else if (clientExistant) {
      onChange({ ...CLIENT_VIDE, telephone: texte }); // on tape un autre numéro : on repart de zéro
    } else {
      onChange({ ...client, telephone: texte });
    }
  }

  function choisirClient(idclient) {
    const trouve = clients.find((c) => c.idclient === idclient);
    if (trouve) onChange(versClient(trouve));
  }

  function changerChamp(e) {
    onChange({ ...client, [e.target.name]: e.target.value });
  }

  const messageClientInconnu =
    !clientExistant && sansEspaces(client.telephone).length >= 8
      ? "Ce client n’est pas encore dans la base de données."
      : "";

  function annuler() {
    onChange(CLIENT_VIDE);
  }

  function suivant() {
    const resultat = SCHEMA.safeParse(client);
    if (!resultat.success) {
      toast.error(resultat.error.issues[0].message);
      return;
    }
    onSuivant();
  }

  return (
    <div>
      <EnteteSection
        icone={UserRound}
        titre="Informations sur le client"
        sousTitre="Insérer les informations sur le client"
      />

      <div className="FactureFormulaire">
        <div className="FactureColonne">
          <ChampSuggestions
            label="Téléphone *"
            name="telephone"
            value={client.telephone}
            onChange={changerTelephone}
            suggestions={suggestions}
            onSelectionner={choisirClient}
            erreur={messageClientInconnu}
          />
          <CustomInput type="text" label="Nom *" name="nomclient" value={client.nomclient} onChange={changerChamp} readOnly={clientExistant} />
          <CustomInput type="text" label="Sigle *" name="sigle" value={client.sigle} onChange={changerChamp} readOnly={clientExistant} />
        </div>

        <div className="FactureColonne">
          <CustomInput type="text" label="Adresse *" name="adresse" value={client.adresse} onChange={changerChamp} readOnly={clientExistant} />
          <CustomInput type="email" label="Email" name="email" value={client.email} onChange={changerChamp} readOnly={clientExistant} />
        </div>
      </div>

      <BarreNavigation onAnnuler={annuler} onSuivant={suivant} />
    </div>
  );
}

export default FactureClient;
