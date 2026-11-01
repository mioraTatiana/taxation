# E-TaxeColis — Guide d'installation et de compréhension

Ce guide explique :
1. ce qu'il faut installer sur votre PC,
2. comment préparer la base de données,
3. comment lancer le backend puis le frontend,
4. comment marchent la connexion, les rôles et l'email,
5. où se trouve chaque chose dans le code,
6. que faire si quelque chose ne marche pas.

---

## 1. Ce qu'il faut installer (une seule fois)

| Logiciel | Pourquoi | Où le trouver |
|---|---|---|
| **Node.js** (version 20 ou plus récente, LTS) | fait tourner le backend et le frontend | https://nodejs.org |
| **PostgreSQL** (16 ou 17) + **pgAdmin** | la base de données | https://www.postgresql.org/download/ (pgAdmin est inclus) |
| Un éditeur de code (VS Code) | lire et modifier le code | https://code.visualstudio.com |

Pour vérifier Node.js, ouvrez un terminal (Invite de commandes ou PowerShell) :
```
node -v
npm -v
```
Les deux commandes doivent afficher un numéro de version.

Notez le **mot de passe de l'utilisateur `postgres`** choisi pendant l'installation de PostgreSQL :
vous en aurez besoin dans le fichier `.env`.

---

## 2. Décompresser le projet

Décompressez le zip, par exemple dans `C:\Projets\E-TaxeColis`. Vous obtenez :

```
E-TaxeColis/
├── GUIDE.md        ← ce guide
├── backend/        ← serveur Express (Node.js) + scripts SQL
└── frontend/       ← application React (ce que l'utilisateur voit)
```

---

## 3. Préparer la base de données (pgAdmin)

### 3.1 Créer la base
1. Ouvrez pgAdmin, connectez-vous au serveur.
2. Clic droit sur **Databases** → **Create** → **Database…**
3. Nom : `taxation` → **Save**.

> Si vous utilisez votre base existante (restaurée depuis `Taxation.sql`, nommée par exemple `taxation 1`),
> ne la recréez pas : passez au 3.2 en sautant le fichier `0_…`, et mettez son nom exact dans `DB_NAME` du `.env`.

### 3.2 Exécuter les scripts SQL
Clic droit sur la base `taxation` → **Query Tool**. Pour chaque fichier ci-dessous :
bouton **Open File** (icône dossier), choisissez le fichier, puis **Execute** (▶ ou F5).

| Ordre | Fichier (dans `backend/Sql/`) | Quand |
|---|---|---|
| 1 | `0_creation_tables.sql` | **seulement sur une base vide** (crée toutes les tables) |
| 2 | `1_amelioration_base.sql` | **toujours** (corrige le numéro de facture, les montants, ajoute la zone au tarif funéraire…) |
| 3 | `2_donnees_test.sql` | facultatif : zones, destinations, wagons, marchandises, tarifs, clients et 3 comptes de test |

Le compte **administrateur** n'est pas dans ces scripts : il se crée avec une commande (étape 4.3),
car son mot de passe doit être chiffré (bcrypt).

---

## 4. Lancer le backend

### 4.1 Installer les modules
Dans un terminal :
```
cd C:\Projets\E-TaxeColis\backend
npm install
```
(Cela crée le dossier `node_modules`. À faire une seule fois, ou après un changement de `package.json`.)

### 4.2 Remplir le fichier `.env`
Ouvrez `backend/.env` avec VS Code. Les lignes importantes :

| Ligne | À mettre |
|---|---|
| `DB_PASSWORD=` | le mot de passe de `postgres` sur votre PC |
| `DB_NAME=` | le nom de la base (`taxation`) |
| `JWT_SECRET=` | une longue phrase secrète inventée (au moins 30 caractères) |
| `ADMIN_EMAIL=` / `ADMIN_MOTPASSE=` | l'email et le mot de passe du compte administrateur |
| `SMTP_USER=` / `SMTP_PASS=` | l'adresse Gmail et son mot de passe d'application (voir partie 7) — laissez vide au début |

Pas d'espace autour du `=`. Le fichier `.env.exemple` est une copie de secours.

