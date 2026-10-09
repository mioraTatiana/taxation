// Simule l'id généré par la base (ex: ZN01, TRN02, CLT03) tant que l'API n'est pas branchée.
// Avec la vraie base, l'id est créé par PostgreSQL (valeur par défaut de la colonne).
export function idSuivant(liste, cle, prefixe) {
  const numeros = liste.map(
    (element) => parseInt(String(element[cle]).replace(prefixe, ""), 10) || 0
  );
  const suivant = Math.max(0, ...numeros) + 1;
  return prefixe + String(suivant).padStart(2, "0");
}

// Retourne le libellé lié à une clé étrangère.
// Ex: trouverLibelle(zones, "idzone", "ZN01", "libellezone") -> "Zone 1"
export function trouverLibelle(liste, cle, valeur, champ) {
  const element = liste.find((e) => e[cle] === valeur);
  return element ? element[champ] : valeur;
}
