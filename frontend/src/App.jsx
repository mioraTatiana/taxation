import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./Simple composants/Layout/Layout";
import Utilisateurs from "./Page composants/Admin/Utilisateurs/Utilisateurs";
import Zones from "./Page composants/Admin/Zones/Zones";
import Destination from "./Page composants/Admin/Destination/Destination";
import TypesTrain from "./Page composants/Admin/TypesTrain/TypesTrain";
import Train from "./Page composants/Admin/Train/Train";
import Clients from "./Page composants/Taxateur/Clients/Clients";
import Marchandise from "./Page composants/Taxateur/Marchandise/Marchandise";
import TypeMarchandise from "./Page composants/Taxateur/TypeMarchandise/TypeMarchandise";
import Tarif from "./Page composants/Taxateur/Tarif/Tarif";
import PageVide from "./PageVide";

// ===== POUR VISUALISER LES PAGES (à supprimer quand le login est prêt) =====
// Changez "typeutilisateur" puis rechargez la page :
// "Admin", "Taxateur", "Directeur" ou "Chef de division"
sessionStorage.setItem(
  "utilisateur",
  JSON.stringify({
    nomutilisateur: "Miora Tatiana",
    typeutilisateur: "taxateur",
    image: "",
  })
);

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route element={<Layout />}>
          {/* ----- Admin ----- */}
          <Route path="/admin/utilisateur" element={<Utilisateurs />} />
          <Route path="/admin/zone" element={<Zones />} />
          <Route path="/admin/destination" element={<Destination />} />
          <Route path="/admin/train" element={<Train />} />
          <Route path="/admin/type-train" element={<TypesTrain />} />

          {/* ----- Taxateur ----- */}
          <Route path="/taxateur/nouvelle-facture" element={<PageVide titre="Nouvelle facture" />} />
          <Route path="/taxateur/facture" element={<PageVide titre="Facture" />} />
          <Route path="/taxateur/statistique" element={<PageVide titre="Statistique" />} />
          <Route path="/taxateur/client" element={<Clients />} />
          <Route path="/taxateur/marchandise" element={<Marchandise />} />
          <Route path="/taxateur/type-marchandise" element={<TypeMarchandise />} />
          <Route path="/taxateur/tarif" element={<Tarif />} />

          {/* ----- Directeur et chef de division ----- */}
          <Route path="/direction/recette" element={<PageVide titre="Recette" />} />
          <Route path="/direction/statistique" element={<PageVide titre="Statistique" />} />
          <Route path="/direction/tableau-de-bord" element={<PageVide titre="Tableau de bord" />} />

          {/* Toute autre adresse (dont "/") : le Layout redirige vers le 1er menu du rôle */}
          <Route path="*" element={<PageVide titre="Page introuvable" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