### 4.3 Créer le compte administrateur
```
npm run creer-admin
```
Résultat attendu :
```
Compte administrateur créé (USER01).
  Email        : admin@etaxecolis.mg
```
Cette commande peut être relancée : si l'email existe déjà, le compte redevient admin actif avec le mot de passe
du `.env` (pratique si vous oubliez le mot de passe de l'admin).

### 4.4 Démarrer le serveur
```
npm run dev
```
Résultat attendu :
```
Serveur démarré sur http://localhost:8082
Connexion réussie à la base de données taxation
Emails en MODE TEST : ils sont affichés ici au lieu d'être envoyés
```
**Laissez ce terminal ouvert** : si vous le fermez, le backend s'arrête.
(`npm run dev` utilise nodemon : le serveur redémarre tout seul quand vous modifiez un fichier.)

---

## 5. Lancer le frontend

Ouvrez un **deuxième** terminal :
```
cd C:\Projets\E-TaxeColis\frontend
npm install
npm run dev
```
Puis ouvrez **http://localhost:5173** dans le navigateur.

Comptes disponibles :

| Email | Mot de passe | Rôle | Statut |
|---|---|---|---|
| `admin@etaxecolis.mg` | celui du `.env` (`Admin@2026` par défaut) | Admin | actif |
| `taxateur@taxe.mg` | `Motdepasse1` | Taxateur | actif (données de test) |
| `directeur@taxe.mg` | `Motdepasse1` | Directeur | actif (données de test) |
| `chef@taxe.mg` | `Motdepasse1` | Chef de division | en attente : l'admin doit l'accepter |

---

## 6. Comment marche la connexion (authentification)

### 6.1 Le parcours d'un nouvel utilisateur
```
 Inscription (/inscription)
      │  POST /user/ajouter  → statut "en attente"
      ▼
 Pop-up : « Demande de création de compte enregistrée… un courrier électronique vous sera adressé… »
      │
      ▼
 L'admin ouvre « Utilisateur » → bouton « Accepter » (il peut changer le rôle)
      │  PUT /user/activer/:iduser → statut "actif"
      ▼
 Email « Confirmation de l'activation de votre compte » envoyé à l'utilisateur
      │
      ▼
 L'utilisateur se connecte (/authentification)
```

### 6.2 Le jeton (JWT)
1. À la connexion, le backend vérifie l'email, le mot de passe (bcrypt) et que le statut est « actif ».
2. Il répond `{ utilisateur, token }`. Le `token` est un **jeton signé** avec `JWT_SECRET` ;
   il est valable `JWT_DUREE` (8 h par défaut).
3. Le frontend garde le jeton dans le `sessionStorage` (il disparaît quand on ferme l'onglet).
4. **À chaque requête**, le frontend l'ajoute tout seul dans l'en-tête
   `Authorization: Bearer <jeton>` (fichier `frontend/src/Simple composants/Outils/api.js`, « intercepteur axios »).
5. Le backend (`backend/Route/Securite/auth.js`, fonction `verifierToken`) vérifie le jeton **et** relit
   l'utilisateur dans la base : un compte désactivé est bloqué tout de suite, même avec un jeton encore valide.
6. Si le backend répond 401 (jeton expiré, compte désactivé), le frontend déconnecte l'utilisateur et
   affiche « Votre session a expiré, veuillez vous reconnecter ».

### 6.3 Qui peut faire quoi (fichier `backend/server.js`)

| Données | Lire | Ajouter / modifier / supprimer |
|---|---|---|
| Zones, destinations, wagons, types de wagon | tout utilisateur connecté | admin |
| Clients, marchandises, types, tarifs, tarifs funéraires | tout utilisateur connecté | taxateur, admin |
| Factures marchandise et funéraires | tout utilisateur connecté | taxateur (création seulement) |
| Recette, statistique, tableau de bord | tout utilisateur connecté | — |
| Liste des utilisateurs, activer, désactiver | admin | admin |
| Son propre mot de passe / ses informations | — | l'utilisateur lui-même |

Autres règles : l'inscription ne peut pas demander le rôle « admin », et l'admin ne peut pas se désactiver
lui-même. Le menu de gauche n'affiche que les pages du rôle (`frontend/src/Simple composants/Layout/menus.js`).
La facture enregistre automatiquement le taxateur connecté (`iduser` lu dans le jeton).

---

## 7. L'email d'activation

Fichier : `backend/Route/Email/email.js` (module **nodemailer**).

### 7.1 Mode test (par défaut)
Si `SMTP_USER` est vide dans `.env`, aucun email n'est envoyé : son texte s'affiche dans le terminal du backend.
Pratique pour tester sans configuration.

### 7.2 Envoyer de vrais emails avec Gmail
1. Utilisez une adresse Gmail (de préférence une adresse dédiée à l'application).
2. Activez la **validation en deux étapes** sur ce compte Google (Gérer votre compte Google → Sécurité).
3. Toujours dans Sécurité, créez un **mot de passe d'application**
   (recherchez « Mots de passe des applications ») : Google donne 16 lettres.
4. Dans `backend/.env` :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=votre.adresse@gmail.com
   SMTP_PASS=abcdefghijklmnop        (les 16 lettres, sans espaces)
   EMAIL_EXPEDITEUR=E-TaxeColis <votre.adresse@gmail.com>
   ```
5. Redémarrez le backend (Ctrl + C puis `npm run dev`).

Le mot de passe normal de Gmail **ne marche pas** : il faut le mot de passe d'application.
Si l'envoi échoue, le compte est quand même activé et l'admin voit le message
« Compte activé, mais l'email n'a pas pu être envoyé » ; l'erreur exacte s'affiche dans le terminal du backend.

Pour changer le texte de l'email, modifiez `envoyerEmailActivation` dans `email.js`
(il y a une version texte et une version HTML : changez les deux).

---

## 8. Ce qu'il y a dans le code

### 8.1 Le principe
```
 Navigateur (React, port 5173)  ──axios + jeton──►  Backend Express (port 8082)  ──SQL──►  PostgreSQL
        frontend/                                        backend/                         base "taxation"
```
- Le **frontend** affiche les pages, fait les **calculs des factures**, crée les **PDF** et l'**Excel**.
- Le **backend** vérifie la connexion et les droits, lit et écrit dans la base, envoie les emails.

### 8.2 Le backend
```
backend/
├── server.js                  branche les routes et leurs droits (voir 6.3)
├── .env                       réglages : base, jeton, admin, email
├── scripts/creerAdmin.js      npm run creer-admin
├── Sql/                       0_creation_tables, 1_amelioration_base, 2_donnees_test
└── Route/
    ├── Bd/db.js               connexion à PostgreSQL (une seule, partagée)
    ├── Securite/auth.js       jeton JWT, verifierToken, autoriser, ecriturePour
    ├── Email/email.js         envoi de l'email d'activation
    ├── Login/usertable.js     inscription, connexion, activer, désactiver, mot de passe
    ├── Admin/                 zonedestination, destination, typewagon, wagon
    ├── Taxateur/              client, typemarchandise, marchandise, tarifmarchandise,
    │                          tariffuneraire, facturemarchandise, facturefuneraire
    └── Direction/             recette, statistique, tableaudebord, toutesFactures
```
Toutes les tables simples suivent le même modèle :
`POST /x/ajouter`, `GET /x/selectionnertout`, `GET /x/:id`, `PUT /x/modifier/:id`, `DELETE /x/supprimer/:id`.
Le détail de chaque route est dans `backend/README.md`.

**Enregistrement d'une facture marchandise** (`facturemarchandise.js`, `POST /ajouter`) :
le frontend envoie la facture et toutes ses lignes en une fois ; le backend ouvre une **transaction**
(`BEGIN`), ajoute la facture, récupère son id, ajoute chaque ligne, puis `COMMIT`.
Si une ligne échoue : `ROLLBACK`, rien n'est enregistré.

### 8.3 Le frontend
```
frontend/src/
├── main.jsx                      démarre React (et active le jeton dans axios)
├── App.jsx                       la liste des pages (routes)
├── Simple composants/            morceaux réutilisables (bouton, pop-up, tableau, select…)
│   ├── Layout/                   menu de gauche + vérification de la connexion
│   ├── PopupClient/              ajouter / modifier un client
│   └── Outils/
│       ├── api.js                adresse du backend, jeton, déconnexion
│       ├── calculsFacture.js     TOUTES les règles de calcul
│       ├── calculsStats.js       dates, regroupements
│       ├── pdfFacture.js         PDF des factures
│       └── exportExcel.js        export Excel
└── Page composants/
    ├── Admin/                    Utilisateurs, Zones, Destination, Wagon, TypesWagon
    ├── Taxateur/                 Nouvelle Facture, Facture, TransportFuneraire, Clients,
    │                             Marchandise, TypeMarchandise, Tarif, TarifFuneraire
    └── Pages communs/            Login, CreerCompte, Recette, Statistique, TableauDeBord
```
Chaque page CRUD est construite pareil : `chargerDonnees()` (GET) au démarrage → tableau →
pop-up d'ajout / modification → `enregistrer()` (POST ou PUT) → `supprimer()` (DELETE) → on relit la liste.

**Règles de calcul** (`calculsFacture.js`) :
- Express : prix applicable = tarif, poids facturé = poids réel, 11 marchandises maximum, minimum 20 kg facturés ;
  TVA 20 % (avec TVA) ou 0 (sans TVA).
- Wagon complet (série 100 / 400) : la 1re ligne est le wagon (PPN ou Divers), facturé 15 000 / 20 000 kg ;
  les marchandises ajoutées ont un tarif 0 ; charge maximale 10 000 / 15 000 kg ; seule la 1re ligne est imprimée.
- Même marchandise ajoutée deux fois : colis et poids additionnés.
- TTC arrondi à la centaine supérieure (16 250 → 16 300).
- Funéraire : montant HT = prix fixe × tarif de la zone ; TTC = HT + piquire, arrondi.

---

## 9. Problèmes fréquents

| Ce que vous voyez | Cause et solution |
|---|---|
| `Erreur de connexion à la base de données` (terminal backend) | `DB_PASSWORD` ou `DB_NAME` faux dans `.env`, ou PostgreSQL arrêté |
| `password authentication failed for user "postgres"` | mauvais `DB_PASSWORD` |
| `database "taxation" does not exist` | créez la base (3.1) ou corrigez `DB_NAME` |
| `relation "usertable" does not exist` | les scripts SQL n'ont pas été exécutés sur la bonne base (3.2) |
| `npm run creer-admin` : « Remplissez ADMIN_EMAIL… » | complétez ces lignes dans `.env` |
| Page de connexion : « Connexion impossible : le serveur ne répond pas » | le backend n'est pas lancé (4.4) ou n'est pas sur le port 8082 |
| « Votre compte est en attente d'activation » | l'admin doit cliquer sur « Accepter » |
| « Email non envoyé » / `Invalid login: 535` | mauvais `SMTP_USER` / `SMTP_PASS` : utilisez un **mot de passe d'application** Gmail (7.2) |
| `EADDRINUSE: address already in use :::8082` | le backend est déjà lancé dans un autre terminal ; fermez-le ou changez `PORT` |
| Le frontend s'ouvre sur un autre port que 5173 | changez `URL_FRONTEND` dans `.env` (sert au lien de l'email) |
| Le backend est sur un autre PC ou un autre port | changez `URL_API` dans `frontend/src/Simple composants/Outils/api.js` |
| « Aucun tarif pour cette destination… » dans la facture | ajoutez le tarif manquant dans la page Tarif (ou Tarif funéraire) |

---

## 10. Avant une vraie mise en service

- Changez `JWT_SECRET` et `ADMIN_MOTPASSE`, puis relancez `npm run creer-admin`.
- Ne publiez jamais le fichier `.env` (il est déjà dans `.gitignore`).
- Pour l'utiliser sur plusieurs postes du réseau : lancez le frontend avec `npm run dev -- --host`,
  et remplacez `localhost` dans `URL_API` (frontend) et `URL_FRONTEND` (backend) par l'adresse IP du PC serveur.
