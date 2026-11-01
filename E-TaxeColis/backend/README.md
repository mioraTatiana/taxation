# Backend E-TaxeColis (Express + PostgreSQL)

## Installation

Voir **GUIDE.md** (à la racine du zip) pour l'installation pas à pas. En résumé :

1. Dans pgAdmin (Query Tool), sur la base `taxation` :
   `Sql/0_creation_tables.sql` (base vide seulement), puis `Sql/1_amelioration_base.sql`,
   puis `Sql/2_donnees_test.sql` (facultatif).
2. Remplir `.env` (base, `JWT_SECRET`, compte admin, email).
3. ```
   npm install
   npm run creer-admin
   npm run dev
   ```

## Sécurité

- `Route/Securite/auth.js` : jeton JWT (`creerToken`), `verifierToken`, `autoriser(...)`, `ecriturePour(...)`.
- `server.js` dit quelles routes demandent une connexion et quel rôle peut écrire (voir GUIDE.md, 6.3).
- Le frontend envoie le jeton dans l'en-tête `Authorization: Bearer <jeton>`.

## Email

`Route/Email/email.js` envoie l'email de confirmation quand l'admin active un compte.
Sans `SMTP_USER` dans `.env`, l'email est seulement affiché dans le terminal (mode test).

## Ce que fait 1_amelioration_base.sql

| Changement | Pourquoi |
|---|---|
| Trigger `generer_num_facture` corrigé | Il utilisait `datefacture` et `numFacture` : chaque ajout de facture marchandise plantait |
| Montants en `double precision` | `real` ne garde que 7 chiffres (1 234 567,89 devenait 1 234 568) ; `montanthttotal` était un entier |
| `detailfacture.idmarchandise` facultatif | Wagon complet : la 1re ligne est le wagon (PPN ou Divers), sans marchandise |
| Clé étrangère `facturemarchandise.iduser` | Elle manquait |
| Email utilisateur unique | Il sert à se connecter |
| `tariffuneraire` : id `TF01`, `TF02`… + colonne `idzone` | Le tarif funéraire dépend de la zone de la destination |

## Organisation

```
backend/
├── server.js                 branche toutes les routes
├── .env                      connexion à la base
├── Sql/                      scripts à exécuter dans pgAdmin
├── scripts/creerAdmin.js     npm run creer-admin
└── Route/
    ├── Bd/db.js              connexion partagée (pool)
    ├── Securite/auth.js      jeton JWT et droits par rôle
    ├── Email/email.js        email d'activation (nodemailer)
    ├── Login/usertable.js
    ├── Admin/                zonedestination, destination, typewagon, wagon
    ├── Taxateur/             client, typemarchandise, marchandise, tarifmarchandise,
    │                         tariffuneraire, facturemarchandise, facturefuneraire
    └── Direction/            recette, statistique, tableaudebord, toutesFactures
```

## Les routes

Tables simples (même modèle pour `zone`, `destination`, `typewagon`, `wagon`, `client`,
`typemarchandise`, `marchandise`, `tarifmarchandise`, `tariffuneraire`) :

| Méthode | Adresse |
|---|---|
| POST | `/zone/ajouter` |
| GET | `/zone/selectionnertout` (une liste vide renvoie `[]`) |
| GET | `/zone/:idzone` |
| PUT | `/zone/modifier/:idzone` |
| DELETE | `/zone/supprimer/:idzone` (409 si la ligne est utilisée ailleurs) |

### Utilisateurs (`/user`)

| Méthode | Adresse | Qui | Rôle |
|---|---|---|---|
| POST | `/ajouter` | tout le monde | Création de compte, statut « en attente » (le rôle admin est refusé) |
| POST | `/authentification` | tout le monde | Renvoie `{ utilisateur, token }` ; refusé si le statut n'est pas « actif » |
| GET | `/selectionnertout` | admin | Le mot de passe n'est jamais renvoyé |
| GET | `/:iduser` | l'utilisateur lui-même ou l'admin | |
| PUT | `/activer/:iduser` | admin | → « actif » (+ rôle facultatif) puis email de confirmation ; renvoie `emailEnvoye` |
| PUT | `/desactiver/:iduser` | admin | → « desactive » (pas son propre compte) |
| PUT | `/changermotpasse/:iduser` | l'utilisateur lui-même | `ancienmotpasse` + `nouveaumotpasse` |
| PUT | `/modifier/:iduser` | l'utilisateur lui-même | nom et email, confirmés par `motpasse` |

