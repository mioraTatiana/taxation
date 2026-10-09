import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Form, Spinner } from "react-bootstrap";
import { ArrowLeft } from "lucide-react";
import "./Creecompte.css";
import CustomInput from "../../../Simple composants/Input/Input";
import SelectInput from "../../../Simple composants/SelectInput/SelectInput";
import Boutton from "../../../Simple composants/Boutton/Boutton";
import { bleu } from "../../../Simple composants/Couleurs/couleur";

const CLE_BROUILLON = "brouillonInscription";
const URL_INSCRIPTION = "/api/utilisateurs/inscription"; // TODO : votre URL d'API

// Rôles proposés à l'inscription (valeurs = colonne typeutilisateur de la base).
// "admin" n'y figure pas : un admin n'est pas créé par une inscription publique.
const TYPES_UTILISATEUR = [
  { value: "taxateur", label: "Taxateur", description: "Crée les factures et gère les clients" },
  { value: "directeur", label: "Directeur", description: "Consulte recettes et statistiques" },
  { value: "chef_division", label: "Chef de division", description: "Consulte recettes et statistiques" },
];

// Validation Zod
const schemaInscription = z.object({
  nomComplet: z.string().trim().min(2, "Au moins 2 caractères").max(100, "100 caractères maximum"),
  nomUtilisateur: z.string().trim().min(3, "Au moins 3 caractères").max(20, "20 caractères maximum"),
  typeUtilisateur: z.string().min(1, "Choisissez un type d’utilisateur"),
  email: z.string().trim().email("Adresse email invalide").max(50, "50 caractères maximum"),
  motDePasse: z.string().min(8, "Au moins 8 caractères"),
  image: z
    .instanceof(File, { message: "Choisissez une image" })
    .refine((fichier) => fichier.type.startsWith("image/"), "Le fichier doit être une image")
    .refine((fichier) => fichier.size <= 2 * 1024 * 1024, "L’image ne doit pas dépasser 2 Mo"),
});

// Récupère le brouillon gardé en sessionStorage (sans mot de passe ni image)
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaInscription),
    mode: "onChange",
    defaultValues: {
      nomComplet: "",
      nomUtilisateur: "",
      typeUtilisateur: "",
      email: "",
      motDePasse: "",
      ...lireBrouillon(),
    },
  });

  // Sauvegarde temporaire du brouillon (sans données sensibles)
  useEffect(() => {
    const abonnement = watch((valeurs) => {
      const { motDePasse, image, ...brouillon } = valeurs;
      sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(brouillon));
    });
    return () => abonnement.unsubscribe();
  }, [watch]);

  function retour() {
    navigate(-1);
  }

  async function inscrire(donnees) {
    if (isSubmitting) return;

    const formData = new FormData();
    // Clés = noms des colonnes de usertable (motpasse doit être haché par l'API)
    formData.append("nomcomplet", donnees.nomComplet);
    formData.append("nomutilisateur", donnees.nomUtilisateur);
    formData.append("typeutilisateur", donnees.typeUtilisateur);
    formData.append("emailutilisteur", donnees.email);
    formData.append("motpasse", donnees.motDePasse);
    formData.append("image", donnees.image);

    try {
      await axios.post(URL_INSCRIPTION, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sessionStorage.removeItem(CLE_BROUILLON);
      toast.success("Compte créé avec succès !");
      navigate("/"); // TODO : route de la page de connexion
    } catch (erreur) {
      const message =
        erreur.response?.data?.message ||
        "Une erreur est survenue, veuillez réessayer.";
      toast.error(message);
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
          name="nomComplet"
          label="Noms complets"
          type="text"
        />

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

        {/* Input file : pas de prop "value", on garde le File dans le formulaire */}
        <Controller
          name="image"
          control={control}
          render={({ field }) => (
            <>
              <CustomInput
                type="file"
                label="Image"
                name="image"
                onChange={(e) => field.onChange(e.target.files[0])}
              />
              <ChampErreur message={errors.image?.message} />
            </>
          )}
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
    </div>
  );
}

export default CreeCompte;
