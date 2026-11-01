import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./Simple composants/Layout/Layout";
import Login from "./Page composants/Pages communs/Login/Login";
import CreerCompte from "./Page composants/Pages communs/CreerCompte/Creercompte";
import Utilisateurs from "./Page composants/Admin/Utilisateurs/Utilisateurs";
import Zones from "./Page composants/Admin/Zones/Zones";
import Destination from "./Page composants/Admin/Destination/Destination";
import TypesWagon from "./Page composants/Admin/TypesWagon/TypesWagon";
import Wagon from "./Page composants/Admin/Wagon/Wagon";
import Clients from "./Page composants/Taxateur/Clients/Clients";
import Marchandise from "./Page composants/Taxateur/Marchandise/Marchandise";
import TypeMarchandise from "./Page composants/Taxateur/TypeMarchandise/TypeMarchandise";
import Tarif from "./Page composants/Taxateur/Tarif/Tarif";
import TarifFuneraire from "./Page composants/Taxateur/TarifFuneraire/TarifFuneraire";
import NouvelleFacture from "./Page composants/Taxateur/Nouvelle Facture/Nouvellefacture";
import Facture from "./Page composants/Taxateur/Facture/Facture";
import TransportFuneraire from "./Page composants/Taxateur/TransportFuneraire/TransportFuneraire";
import Recette from "./Page composants/Pages communs/Recette/Recette";
import TableauDeBord from "./Page composants/Pages communs/TableauDeBord/TableauDeBord";
import Statistique from "./Page composants/Pages communs/Statistique/Statistique";
import PageVide from "./PageVide";

// L'utilisateur se connecte sur /authentification (route /user/authentification du backend).
// Il est gardé dans le sessionStorage : le Layout affiche les menus de son rôle.

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* ----- Pages publiques (sans menu) ----- */}
        <Route path="/authentification" element={<Login />} />
        <Route path="/inscription" element={<CreerCompte />} />

        {/* ----- Pages avec menu (utilisateur connecté) ----- */}
        <Route element={<Layout />}>
          {/* ----- Admin ----- */}
          <Route path="/admin/utilisateur" element={<Utilisateurs />} />
          <Route path="/admin/zone" element={<Zones />} />
          <Route path="/admin/destination" element={<Destination />} />
          <Route path="/admin/wagon" element={<Wagon />} />
          <Route path="/admin/type-wagon" element={<TypesWagon />} />

          {/* ----- Taxateur ----- */}
          <Route path="/taxateur/nouvelle-facture" element={<NouvelleFacture />} />
          <Route path="/taxateur/facture" element={<Facture />} />
          <Route path="/taxateur/transport-funeraire" element={<TransportFuneraire />} />
          <Route path="/taxateur/statistique" element={<Statistique />} />
          <Route path="/taxateur/client" element={<Clients />} />
          <Route path="/taxateur/marchandise" element={<Marchandise />} />
          <Route path="/taxateur/type-marchandise" element={<TypeMarchandise />} />
          <Route path="/taxateur/tarif" element={<Tarif />} />
          <Route path="/taxateur/tarif-funeraire" element={<TarifFuneraire />} />

          {/* ----- Directeur et chef de division ----- */}
          <Route path="/direction/recette" element={<Recette />} />
          <Route path="/direction/statistique" element={<Statistique />} />
          <Route path="/direction/tableau-de-bord" element={<TableauDeBord />} />

          {/* Toute autre adresse (dont "/") : le Layout redirige vers le 1er menu du rôle,
              ou vers /authentification si personne n'est connecté */}
          <Route path="*" element={<PageVide titre="Page introuvable" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