### Factures marchandise (`/facturemarchandise`)

**Ajout : `POST /ajouter`**. Les calculs sont faits par le frontend. Il envoie en une fois :

```json
{
  "nombrecolistotal": 6, "poidsreeltotal": 210, "poidsfacturetotal": 210,
  "piquiremarchandise": 1000, "tva": 6300, "montanthttotal": 31500, "montantttc": 38800,
  "idclient": "CLT01", "iddestination": "DST01",
  "lignes": [
    { "nombrecolis": 3, "poidsreel": 150, "poidsfacture": 150, "prixapplicable": 150,
      "montantht": 22500, "idtarifmarchandise": "TRF01", "idmarchandise": 1, "idwagon": null }
  ]
}
```

Ce que fait le serveur :
1. `BEGIN` : ouvre une transaction.
2. Ajoute la facture dans `facturemarchandise` avec `RETURNING idfacturemarchandise`
   (date = date du serveur, numéro créé par le trigger, `iduser` = le taxateur connecté, lu dans le jeton).
3. Boucle sur `lignes` : un ajout dans `detailfacture` par ligne, avec cet id.
4. `COMMIT` : tout est enregistré.
5. Si une étape échoue : `ROLLBACK`, rien n'est enregistré. Il n'y a donc jamais de facture à moitié enregistrée.

**Sélections** (pas de modification ni de suppression) :

| Adresse | Renvoie |
|---|---|
| `/selectionnertout` | toutes les factures + nom du client + nom de la destination |
| `/:id` | une facture + nom du client + nom de la destination |
| `/detail/selectionnertout` | toutes les lignes de `detailfacture` |
| `/detail/:iddetailfacture` | une ligne de `detailfacture` |
| `/complet/selectionnertout` | toutes les factures + noms + leurs lignes (champ `details`) |
| `/complet/:id` | une facture + noms + ses lignes |
| `/complet/client/:idclient` | les factures complètes d'un client |

Toutes les listes acceptent `?debut=2026-11-01&fin=2026-11-30`.

### Factures funéraires (`/facturefuneraire`)

`POST /ajouter`, `GET /selectionnertout`, `GET /:id`. Les deux sélections renvoient le nom du client et le nom
de la destination. Le numéro (`001/01-11-2026/F`) est créé par le trigger de la base.

## Recette, statistique, tableau de bord

Les trois fichiers utilisent `Route/Direction/toutesFactures.js` : une requête qui met les factures marchandise
et funéraires dans une seule liste, avec une colonne `transport` qui vaut **Express**, **Wagon complet** ou
**Funéraire**. Le poids et les colis d'une facture funéraire valent 0.

- **recette.js**
  - `/recette/parzone` : recette et poids par date, transport et zone (sert à la page et à l'export Excel)
  - `/recette/parmois` : recette et poids par mois et par transport
  - Filtres : `?debut=…&fin=…&transport=Express` (ou `Wagon complet`, `Funéraire`, `tous`)
- **statistique.js** : les deux tables sont bien séparées
  - `/statistique/marchandise` : factures marchandise avec leurs lignes
  - `/statistique/funeraire` : factures funéraires
  - `/statistique/totaux` : une ligne par transport (nombre, recette, poids, colis)
- **tableaudebord.js**
  - `/totaux` : totaux, avec le détail marchandise / funéraire
  - `/moiscourant` : mois en cours, mois précédent, part funéraire du mois
  - `/parmois`, `/partransport`, `/parzone`, `/topclients` : marchandise + funéraire, format `[{ libelle, valeur }]`
  - `/parmarchandise` : poids par type de marchandise (marchandises seulement)
