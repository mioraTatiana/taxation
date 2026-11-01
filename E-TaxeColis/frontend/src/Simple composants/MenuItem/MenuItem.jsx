import React from "react";
import { NavLink } from "react-router-dom";
import "./MenuItem.css";

// Un élément du menu : il suffit de lui donner une icône, un texte et un chemin
function MenuItem({ icone: Icone, texte, chemin }) {
  function classe({ isActive }) {
    return isActive ? "menuItem menuItemActif" : "menuItem";
  }

  return (
    <NavLink to={chemin} className={classe}>
      <Icone size={22} />
      <span>{texte}</span>
    </NavLink>
  );
}

export default MenuItem;
