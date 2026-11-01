import {
  Users,
  MapPin,
  TrainFront,
  Tags,
  FilePlus,
  FileText,
  BarChart3,
  Package,
  CreditCard,
  Wallet,
  LayoutDashboard,
  Signpost,
  Boxes,
} from "lucide-react";

// Pour ajouter un menu : ajoutez simplement une ligne dans la liste du rôle concerné.
// icone = composant Lucide, chemin = route dans App.jsx

const MENUS_ADMIN = [
  { texte: "Utilisateur", chemin: "/admin/utilisateur", icone: Users },
];

const MENUS_TAXATEUR = [
  { texte: "Nouvelle facture", chemin: "/taxateur/nouvelle-facture", icone: FilePlus },
  { texte: "Facture marchandise", chemin: "/taxateur/facture", icone: FileText },
  { texte: "Statistique", chemin: "/taxateur/statistique", icone: BarChart3 },
  { texte: "Client", chemin: "/taxateur/client", icone: Users },
  { texte: "Marchandise", chemin: "/taxateur/marchandise", icone: Package },
  { texte: "Type de marchandise", chemin: "/taxateur/type-marchandise", icone: Boxes },
  { texte: "Tarif de marchandise", chemin: "/taxateur/tarif", icone: CreditCard },
  { texte: "Tarif funéraire", chemin: "/taxateur/tariffuneraire", icone: CreditCard },
   { texte: "Transport funéraire", chemin: "/taxateur/transportfuneraire", icone: CreditCard },
];

const MENUS_CHEF = [
  { texte: "Recette", chemin: "/direction/recette", icone: Wallet },
  { texte: "Statistique", chemin: "/direction/statistique", icone: BarChart3 },
  { texte: "Tableau de bord", chemin: "/direction/tableau-de-bord", icone: LayoutDashboard },
  { texte: "Zone", chemin: "/direction/zone", icone: MapPin },
  { texte: "Destination", chemin: "/direction/destination", icone: Signpost },
  { texte: "Train", chemin: "/direction/train", icone: TrainFront },
  { texte: "Type de train", chemin: "/direction/type-train", icone: Tags },

];

const MENUS_DIRECTION = [
  { texte: "Recette", chemin: "/direction/recette", icone: Wallet },
  { texte: "Statistique", chemin: "/direction/statistique", icone: BarChart3 },
  { texte: "Tableau de bord", chemin: "/direction/tableau-de-bord", icone: LayoutDashboard },

];

// La clé = valeur de "typeutilisateur" en base
export const MENUS = {
  admin: MENUS_ADMIN,
  taxateur: MENUS_TAXATEUR,
  directeur: MENUS_DIRECTION,
  chef_division: MENUS_CHEF,
};

export const LIBELLES_ROLES = {
  admin: "Administrateur",
  taxateur: "Taxateur",
  directeur: "Directeur",
  chef_division: "Chef de division",
};

// "Taxateur", "taxateur ", "Chef de division"... -> clé utilisable dans MENUS
function cleRole(type) {
  const cle = (type || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (cle === "administrateur") return "admin";
  if (cle === "chef_de_division") return "chef_division";
  return cle;
}

export function menusDuRole(type) {
  return MENUS[cleRole(type)] || [];
}

export function libelleDuRole(type) {
  return LIBELLES_ROLES[cleRole(type)] || type;
}