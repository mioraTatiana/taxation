import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "../src/Simple composants/Layout/Layout";
import Utilisateurs from "../src/Page composants/Admin/Utilisateurs/Utilisateurs";
import PageVide from "./PageVide";

// ===== POUR VISUALISER LES PAGES (à supprimer quand le login est prêt) =====
// Changez "typeutilisateur" puis rechargez la page :
// "Admin", "Taxateur", "Directeur" ou "Chef de division"
sessionStorage.setItem(
  "utilisateur",
  JSON.stringify({
    nomutilisateur: "Miora Tatiana",
    typeutilisateur: "admin",
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
          <Route path="/admin/zone" element={<PageVide titre="Zone" />} />
          <Route path="/admin/train" element={<PageVide titre="Train" />} />
          <Route path="/admin/type-train" element={<PageVide titre="Type de train" />} />

          {/* ----- Taxateur ----- */}
          <Route path="/taxateur/nouvelle-facture" element={<PageVide titre="Nouvelle facture" />} />
          <Route path="/taxateur/facture" element={<PageVide titre="Facture" />} />
          <Route path="/taxateur/statistique" element={<PageVide titre="Statistique" />} />
          <Route path="/taxateur/client" element={<PageVide titre="Client" />} />
          <Route path="/taxateur/marchandise" element={<PageVide titre="Marchandise" />} />
          <Route path="/taxateur/tarif" element={<PageVide titre="Tarif" />} />

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