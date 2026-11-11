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
  Flower2,
  ReceiptText,
  ClipboardList,
  UserCog,
} from "lucide-react";

// Pour ajouter un menu : ajoutez simplement une ligne dans la liste du rôle concerné.
// icone = composant Lucide, chemin = route dans App.jsx

const MENUS_ADMIN = [
  { texte: "Utilisateur", chemin: "/admin/utilisateur", icone: Users },
  { texte: "Statut", chemin: "/admin/statut", icone: UserCog },
  { texte: "Enregistrement facture", chemin: "/admin/enregistrement-facture", icone: ClipboardList },
];

const MENUS_TAXATEUR = [
  { texte: "Nouvelle facture", chemin: "/taxateur/nouvelle-facture", icone: FilePlus },
  { texte: "Facture", chemin: "/taxateur/facture", icone: FileText },
  { texte: "Transport funéraire", chemin: "/taxateur/transport-funeraire", icone: Flower2 },
  { texte: "Client", chemin: "/taxateur/client", icone: Users },
  { texte: "Marchandise", chemin: "/taxateur/marchandise", icone: Package },
  { texte: "Type de marchandise", chemin: "/taxateur/type-marchandise", icone: Boxes },
];

// Pages des tarifs : modifiables par le chef de division, consultables par le receveur
const MENU_TARIF = { texte: "Tarif", chemin: "/tarif", icone: CreditCard };
const MENU_TARIF_FUNERAIRE = { texte: "Tarif funéraire", chemin: "/tarif-funeraire", icone: ReceiptText };

// Directeur
const MENUS_DIRECTION = [
  { texte: "Recette", chemin: "/direction/recette", icone: Wallet },
  { texte: "Statistique", chemin: "/direction/statistique", icone: BarChart3 },
  { texte: "Tableau de bord", chemin: "/direction/tableau-de-bord", icone: LayoutDashboard },
  // Même page que celle de l'admin (lecture seule : qui a enregistré les factures)
  { texte: "Enregistrement facture", chemin: "/admin/enregistrement-facture", icone: ClipboardList },
];

// Chef de division : les menus du directeur + Zone, Destination, Wagon, Type de wagon, Tarifs
// (lui seul peut les modifier, voir backend/server.js)
const MENUS_CHEF_DIVISION = [
  ...MENUS_DIRECTION,
  { texte: "Zone", chemin: "/chef-division/zone", icone: MapPin },
  { texte: "Destination", chemin: "/chef-division/destination", icone: Signpost },
  { texte: "Wagon", chemin: "/chef-division/wagon", icone: TrainFront },
  { texte: "Type de wagon", chemin: "/chef-division/type-wagon", icone: Tags },
  MENU_TARIF,
  MENU_TARIF_FUNERAIRE,
];

// Receveur : statistique, recette, tarifs (lecture seule), enregistrement facture, tableau de bord
const MENUS_RECEVEUR = [
  { texte: "Statistique", chemin: "/direction/statistique", icone: BarChart3 },
  { texte: "Recette", chemin: "/direction/recette", icone: Wallet },
  MENU_TARIF,
  MENU_TARIF_FUNERAIRE,
  { texte: "Enregistrement facture", chemin: "/admin/enregistrement-facture", icone: ClipboardList },
  { texte: "Tableau de bord", chemin: "/direction/tableau-de-bord", icone: LayoutDashboard },
];

// La clé = valeur de "typeutilisateur" en base
// ("chef de division" en base devient "chef_division" grâce à cleRole ci-dessous)
export const MENUS = {
  admin: MENUS_ADMIN,
  taxateur: MENUS_TAXATEUR,
  directeur: MENUS_DIRECTION,
  chef_division: MENUS_CHEF_DIVISION,
  receveur: MENUS_RECEVEUR,
};

export const LIBELLES_ROLES = {
  admin: "Administrateur",
  taxateur: "Taxateur",
  directeur: "Directeur",
  chef_division: "Chef de division",
  receveur: "Receveur",
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

// true si l'utilisateur a l'un de ces rôles. Ex : aLeRole(utilisateur, "chef_division", "receveur")
export function aLeRole(utilisateur, ...roles) {
  return roles.includes(cleRole(utilisateur?.typeutilisateur));
}