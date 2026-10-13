import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import "./Clients.css";
import TableDonnees from "../../../Simple composants/TableDonnees/TableDonnees";
import Popup from "../../../Simple composants/Popup/Popup";
import BouttonNouveau from "../../../Simple composants/BouttonNouveau/BouttonNouveau";
import { idSuivant } from "../../../Simple composants/Outils/outils";
import CustomInput from "../../../Simple composants/Input/Input";
import { bleu, vert, rouge } from "../../../Simple composants/Couleurs/couleur";

const URL_CLIENTS = "/api/clients"; // TODO : votre URL d'API
const UTILISER_DONNEES_TEST = true; // mettre false quand l'API est prête

// client(idclient, nomclient, sigle, cin, telephone, adresse, email)
const DONNEES_TEST = [
  { idclient: "CLT01", nomclient: "Rakoto Jean", sigle: "", cin: "101231456789", telephone: "034 12 345 67", adresse: "Fianarantsoa", email: "rakoto@gmail.com" },
  { idclient: "CLT02", nomclient: "Madagascar Fret", sigle: "MAFRET", cin: "", telephone: "032 98 765 43", adresse: "Manakara", email: "contact@mafret.mg" },
];

const FORMULAIRE_VIDE = {
  nomclient: "",
  sigle: "",
  cin: "",
  telephone: "",
  adresse: "",
  email: "",
};

// Obligatoires : nom et téléphone. Le sigle et le CIN sont facultatifs
// (un client peut être une personne ou une société).
// Tailles de la base : nom 100, sigle 10, CIN 12, téléphone 13, adresse 100, email 50
const SCHEMA = z.object({
  nomclient: z.string().trim().min(2, "Saisissez le nom du client").max(100, "Nom : 100 caractères maximum"),
  sigle: z.string().trim().max(10, "Sigle : 10 caractères maximum"),
cin: z.string()
  .max(12, "CIN : 12 chiffres maximum")
  .regex(/^\d*$/, "Le CIN doit contenir uniquement des chiffres"),

telephone: z.string()
  .min(10, "Numéro de téléphone incomplet")
  .max(13, "Téléphone : 13 caractères maximum")
  .regex(/^(?:\+261\d{9}|0\d{9})$/, "Format de téléphone invalide"),  adresse: z.string().trim().max(100, "Adresse : 100 caractères maximum"),
  email: z.string().trim().email("Adresse email invalide").max(50, "Email : 50 caractères maximum").or(z.literal("")),
});

const COLONNES = [
  { titre: "ID", cle: "idclient" },
  { titre: "Nom", cle: "nomclient" },
  { titre: "Sigle", cle: "sigle" },
  {
    titre: "CIN",
    cle: "cin",
    formater: (client) => formaterCIN(client.cin),
  },
  {
    titre: "Téléphone",
    cle: "telephone",
    formater: (client) => formaterTelephone(client.telephone),
  },
  { titre: "Adresse", cle: "adresse" },
  { titre: "Email", cle: "email" },
];

// CIN : 201321654789 -> 201 321 654 789
function formaterCIN(cin) {
  const chiffres = String(cin || "").replace(/\D/g, "");

  return chiffres.replace(/(\d{3})(?=\d)/g, "$1 ");
}

// Téléphone : +261346331923 -> +261 34 63 319 23
function formaterTelephone(telephone) {
  const valeur = String(telephone || "");
  const chiffres = valeur.replace(/\D/g, "");

  if (chiffres.startsWith("261")) {
    const numero = chiffres.slice(3);

    if (!numero) return "+261";

    return [
      "+261",
      numero.slice(0, 2),
      numero.slice(2, 4),
      numero.slice(4, 7),
      numero.slice(7, 9),
    ]
      .filter(Boolean)
      .join(" ");
  }

  // Format local : 0341234567 -> 034 12 345 67
  if (/^0\d{9}$/.test(chiffres)) {
    return chiffres.replace(/^(\d{3})(\d{2})(\d{3})(\d{2})$/, "$1 $2 $3 $4");
  }

  return chiffres;
}

