# CONTEXTE DU PROJET E-TaxeColis (à donner au début d'une nouvelle conversation)

Je développe **E-TaxeColis**, application web de taxation des colis et des transports funéraires
pour la **FCE** (chemin de fer Fianarantsoa – Côte Est, Madagascar). C'est mon projet de mémoire.
Je joins le zip du projet (backend + frontend, sans node_modules).

## Mes règles de travail
- Répondre **en français**.
- Code **simple**, garder **ma façon de coder** (noms de variables et de fonctions en français, commentaires en français, pas de bibliothèque en plus sans raison).
- Me donner **seulement les fichiers à modifier** (dans un zip, avec la même arborescence que le projet), sauf si je demande tout le projet.
- Expliquer brièvement ce qui change et ce que je dois exécuter (SQL, npm…).

## Technologies
- **Frontend** : React 19 + Vite (port 5173), axios, react-router-dom, zod, react-hot-toast, lucide-react, jsPDF + jspdf-autotable (PDF), xlsx (Excel).
- **Backend** : Node.js + Express 5 (port 8082), pg (PostgreSQL), jsonwebtoken (JWT), bcryptjs, nodemailer, dotenv.
- **Base** : PostgreSQL, base **taxation** (gérée avec pgAdmin).

## Structure
```
backend/
  server.js                    routes + droits (verifierToken, autoriser, ecriturePour)
  .env                         DB_*, PORT=8082, JWT_SECRET, JWT_DUREE=8h, SMTP_* (vide = mode test)
  Route/Bd/db.js               pool PostgreSQL
  Route/Securite/auth.js       JWT ; rôles ADMIN, TAXATEUR, DIRECTEUR, CHEF_DIVISION, RECEVEUR
  Route/Login/usertable.js     inscription, connexion, activation (+ email), profil, statut
  Route/Email/email.js         email d'activation
  Route/Admin/                 zonedestination, destination, wagon, typewagon, enregistrement
  Route/Taxateur/              client, marchandise, typemarchandise, tarifmarchandise, tariffuneraire,
                               facturemarchandise (ajouter + modifier en transaction), facturefuneraire
  Route/Direction/             toutesFactures (UNION marchandise + funéraire, filtre commun),
                               recette, statistique (+ /mensuelle), tableaudebord
  Sql/                         0_creation_tables, 1_amelioration_base, 2_donnees_test,
                               3_ajout_utilisateurs, 4_mise_a_jour_novembre, taxation_complet
frontend/src/
  App.jsx                      routes
  Simple composants/           composants réutilisables (Popup, SelectInput, GroupeRadio, Input,
                               TableDonnees, FiltreDates, ChampRecherche, ChampSuggestions,
                               PopupClient, PopupMarchandise, FormulaireLigne, Layout + menus.js…)
  Simple composants/Outils/    api.js (URL_API, jeton, intercepteurs axios), calculsFacture.js
                               (TOUTES les règles de calcul), calculsStats.js, pdfFacture.js,
                               pdfOutils.js, exportExcel.js
  Page composants/Admin/       Utilisateurs, Statut, EnregistrementFacture, Zones, Destination,
                               Wagon, TypesWagon
  Page composants/Taxateur/    Nouvelle Facture (FactureClient, FactureEmbarquement, FactureColis,
                               FactureFuneraire), Facture, TransportFuneraire, Clients, Marchandise,
                               TypeMarchandise, Tarif, TarifFuneraire
  Page composants/Pages communs/ Login, CreerCompte, Recette (+ PopupExportExcel), TableauDeBord,
                               Statistique (CarteFacture, CarteFuneraire, PopupModifierFacture,
                               pdfBordereau.js, pdfStatistiqueMensuelle.js)
```

## Rôles et menus
| Rôle | Menus |
|---|---|
| admin | Utilisateur, Statut, Enregistrement facture |
| taxateur | Nouvelle facture, Facture, Transport funéraire, Client, Marchandise, Type de marchandise |
| directeur | Recette, Statistique, Tableau de bord, Enregistrement facture |
| chef de division | menus du directeur + Zone, Destination, Wagon, Type de wagon, Tarif, Tarif funéraire (modifie) |
| receveur | Statistique, Recette, Tarif, Tarif funéraire (lecture seule), Enregistrement facture, Tableau de bord |

Droits backend : lecture (GET) pour tout utilisateur connecté ; écriture : zones/destinations/wagons/types
de wagon/tarifs = chef de division ; clients/marchandises/types = taxateur et admin ; création de facture =
taxateur ; modification des lignes d'une facture = chef de division et receveur.
Statuts des comptes : « en attente », « actif », « desactive ». Session : sessionStorage + JWT (8 h).

## Règles de calcul (calculsFacture.js)
- **Express** : prix = tarif (zone + type de marchandise + type de wagon) ; poids facturé = poids réel ;
  11 marchandises maximum ; **minimum 20 kg** (kilos manquants au prix le plus élevé) ;
  TVA 20 % (« Avec TVA ») ou 0 (« Sans TVA ») ; piquire 1 000 Ar ;
  TTC = HT + TVA + piquire, arrondi à la centaine supérieure.
- **Wagon complet** (Série 100 / Série 400) : 1re ligne = le wagon (PPN ou Divers), poids facturé et
  poids supporté lus dans la table typewagon (Série 100 : 20 000 / 15 000 kg ; Série 400 : 25 000 / 20 000 kg),
  les marchandises ajoutées ont un prix 0 ; le poids chargé ne dépasse pas le poids supporté.
- Même marchandise ajoutée deux fois : colis et poids additionnés.
- Désignation : choisie dans la liste OU écrite à la main (on choisit alors le type) ;
  « Poids réglé » (colis × poids d'un colis) ou « Poids non réglé » (poids réel saisi).
- **Funéraire** : HT = prix fixe (Ar) × distance zone ; TTC = HT + piquire, arrondi.
- Numéros de facture créés par des triggers PostgreSQL (001/02-06-2026 ; funéraire 001/02-06-2026/F).

## PDF
- Factures : noir et blanc, sans signatures, Express = colonne « Poids » ; wagon complet = toutes les lignes,
  plusieurs pages numérotées ; en double (paysage) après « Enregistrer et imprimer ».
- Statistique : « Statistique en PDF » (fiche mensuelle Express, gare de Fianarantsoa) et
  « Bordereau en PDF » (zone > destination > transport > client > facture > lignes, totaux ;
  destinataire Bagagiste = sans montants).

## Base de données (colonnes ajoutées récemment)
client.telephone facultatif ; typewagon.poidssupporte ; detailfacture.designation (texte écrit par le
taxateur) ; detailfacture.idmarchandise facultatif ; montants en double precision.

## Comptes de test
admin@etaxecolis.mg / Admin@2026 – ttnmiora@gmail.com / miora123 (taxateur) –
hasimiora.randira@gmail.com / Hasina2026 (chef de division) – directeur@taxe.mg / Motdepasse1 –
receveur@taxe.mg / Motdepasse1

## Lancement
pgAdmin : exécuter `backend/Sql/4_mise_a_jour_novembre.sql` sur la base taxation (ou `taxation_complet.sql`
sur une base vide). Puis `npm install` et `npm run dev` dans backend, puis dans frontend.

## Dernière version
E-TaxeColis_10_novembre.zip (10 novembre 2026) : toutes les demandes du document « Amélioration » sont faites.

## Ma demande maintenant
(écrire ici ce que vous voulez)
