// Retourne le libellé lié à une clé étrangère.
// Ex: trouverLibelle(zones, "idzone", "ZN01", "libellezone") -> "Zone 1"
export function trouverLibelle(liste, cle, valeur, champ) {
  const element = liste.find((e) => e[cle] === valeur);
  return element ? element[champ] : valeur;
}
