import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Form, Spinner } from "react-bootstrap";
import { ArrowLeft } from "lucide-react";
import "./Creercompte.css";
import CustomInput from "../../../Simple composants/Input/Input";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import Boutton from "../../../Simple composants/Boutton/Boutton";
import Popup from "../../../Simple composants/Popup/Popup";
import { bleu } from "../../../Simple composants/Couleurs/couleur";
import { URL_API, messageErreur } from "../../../Simple composants/Outils/api";

const CLE_BROUILLON = "brouillonInscription";

// Rôles proposés à l'inscription (valeurs = colonne typeutilisateur de la base).
// "admin" n'y figure pas : un admin n'est pas créé par une inscription publique.
const TYPES_UTILISATEUR = [
  { value: "taxateur", label: "Taxateur", description: "Crée les factures et gère les clients" },
  { value: "directeur", label: "Directeur", description: "Consulte recettes et statistiques" },
  { value: "chef de division", label: "Chef de division", description: "Consulte recettes et statistiques" },
];

// Validation Zod (tailles de la table usertable : nom 20, email 50)
const schemaInscription = z
  .object({
    nomUtilisateur: z.string().trim().min(3, "Au moins 3 caractères").max(20, "20 caractères maximum"),
    typeUtilisateur: z.string().min(1, "Choisissez un type d’utilisateur"),
    email: z.string().trim().email("Adresse email invalide").max(50, "50 caractères maximum"),
    motDePasse: z.string().min(8, "Au moins 8 caractères"),
    confirmation: z.string(),
  })
  .refine((valeurs) => valeurs.motDePasse === valeurs.confirmation, {
    path: ["confirmation"],
    message: "Les deux mots de passe ne sont pas identiques",
  });

// Récupère le brouillon gardé en sessionStorage (sans mot de passe)
function lireBrouillon() {
  try {
    const brouillon = sessionStorage.getItem(CLE_BROUILLON);
    return brouillon ? JSON.parse(brouillon) : {};
  } catch {
    return {};
  }
}

// Message d'erreur sous un champ (React-Bootstrap)
function ChampErreur({ message }) {
  if (!message) return null;
  return <Form.Text className="text-danger champErreur">{message}</Form.Text>;
}

// Champ texte relié à React Hook Form
function ChampTexte({ control, erreurs, name, label, type }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <>
          <CustomInput
            type={type}
            label={label}
            name={name}
            value={field.value}
            onChange={field.onChange}
          />
          <ChampErreur message={erreurs[name]?.message} />
        </>
      )}
    />
  );
}

function CreeCompte() {
  const navigate = useNavigate();
  // Email de la demande enregistrée : quand il est rempli, le pop up de confirmation s'affiche
  const [emailInscrit, setEmailInscrit] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaInscription),
    mode: "onChange",
    defaultValues: {
      nomUtilisateur: "",
      typeUtilisateur: "",
      email: "",
      motDePasse: "",
      confirmation: "",
      ...lireBrouillon(),
    },
  });

  // Sauvegarde temporaire du brouillon (sans données sensibles)
  useEffect(() => {
    const abonnement = watch((valeurs) => {
      const { motDePasse, confirmation, ...brouillon } = valeurs;
      sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(brouillon));
    });
    return () => abonnement.unsubscribe();
  }, [watch]);

  function retour() {
    navigate("/authentification");
  }

  async function inscrire(donnees) {
    if (isSubmitting) return;

    // Clés = noms des colonnes de usertable (le mot de passe est haché par le backend).
    // Le statut est mis à "en attente" par le backend : l'admin doit activer le compte.
    try {
      await axios.post(`${URL_API}/user/ajouter`, {
        nomutilisateur: donnees.nomUtilisateur,
        typeutilisateur: donnees.typeUtilisateur,
        emailutilisateur: donnees.email,
        motpasse: donnees.motDePasse,
      });
      sessionStorage.removeItem(CLE_BROUILLON);
      setEmailInscrit(donnees.email); // affiche le pop up de confirmation
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Une erreur est survenue, veuillez réessayer."));
    }
  }

  return (
    <div className="CreeComptePage">
      <form className="CreeCompteCarte" onSubmit={handleSubmit(inscrire)} noValidate>
        <div className="CreeCompteEntete">
          <button
            type="button"
            className="CreeCompteRetour"
            onClick={retour}
            aria-label="Retour"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="CreeCompteTitre">Créer votre compte</h1>
        </div>

        <ChampTexte
          control={control}
          erreurs={errors}
          name="nomUtilisateur"
          label="Nom d’utilisateur"
          type="text"
        />

        <Controller
          name="typeUtilisateur"
          control={control}
          render={({ field }) => (
            <>
              <SelectInput
                label="Type d’utilisateur"
                name="typeUtilisateur"
                options={TYPES_UTILISATEUR}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Sélectionner un type"
                searchPlaceholder="Rechercher un type..."
                error={errors.typeUtilisateur?.message}
              />
              <ChampErreur message={errors.typeUtilisateur?.message} />
            </>
          )}
        />

        <ChampTexte
          control={control}
          erreurs={errors}
          name="email"
          label="Email"
          type="email"
        />

        <ChampTexte
          control={control}
          erreurs={errors}
          name="motDePasse"
          label="Mot de passe"
          type="password"
        />

        <ChampTexte
          control={control}
          erreurs={errors}
          name="confirmation"
          label="Confirmer le mot de passe"
          type="password"
        />

        <Boutton
          type="submit"
          text={
            isSubmitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "S’inscrire"
            )
          }
          name="inscription"
          couleur={bleu}
          disabled={!isValid}
        />
      </form>

      {/* Pop up affiché quand la demande de compte est enregistrée */}
      {emailInscrit && (
        <Popup
          titre="Demande de création de compte enregistrée"
          texteConfirmer="J’ai compris"
          couleur={bleu}
          sansAnnuler
          onConfirmer={() => navigate("/authentification")}
          onFermer={() => navigate("/authentification")}
        >
          <p>Votre demande de création de compte a bien été enregistrée.</p>
          <p>
            Elle est actuellement soumise à la validation de l’administrateur. Dès son approbation, un
            courrier électronique de confirmation vous sera adressé à l’adresse <strong>{emailInscrit}</strong>,
            attestant que votre compte est actif et que vous êtes autorisé(e) à vous connecter à l’application.
          </p>
          <p>Nous vous remercions de votre patience.</p>
        </Popup>
      )}
    </div>
  );
}

export default CreeCompte;
