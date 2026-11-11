# E-TaxeColis – version du 10 novembre 2026

Cette version contient toutes les améliorations du document « Amélioration ».

## 1. Lancer l'application sur votre PC

### a) La base de données (pgAdmin)

**Votre base « taxation » existe déjà, avec vos données :**
1. pgAdmin > clic droit sur la base **taxation** > **Query Tool**.
2. Ouvrez `backend/Sql/4_mise_a_jour_novembre.sql` puis cliquez sur **Exécuter** (F5).
3. C'est tout : vos clients, factures et utilisateurs sont gardés.
   Ce fichier peut être relancé sans erreur.

**Nouvelle base vide :** créez une base « taxation », puis exécutez `backend/Sql/taxation_complet.sql`
(tables + corrections + données de test + mise à jour de novembre).

### b) Le backend
```
cd backend
npm install
npm run dev
```
Votre fichier `.env` est déjà dedans (le vôtre, avec votre mot de passe PostgreSQL).
Le terminal doit afficher : `Serveur démarré sur http://localhost:8082`.

### c) Le frontend (dans un 2e terminal)
```
cd frontend
npm install
npm run dev
```
Ouvrez http://localhost:5173.

### Comptes
| Email | Mot de passe | Rôle |
|---|---|---|
| admin@etaxecolis.mg | Admin@2026 | Administrateur |
| ttnmiora@gmail.com | miora123 | Taxateur |
| hasimiora.randira@gmail.com | Hasina2026 | Chef de division |
| directeur@taxe.mg | Motdepasse1 | Directeur |
| **receveur@taxe.mg** | **Motdepasse1** | **Receveur (nouveau)** |

## 2. Ce qui a changé

| Demande | Où |
|---|---|
| Client : recherche par nom (%nom%), téléphone facultatif, adresse = liste des destinations ou texte libre | Page Client, pop up client |
| Tarif funéraire : « Ar » dans Prix fixe, « Distance zone » sans Ar | Page Tarif funéraire |
| Nouveau rôle **receveur** : Statistique, Recette, Tarif, Tarif funéraire (lecture), Enregistrement facture, Tableau de bord | Menus, backend |
| Statistique : « Enregistré par » + bouton **Modifier** (chef de division et receveur) qui modifie les lignes d'une facture | Page Statistique |
| **Statistique en PDF** : mois + année (mois en cours), fiche « Statistiques voyageurs et marchandises », Express, gare de Fianarantsoa | Page Statistique |
| **Bordereau en PDF** (ancien « Imprimer ») : destinataire, factures, wagon, période ; par zone > destination > Express/Wagon complet > client > facture > lignes, totaux par destination, par zone et total général ; **Bagagiste** = sans montants | Page Statistique |
| Nouvelle facture : désignation **dans la liste ou écrite**, type automatique ou choisi ; **Poids réglé / Poids non réglé** | Colis à expédier |
| Facture PDF : noir et blanc, police plus grande, sans signatures, Express = colonne « Poids » seulement, wagon complet = toutes les marchandises sur plusieurs pages, numéros de page | PDF des factures |
| Série 100 : facturé 20 000 kg / supporté 15 000 kg ; Série 400 : 25 000 / 20 000 (modifiable dans la table) | Page Type de wagon |
| Recette : pop up **Exporter en Excel** (1re, 2e, 3e décade ou période ; transport ; type de wagon) | Page Recette |
| Utilisateurs : en attente > désactivé > actif, recherche par nom, filtre par statut | Page Utilisateur |
| Tarifs déplacés chez le chef de division | Menus |
| Enregistrement facture : période aussi dans la fenêtre des factures, recherche par nom | Page Enregistrement facture |
| Statistique retirée du taxateur | Menus |

## 3. Base de données (fichier 4)
- `client.telephone` devient facultatif
- `typewagon.poidssupporte` (nouvelle colonne) ; `poidsfacturation` = 20 000 / 25 000
- `detailfacture.designation` (nouvelle colonne) : désignation écrite par le taxateur
- compte de test receveur

Les anciennes factures en wagon complet gardent leur poids facturé d'origine (15 000 / 20 000 kg) :
seules les nouvelles factures utilisent 20 000 / 25 000 kg.
