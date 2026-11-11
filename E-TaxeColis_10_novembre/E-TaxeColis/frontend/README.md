# Frontend E-TaxeColis (React + Vite)

## Démarrer

1. Démarrez d'abord le backend (`npm run dev` dans le dossier `backend`).
2. Dans ce dossier :
   ```
   npm install
   npm run dev
   ```
3. Ouvrez http://localhost:5173 et connectez-vous (ex: `taxateur@taxe.mg` / `Motdepasse1`).

L'adresse du backend est écrite à un seul endroit : `src/Simple composants/Outils/api.js` (`URL_API`).
Ce même fichier ajoute le jeton de connexion à toutes les requêtes axios et déconnecte l'utilisateur
si le backend répond 401 (session expirée). Voir **GUIDE.md** à la racine du zip.

## Pages par rôle

| Rôle | Pages |
|---|---|
| Admin | Utilisateur, Statut, Enregistrement facture |
| Taxateur | Nouvelle facture, Facture, Transport funéraire, Statistique, Client, Marchandise, Type de marchandise, Tarif, Tarif funéraire |
| Directeur | Recette, Statistique, Tableau de bord, Enregistrement facture |
| Chef de division | Recette, Statistique, Tableau de bord, Enregistrement facture, Zone, Destination, Wagon, Type de wagon |

## Où sont les règles de calcul

Toutes dans `src/Simple composants/Outils/calculsFacture.js` :

- **Express** : prix applicable = tarif ; poids facturé = poids réel ; 11 marchandises au maximum ;
  minimum 20 kg facturés (les kilos manquants au prix le plus élevé des lignes).
  Avec TVA : 20 % du montant HT. Sans TVA : TVA = 0, seulement les types non soumis à la TVA.
- **Wagon complet** (série 100 / 400) : la 1re ligne est le wagon (PPN ou Divers), poids facturé
  15 000 / 20 000 kg, prix = tarif. Les marchandises ajoutées ont un tarif 0 et augmentent les colis et le
  poids de la 1re ligne. Poids chargé maximum : 10 000 / 15 000 kg (constante `POIDS_MAX_WAGON`).
  Seule la 1re ligne est imprimée. TVA selon le type choisi (PPN / Divers).
- **Même marchandise ajoutée deux fois** : les colis et les poids sont additionnés.
- **Montant TTC** : arrondi à l'unité, puis à la centaine supérieure (16 250 → 16 300).
- **Transport funéraire** : montant HT = prix fixe × tarif de la zone ; TTC = HT + piquire, arrondi.

## Organisation

```
src/
├── App.jsx                       toutes les routes
├── Simple composants/            composants réutilisables
│   ├── PopupClient/              pop up Nouveau / Modifier client (page Client + nouvelle facture)
│   └── Outils/
│       ├── api.js                adresse du backend, jeton de connexion, déconnexion
│       ├── calculsFacture.js     règles de calcul
│       ├── calculsStats.js       dates et regroupements
│       ├── pdfFacture.js         PDF des factures (simple ou en double)
│       └── exportExcel.js        export Excel (page Recette)
└── Page composants/
    ├── Admin/
    ├── Taxateur/
    └── Pages communs/
```
