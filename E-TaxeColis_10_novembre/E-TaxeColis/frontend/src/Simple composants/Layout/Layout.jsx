import React, { useState } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { User, LogOut, Menu, Pencil } from "lucide-react";
import "./Layout.css";
import MenuItem from "../MenuItem/MenuItem";
import logo from "../../Image/logo.png";
import { menusDuRole, libelleDuRole } from "./menus";
import { utilisateurConnecte, deconnecter as effacerConnexion } from "../Outils/api";
import PopupProfil from "../PopupProfil/PopupProfil";

 
function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false); // tiroir (tablette / téléphone)
  const [profilOuvert, setProfilOuvert] = useState(false); // pop up "Mon profil"
  const utilisateur = utilisateurConnecte();
 
  if (!utilisateur) {
    return <Navigate to="/authentification" replace />;
  }
 
  const menus = menusDuRole(utilisateur.typeutilisateur);
  const menuActif = menus.find((menu) => menu.chemin === location.pathname);
 
  // Page absente du menu de ce rôle (ex: "/") : on va au premier menu du rôle
  if (menus.length > 0 && !menuActif) {
    return <Navigate to={menus[0].chemin} replace />;
  }
  const IconeActive = menuActif ? menuActif.icone : null;
 
  function fermerMenu() {
    setMenuOuvert(false);
  }
 
  function deconnecter() {
    effacerConnexion(); // efface l'utilisateur et le jeton
    toast.success("Vous êtes déconnecté");
    navigate("/authentification");
  }
 
  return (
    <div className="Layout">
      {/* Fond sombre derrière le tiroir (visible seulement sur tablette / téléphone) */}
      {menuOuvert && <div className="LayoutFond" onClick={fermerMenu} />}
 
      {/* ===== Div du menu ===== */}
      <div className={menuOuvert ? "LayoutMenu LayoutMenuOuvert" : "LayoutMenu"}>
        <div className="LayoutLogo">
          <img src={logo} alt="E-TaxeColis" />
          <h2>E-TaxeColis</h2>
        </div>
 
        <div className="LayoutListeMenus" onClick={fermerMenu}>
          {menus.map((menu) => (
            <MenuItem
              key={menu.chemin}
              icone={menu.icone}
              texte={menu.texte}
              chemin={menu.chemin}
            />
          ))}
        </div>
 
        <div className="LayoutProfil">
          {/* Clic sur le profil : pop up "Mon profil" (nom, email, mot de passe) */}
          <button
            type="button"
            className="LayoutProfilBouton"
            onClick={() => setProfilOuvert(true)}
            title="Modifier mon profil"
          >
            <div className="LayoutAvatar LayoutAvatarVide">
              <User size={20} />
            </div>
            <p className="LayoutNom">{utilisateur.nomutilisateur}</p>
            <p className="LayoutRole">
              {libelleDuRole(utilisateur.typeutilisateur)}
            </p>
            <span className="LayoutModifierProfil">
              <Pencil size={12} />
              Mon profil
            </span>
          </button>
          <button type="button" className="LayoutDeconnexion" onClick={deconnecter}>
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>
 
      {/* ===== Div du body ===== */}
      <div className="LayoutBody">
        <div className="LayoutEntete">
          <button
            type="button"
            className="LayoutBoutonMenu"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
          {IconeActive && <IconeActive size={24} />}
          <span>{menuActif ? menuActif.texte : ""}</span>
        </div>
 
        <div className="LayoutContenu">
          <div className="LayoutCarte">
            <Outlet />
          </div>
        </div>
      </div>

      {profilOuvert && (
        <PopupProfil
          utilisateur={utilisateur}
          onFermer={() => setProfilOuvert(false)}
          onEnregistre={() => setProfilOuvert(false)}
        />
      )}
    </div>
  );
}
 
export default Layout;
 