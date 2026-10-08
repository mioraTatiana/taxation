import React, { useState } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { User, LogOut, Menu } from "lucide-react";
import "./Layout.css";
import MenuItem from "./MenuItem";
import { menusDuRole, libelleDuRole } from "./menus";

// Utilisateur connecté, gardé dans le sessionStorage au moment du login :
// { nomutilisateur: "Miora Tatiana", typeutilisateur: "admin", image: "..." }
function lireUtilisateur() {
  try {
    return JSON.parse(sessionStorage.getItem("utilisateur"));
  } catch {
    return null;
  }
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false); // tiroir (tablette / téléphone)
  const utilisateur = lireUtilisateur();

  if (!utilisateur) {
    return <Navigate to="/" replace />;
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
    sessionStorage.removeItem("utilisateur");
    toast.success("Vous êtes déconnecté");
    navigate("/");
  }

  return (
    <div className="Layout">
      {/* Fond sombre derrière le tiroir (visible seulement sur tablette / téléphone) */}
      {menuOuvert && <div className="LayoutFond" onClick={fermerMenu} />}

      {/* ===== Div du menu ===== */}
      <div className={menuOuvert ? "LayoutMenu LayoutMenuOuvert" : "LayoutMenu"}>
        <div className="LayoutLogo">
          <img src="/logo.png" alt="E-TaxeColis" />
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
          {utilisateur.image ? (
            <img
              src={utilisateur.image}
              alt={utilisateur.nomutilisateur}
              className="LayoutAvatar"
            />
          ) : (
            <div className="LayoutAvatar LayoutAvatarVide">
              <User size={20} />
            </div>
          )}
          <p className="LayoutNom">{utilisateur.nomutilisateur}</p>
          <p className="LayoutRole">
            {libelleDuRole(utilisateur.typeutilisateur)}
          </p>
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
    </div>
  );
}

export default Layout;