function Clients() {
  const [clients, setClients] = useState([]);
  const [mode, setMode] = useState(null); // "ajouter", "modifier", "supprimer"
  const [selection, setSelection] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);

  useEffect(() => {
    chargerClients();
  }, []);

  async function chargerClients() {
    if (UTILISER_DONNEES_TEST) {
      setClients(DONNEES_TEST);
      return;
    }
    try {
      const reponse = await axios.get(URL_CLIENTS);
      setClients(reponse.data);
    } catch {
      toast.error("Impossible de charger les clients");
    }
  }

  function ouvrirAjout() {
    setFormulaire(FORMULAIRE_VIDE);
    setSelection(null);
    setMode("ajouter");
  }

  function ouvrirModification(client) {
    setFormulaire({
      nomclient: client.nomclient,
      sigle: client.sigle,
      cin: client.cin,
      telephone: client.telephone,
      adresse: client.adresse,
      email: client.email,
    });
    setSelection(client);
    setMode("modifier");
  }

  function ouvrirSuppression(client) {
    setSelection(client);
    setMode("supprimer");
  }

  function fermerPopup() {
    setMode(null);
    setSelection(null);
  }

  // Formater le CIN : 201021021035 -> 201 021 021 035
  function formaterCIN(cin) {
    const chiffres = (cin || "").replace(/\D/g, "");
    return chiffres.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  }

  

  // Formater le téléphone malgache : +261346331923 -> +261 34 63 319 23
  function formaterTelephone(telephone) {
    const chiffres = (telephone || "").replace(/\D/g, "");

    // Format international malgache commençant par 261
    if (chiffres.startsWith("261")) {
      const numero = chiffres.slice(3);

      return numero.length > 0
        ? `+261 ${numero.slice(0, 2)}${numero.length > 2 ? " " + numero.slice(2, 4) : ""}${numero.length > 4 ? " " + numero.slice(4, 7) : ""}${numero.length > 7 ? " " + numero.slice(7, 9) : ""}`.trim()
        : "+261";
    }

    // Format local : 0341234567 -> 034 12 345 67
    return chiffres.replace(/^(\d{3})(\d{2})(\d{3})(\d{2})$/, "$1 $2 $3 $4");
  }

  function changerChamp(e) {
    const { name, value } = e.target;

    let nouvelleValeur = value;

    if (name === "cin") {
      // Autoriser uniquement les chiffres et limiter à 12 chiffres
      nouvelleValeur = value.replace(/\D/g, "").slice(0, 12);
    }

    if (name === "telephone") {
      // Autoriser les chiffres et le signe + uniquement au début
      const commenceParPlus = value.trimStart().startsWith("+");
      const chiffres = value.replace(/\D/g, "").slice(0, 12);

      nouvelleValeur = commenceParPlus ? `+${chiffres}` : chiffres;

      // Limiter le nombre de caractères affichés
      nouvelleValeur = nouvelleValeur.slice(0, 13);
    }

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: nouvelleValeur,
    }));
  }

  function boutonsDeLigne(client) {
    return [
      { texte: "Modifier", couleur: vert, onClick: () => ouvrirModification(client) },
      { texte: "Supprimer", couleur: rouge, onClick: () => ouvrirSuppression(client) },
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
        let nouveau = { ...resultat.data };
        if (UTILISER_DONNEES_TEST) {
          nouveau.idclient = idSuivant(clients, "idclient", "CLT");
        } else {
          const reponse = await axios.post(URL_CLIENTS, resultat.data);
          nouveau = reponse.data;
        }
        setClients([...clients, nouveau]);
        toast.success("Client ajouté");
      } else {
        const id = selection.idclient;
        if (!UTILISER_DONNEES_TEST) await axios.put(`${URL_CLIENTS}/${id}`, resultat.data);
        setClients(clients.map((c) => (c.idclient === id ? { ...c, ...resultat.data } : c)));
        toast.success("Client modifié");
      }
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  async function supprimer() {
    const id = selection.idclient;
    try {
      if (!UTILISER_DONNEES_TEST) await axios.delete(`${URL_CLIENTS}/${id}`);
      setClients(clients.filter((c) => c.idclient !== id));
      toast.success("Client supprimé");
      fermerPopup();
    } catch (erreur) {
      toast.error(erreur.response?.data?.message || "Une erreur est survenue");
    }
  }

  return (
    <div>
      <h2 className="ClientsTitre">Clients</h2>

      <BouttonNouveau texte="Nouveau client" onClick={ouvrirAjout} />

      <TableDonnees
        colonnes={COLONNES}
        donnees={clients}
        cleLigne="idclient"
        actions={boutonsDeLigne}
        messageVide="Aucun client"
      />

      {/* Pop up d'ajout / modification */}
      {(mode === "ajouter" || mode === "modifier") && (
        <Popup
          titre={mode === "ajouter" ? "Nouveau client" : "Modifier le client"}
          texteConfirmer={mode === "ajouter" ? "Ajouter" : "Enregistrer"}
          couleur={bleu}
          onConfirmer={enregistrer}
          onFermer={fermerPopup}
        >
          <CustomInput type="text" label="Nom du client" name="nomclient" value={formulaire.nomclient} onChange={changerChamp} />
          <CustomInput type="text" label="Sigle" name="sigle" value={formulaire.sigle} onChange={changerChamp} />
          <CustomInput
            type="text"
            label="CIN"
            name="cin"
            value={formaterCIN(formulaire.cin)}
            onChange={changerChamp}
          />

          <CustomInput
            type="tel"
            label="Téléphone"
            name="telephone"
            value={formaterTelephone(formulaire.telephone)}
            onChange={changerChamp}
          />          <CustomInput type="text" label="Adresse" name="adresse" value={formulaire.adresse} onChange={changerChamp} />
          <CustomInput type="email" label="Email" name="email" value={formulaire.email} onChange={changerChamp} />
        </Popup>
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
            Voulez-vous vraiment supprimer le client{" "}
            <strong>{selection.nomclient}</strong> ?
          </p>
        </Popup>
      )}
    </div>
  );
}

export default Clients;
