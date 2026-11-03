-- =====================================================================
-- DONNÉES DE TEST — ligne FCE (Fianarantsoa – Côte Est)
-- À exécuter APRÈS 1_amelioration_base.sql, dans le Query Tool de pgAdmin.
--
-- ATTENTION : ce fichier VIDE d'abord toutes les tables SAUF usertable
-- (zones, destinations, wagons, marchandises, tarifs, clients, factures),
-- puis les remplit. Les comptes utilisateurs ne sont pas touchés.
--
-- Sources : fiches de taxation FCE (tarifs par zone, poids des colis),
-- tableau 5 (16 gares) et tableau 6 (arrêts).
-- Factures : du 1er juin au 31 octobre 2026, calculées avec les mêmes règles
-- que l'application (minimum 20 kg en Express, wagon complet, TVA 20 %,
-- piquire 1 000 Ar, TTC arrondi à la centaine supérieure).
--
-- Comptes de test (mot de passe pour tous : Motdepasse1)
--   taxateur@taxe.mg    Taxateur         actif
--   directeur@taxe.mg   Directeur        actif
--   chef@taxe.mg        Chef de division en attente
-- Comptes réels :
--   ttnmiora@gmail.com           / miora123    Taxateur          actif
--   hasimiora.randira@gmail.com  / Hasina2026  Chef de division  actif (mot de passe provisoire)
-- Le compte ADMIN se crée avec "npm run creer-admin" (voir GUIDE.md).
-- =====================================================================

-- ----- 0) On vide les tables (sauf usertable) -----
TRUNCATE public.detailfacture, public.facturemarchandise, public.facturefuneraire,
         public.compteur_facture, public.compteur_facture_funeraire,
         public.tarifmarchandise, public.tariffuneraire, public.marchandise, public.typemarchandise,
         public.wagon, public.typewagon, public.destination, public.zonedestination, public.client
RESTART IDENTITY;

-- ----- 1) Zones : FIA à ADV, MDR à ION, MBK à MZL, AMB à MNK -----
INSERT INTO public.zonedestination (idzone, libellezone, kilometrage) VALUES
  ('ZN01', 'Zone 1', 45),
  ('ZN02', 'Zone 2', 88),
  ('ZN03', 'Zone 3', 137),
  ('ZN04', 'Zone 4', 163);

-- ----- 2) Destinations : les 16 gares (tableau 5) et les arrêts (tableau 6) -----
-- Ambila : point kilométrique absent du tableau 5 (laissé vide)
INSERT INTO public.destination (iddestination, nomdestination, typedestination, codegare, pointkilometrique, idzone) VALUES
  ('DST01', 'Fianarantsoa', 'Gare', '480', 0, 'ZN01'),
  ('DST02', 'Vohimasina', 'Gare', '481', 9, 'ZN01'),
  ('DST03', 'Sahambavy', 'Gare', '482', 21, 'ZN01'),
  ('DST04', 'Ampitabe', 'Gare', '483', 28, 'ZN01'),
  ('DST05', 'Ambida', 'Simple arrêt', NULL, 33, 'ZN01'),
  ('DST06', 'Ranomena', 'Gare', '484', 38, 'ZN01'),
  ('DST07', 'Andrambovato', 'Gare', '485', 45, 'ZN01'),
  ('DST08', 'Madiorano', 'Gare', '486', 54, 'ZN02'),
  ('DST09', 'Tolongoina', 'Gare', '487', 62, 'ZN02'),
  ('DST10', 'Volohosy', 'Simple arrêt', NULL, 67, 'ZN02'),
  ('DST11', 'Amboanjobe', 'Gare', '488', 72, 'ZN02'),
  ('DST12', 'Manapatrana', 'Gare', '489', 79, 'ZN02'),
  ('DST13', 'Ionilahy', 'Gare', '490', 88, 'ZN02'),
  ('DST14', 'Ambinanindrano', 'Simple arrêt', NULL, 91, 'ZN03'),
  ('DST15', 'Mahakobo', 'Gare', '491', 99, 'ZN03'),
  ('DST16', 'Fenomby', 'Gare', '492', 107, 'ZN03'),
  ('DST17', 'Sahasinaka', 'Gare', '493', 116, 'ZN03'),
  ('DST18', 'Antsaka', 'Simple arrêt', NULL, 128, 'ZN03'),
  ('DST19', 'Marofarihy', 'Simple arrêt', NULL, 132, 'ZN03'),
  ('DST20', 'Mizilo', 'Gare', '495', 137, 'ZN03'),
  ('DST21', 'Ambila', 'Gare', '496', NULL, 'ZN04'),
  ('DST22', 'Manakara', 'Gare', '497', 163, 'ZN04');

-- ----- 3) Types de wagon -----
INSERT INTO public.typewagon (idtypewagon, libelletypewagon, modefacturation, poidsfacturation) VALUES
  ('TRN01', 'Express', false, 0),
  ('TRN02', 'Série 100', true, 15000),
  ('TRN03', 'Série 400', true, 20000);

-- ----- 4) Wagons (numéros relevés sur la fiche manuscrite) -----
INSERT INTO public.wagon (idwagon, libellewagon, idtypewagon) VALUES
  (1, 'KB15006', 'TRN01'),
  (2, 'DKP30413', 'TRN01'),
  (3, 'K30122', 'TRN02'),
  (4, 'K30124', 'TRN02'),
  (5, 'K405', 'TRN03'),
  (6, 'K409', 'TRN03'),
  (7, 'K410', 'TRN03'),
  (8, 'K414', 'TRN03'),
  (9, 'K420', 'TRN03');

-- ----- 5) Types de marchandise -----
INSERT INTO public.typemarchandise (idtypemarchandise, libelletype, soumistva) VALUES
  ('TP01', 'PPN', true),
  ('TP02', 'Divers', true),
  ('TP03', 'Carburant avec TVA', true),
  ('TP04', 'Carburant sans TVA', false),
  ('TP05', 'Encombrant', true);

-- ----- 6) Marchandises (poids d'un colis en kg, d'après les fiches de poids) -----
-- Carburants sans TVA : poids estimés (absents des fiches)
INSERT INTO public.marchandise (idmarchandise, designation, poidscolis, idtypemarchandise) VALUES
  (1, 'Sac de riz blanc 50 kg', 50, 'TP01'),
  (2, 'Sac de riz blanc 60 kg', 60, 'TP01'),
  (3, 'Sac de sucre', 50, 'TP01'),
  (4, 'Sac de sel 50 kg', 50, 'TP01'),
  (5, 'Sac de sel 60 kg', 60, 'TP01'),
  (6, 'Sac de sel fin', 20, 'TP01'),
  (7, 'Sac de farine', 50, 'TP01'),
  (8, 'Carton spaghetti', 10, 'TP01'),
  (9, 'Sachet spaghetti', 5, 'TP01'),
  (10, 'Carton macaroni', 10, 'TP01'),
  (11, 'Sachet macaroni', 6, 'TP01'),
  (12, 'Balle macaroni', 10, 'TP01'),
  (13, 'Carton pâtes nouilles', 3, 'TP01'),
  (14, 'Carton Jumbo GM', 10, 'TP01'),
  (15, 'Carton Jumbo PM', 5, 'TP01'),
  (16, 'Bidon d''huile', 20, 'TP01'),
  (17, 'Bidon d''huile coco', 5, 'TP01'),
  (18, 'Carton huile GM', 12, 'TP01'),
  (19, 'Carton huile PM', 6, 'TP01'),
  (20, 'Carton savon', 6, 'TP01'),
  (21, 'Sachet savon', 2, 'TP01'),
  (22, 'Sac de carbonate', 25, 'TP01'),
  (23, 'Sac pecto (bonbon)', 8, 'TP01'),
  (24, 'Carton vovotsavony', 5, 'TP01'),
  (25, 'Sac zezika (engrais)', 50, 'TP02'),
  (26, 'Carton sigara', 12, 'TP02'),
  (27, 'Carton pointe (fantsika)', 20, 'TP02'),
  (28, 'Carton pile GM', 24, 'TP02'),
  (29, 'Carton pile PM', 9, 'TP02'),
  (30, 'Paquet jus GM', 9, 'TP02'),
  (31, 'Paquet jus PM', 6, 'TP02'),
  (32, 'Cageot THB GM', 25, 'TP02'),
  (33, 'Cageot THB PM', 20, 'TP02'),
  (34, 'Carton THB canette', 12, 'TP02'),
  (35, 'Cageot jus GM', 25, 'TP02'),
  (36, 'Cageot jus PM', 20, 'TP02'),
  (37, 'Paquet eau vive', 5, 'TP02'),
  (38, 'Paquet Cristalline', 8, 'TP02'),
  (39, 'Paquet XXL', 5, 'TP02'),
  (40, 'Carton rhum', 12, 'TP02'),
  (41, 'Carton klin', 5, 'TP02'),
  (42, 'Tôle 2 m (0,20)', 3, 'TP02'),
  (43, 'Tôle 2,5 m (0,25)', 4.4, 'TP02'),
  (44, 'Tôle 3 m (0,40)', 8, 'TP02'),
  (45, 'Fer Ø6', 3.5, 'TP02'),
  (46, 'Fer Ø8', 4.5, 'TP02'),
  (47, 'Fer Ø10', 5.5, 'TP02'),
  (48, 'Fer Ø12', 6, 'TP02'),
  (49, 'Bicyclette GM', 20, 'TP05'),
  (50, 'Bicyclette PM', 10, 'TP05'),
  (51, 'Moto', 150, 'TP05'),
  (52, 'Salon complet', 150, 'TP05'),
  (53, 'Matelas éponge 1 place (12 à 14 cm)', 60, 'TP05'),
  (54, 'Matelas éponge 2 places (12 à 14 cm)', 100, 'TP05'),
  (55, 'Fût vide', 20, 'TP03'),
  (56, 'Bidon d''essence 20 L', 15, 'TP04'),
  (57, 'Bidon de gasoil 20 L', 17, 'TP04'),
  (58, 'Bidon de pétrole 20 L', 16, 'TP04'),
  (59, 'Bouteille de gaz', 25, 'TP04'),
  (60, 'Bidon d''huile de vidange 20 L', 18, 'TP04');

-- ----- 7) Tarifs des marchandises (prix au kg, hors TVA) -----
-- Express : PPN 125 / 166,67 / 166,67 / 166,67 ; Divers 125 / 250 / 375 / 500
--           Encombrant (Divers + 25 %) 156,25 / 312,5 / 468,75 / 625
--           Carburant (+ 50 %) 187,5 / 375 / 562,5 / 750
-- Wagon complet (série 100 et 400) : PPN 100 / 125 / 125 / 125 ; Divers 100 / 200 / 300 / 400
INSERT INTO public.tarifmarchandise (idtarifmarchandise, idzone, idtypemarchandise, idtypewagon, prixkg) VALUES
  ('TRF01', 'ZN01', 'TP01', 'TRN01', 125),
  ('TRF02', 'ZN01', 'TP02', 'TRN01', 125),
  ('TRF03', 'ZN01', 'TP03', 'TRN01', 187.5),
  ('TRF04', 'ZN01', 'TP04', 'TRN01', 187.5),
  ('TRF05', 'ZN01', 'TP05', 'TRN01', 156.25),
  ('TRF06', 'ZN01', 'TP01', 'TRN02', 100),
  ('TRF07', 'ZN01', 'TP02', 'TRN02', 100),
  ('TRF08', 'ZN01', 'TP01', 'TRN03', 100),
  ('TRF09', 'ZN01', 'TP02', 'TRN03', 100),
  ('TRF10', 'ZN02', 'TP01', 'TRN01', 166.67),
  ('TRF11', 'ZN02', 'TP02', 'TRN01', 250),
  ('TRF12', 'ZN02', 'TP03', 'TRN01', 375),
  ('TRF13', 'ZN02', 'TP04', 'TRN01', 375),
  ('TRF14', 'ZN02', 'TP05', 'TRN01', 312.5),
  ('TRF15', 'ZN02', 'TP01', 'TRN02', 125),
  ('TRF16', 'ZN02', 'TP02', 'TRN02', 200),
  ('TRF17', 'ZN02', 'TP01', 'TRN03', 125),
  ('TRF18', 'ZN02', 'TP02', 'TRN03', 200),
  ('TRF19', 'ZN03', 'TP01', 'TRN01', 166.67),
  ('TRF20', 'ZN03', 'TP02', 'TRN01', 375),
  ('TRF21', 'ZN03', 'TP03', 'TRN01', 562.5),
  ('TRF22', 'ZN03', 'TP04', 'TRN01', 562.5),
  ('TRF23', 'ZN03', 'TP05', 'TRN01', 468.75),
  ('TRF24', 'ZN03', 'TP01', 'TRN02', 125),
  ('TRF25', 'ZN03', 'TP02', 'TRN02', 300),
  ('TRF26', 'ZN03', 'TP01', 'TRN03', 125),
  ('TRF27', 'ZN03', 'TP02', 'TRN03', 300),
  ('TRF28', 'ZN04', 'TP01', 'TRN01', 166.67),
  ('TRF29', 'ZN04', 'TP02', 'TRN01', 500),
  ('TRF30', 'ZN04', 'TP03', 'TRN01', 750),
  ('TRF31', 'ZN04', 'TP04', 'TRN01', 750),
  ('TRF32', 'ZN04', 'TP05', 'TRN01', 625),
  ('TRF33', 'ZN04', 'TP01', 'TRN02', 125),
  ('TRF34', 'ZN04', 'TP02', 'TRN02', 400),
  ('TRF35', 'ZN04', 'TP01', 'TRN03', 125),
  ('TRF36', 'ZN04', 'TP02', 'TRN03', 400);

-- ----- 8) Tarifs funéraires : 7267 x tarif de la zone (PPN) + piquire -----
INSERT INTO public.tariffuneraire (idtariffuneraire, idzone, prixfixe, prixzone) VALUES
  ('TF01', 'ZN01', 7267, 125),
  ('TF02', 'ZN02', 7267, 166.67),
  ('TF03', 'ZN03', 7267, 166.67),
  ('TF04', 'ZN04', 7267, 166.67);

-- ----- 9) Clients (fictifs) -----
INSERT INTO public.client (idclient, nomclient, sigle, cin, telephone, adresse, email) VALUES
  ('CLT01', 'Rakotonirina Hery', NULL, '201011045872', '+261341122334', 'Tsianolondroa, Fianarantsoa', 'hery.rakotonirina@gmail.com'),
  ('CLT02', 'Société Vatovavy Distribution', 'SVD', NULL, '+261320455678', 'Tanambao, Manakara', 'contact@svd.mg'),
  ('CLT03', 'Épicerie Fanomezantsoa', 'EFA', NULL, '0344567812', 'Gare, Sahasinaka', NULL),
  ('CLT04', 'Quincaillerie Mirindra', 'QMI', NULL, '+261331234509', 'Ampasambazaha, Fianarantsoa', 'qmirindra@yahoo.fr'),
  ('CLT05', 'Grossiste Tsiry', 'GTS', NULL, '0349876543', 'Bazary, Tolongoina', NULL),
  ('CLT06', 'Coopérative Mahasoa', 'COMA', NULL, '+261342233445', 'Ionilahy', 'coop.mahasoa@gmail.com'),
  ('CLT07', 'Razafindrakoto Lalao', NULL, '201032118764', '0321199887', 'Ranomena', NULL),
  ('CLT08', 'Randrianarisoa Tojo', NULL, '512011034567', '+261345566778', 'Mangarivotra, Manakara', 'tojo.randria@gmail.com'),
  ('CLT09', 'Andrianjafy Voahangy', NULL, '201052223341', '0337788990', 'Antarandolo, Fianarantsoa', NULL),
  ('CLT10', 'Rasolofonirina Fidy', NULL, '512031076512', '0346677889', 'Mahakobo', NULL),
  ('CLT11', 'Ets Ravao et Fils', 'ERF', NULL, '+261329988776', 'Fenomby', 'ets.ravao@gmail.com'),
  ('CLT12', 'Rabemananjara Nirina', NULL, '201071099123', '0381234567', 'Madiorano', NULL),
  ('CLT13', 'Ralaiarisoa Bako', NULL, '201012230987', '0342345678', 'Manapatrana', NULL),
  ('CLT14', 'Société Agri-Fianar', 'SAF', NULL, '+261324455667', 'Andrainjato, Fianarantsoa', 'agrifianar@gmail.com'),
  ('CLT15', 'Ratsimbazafy Haja', NULL, '512052012345', '0335544332', 'Mizilo', NULL),
  ('CLT16', 'Rakotomalala Fanja', NULL, '201092087654', '0347788112', 'Ambalavao, Fianarantsoa', NULL),
  ('CLT17', 'Randriamampionona Solo', NULL, '512071023456', '0326655443', 'Ambalakininy, Manakara', NULL),
  ('CLT18', 'Razanamparany Odile', NULL, '201043156789', '0349911223', 'Vohimasina', NULL);

-- ----- 10) Utilisateurs (mot de passe : Motdepasse1, haché avec bcrypt) -----
-- (sans iduser : la base donne USER01, USER02 ... à la suite du compte admin)
INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut) VALUES
  ('Miora',      'taxateur',         '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'taxateur@taxe.mg',  'actif'),
  ('Rabe',       'directeur',        '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'directeur@taxe.mg', 'actif'),
  ('Hery',       'chef de division', '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'chef@taxe.mg',      'en attente')
ON CONFLICT (emailutilisateur) DO NOTHING;

-- Comptes réels ajoutés (mots de passe chiffrés avec bcrypt) :
--   Miora  : ttnmiora@gmail.com            / miora123    (Taxateur)
--   Hasina : hasimiora.randira@gmail.com   / Hasina2026  (Chef de division, mot de passe provisoire)
INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut) VALUES
  ('Miora',      'taxateur',         '$2b$10$XsVdTsVnn/A.k09sc3/a6.DX9oALspfgP4FIIXBP1GMT48kwb/MoS', 'ttnmiora@gmail.com',          'actif'),
  ('Hasina',     'chef de division', '$2b$10$5vJCV32M5YVjM4POwI5JHuIhdfRBGUNAH1Au0Mmo1irvx3TM2pXFm', 'hasimiora.randira@gmail.com', 'actif')
ON CONFLICT (emailutilisateur) DO NOTHING;

-- ----- 11) Mise à jour des compteurs des identifiants -----
SELECT setval('public.zone_seq',           (SELECT MAX(SUBSTRING(idzone FROM 3)::INT) FROM public.zonedestination));
SELECT setval('public.destination_id_seq', (SELECT MAX(SUBSTRING(iddestination FROM 4)::INT) FROM public.destination));
SELECT setval('public.typetrain_seq',      (SELECT MAX(SUBSTRING(idtypewagon FROM 4)::INT) FROM public.typewagon));
SELECT setval('public.train_idtrain_seq',  (SELECT MAX(idwagon) FROM public.wagon));
SELECT setval('public.typemarchandise_seq',(SELECT MAX(SUBSTRING(idtypemarchandise FROM 3)::INT) FROM public.typemarchandise));
SELECT setval('public.marchandise_idmarchandise_seq', (SELECT MAX(idmarchandise) FROM public.marchandise));
SELECT setval('public.tarif_id_seq',       (SELECT MAX(SUBSTRING(idtarifmarchandise FROM 4)::INT) FROM public.tarifmarchandise));
SELECT setval('public.tariffuneraire_seq', (SELECT MAX(SUBSTRING(idtariffuneraire FROM 3)::INT) FROM public.tariffuneraire) + 1, false);
SELECT setval('public.client_seq',         (SELECT MAX(SUBSTRING(idclient FROM 4)::INT) FROM public.client));

-- =====================================================================
-- 12) FACTURES MARCHANDISE (Express et wagon complet) : 116 factures
-- Le numéro (001/02-06-2026 ...) est créé par le trigger, dans l'ordre des dates.
-- Chaque bloc : la facture, puis ses lignes (avec l'id renvoyé par RETURNING).
-- Wagon complet : la 1re ligne (sans marchandise) est le wagon taxé en PPN ou Divers.
-- =====================================================================
-- 2026-06-02 | Express avec TVA | Fianarantsoa
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-02', 13, 140, 140, 1000, 3500, 17500, 22000, 'CLT07', 'DST01', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (8, 40::real, 40::real, 125::float8, 5000::float8, 'TRF02', 37::int, NULL::int),
  (5, 100::real, 100::real, 125::float8, 12500::float8, 'TRF02', 36::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-03 | Express sans TVA | Amboanjobe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-03', 24, 465, 465, 1000, 0, 174375, 175400, 'CLT04', 'DST11', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (9, 225::real, 225::real, 375::float8, 84375::float8, 'TRF13', 59::int, NULL::int),
  (15, 240::real, 240::real, 375::float8, 90000::float8, 'TRF13', 58::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-05 | Express avec TVA | Manapatrana
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-05', 12, 99, 99, 1000, 3450.06, 17250.3, 21700, 'CLT16', 'DST12', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 30::real, 30::real, 166.67::float8, 5000.1::float8, 'TRF10', 19::int, NULL::int),
  (1, 9::real, 9::real, 250::float8, 2250::float8, 'TRF11', 30::int, NULL::int),
  (6, 60::real, 60::real, 166.67::float8, 10000.2::float8, 'TRF10', 10::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-05 | Express avec TVA | Fianarantsoa
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-05', 162, 1262, 1262, 1000, 31550, 157750, 190300, 'CLT05', 'DST01', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (38, 304::real, 304::real, 125::float8, 38000::float8, 'TRF02', 38::int, NULL::int),
  (21, 105::real, 105::real, 125::float8, 13125::float8, 'TRF02', 41::int, NULL::int),
  (31, 248::real, 248::real, 125::float8, 31000::float8, 'TRF02', 44::int, NULL::int),
  (35, 420::real, 420::real, 125::float8, 52500::float8, 'TRF02', 40::int, NULL::int),
  (37, 185::real, 185::real, 125::float8, 23125::float8, 'TRF02', 37::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-06 | Express sans TVA | Amboanjobe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-06', 58, 1083, 1083, 1000, 0, 406125, 407200, 'CLT03', 'DST11', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (7, 126::real, 126::real, 375::float8, 47250::float8, 'TRF13', 60::int, NULL::int),
  (18, 270::real, 270::real, 375::float8, 101250::float8, 'TRF13', 56::int, NULL::int),
  (10, 160::real, 160::real, 375::float8, 60000::float8, 'TRF13', 58::int, NULL::int),
  (6, 102::real, 102::real, 375::float8, 38250::float8, 'TRF13', 57::int, NULL::int),
  (17, 425::real, 425::real, 375::float8, 159375::float8, 'TRF13', 59::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-08 | Express avec TVA | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-08', 22, 107, 107, 1000, 3566.74, 17833.69, 22400, 'CLT16', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (8, 16::real, 16::real, 166.67::float8, 2666.72::float8, 'TRF10', 21::int, NULL::int),
  (7, 35::real, 35::real, 166.67::float8, 5833.45::float8, 'TRF10', 17::int, NULL::int),
  (7, 56::real, 56::real, 166.67::float8, 9333.52::float8, 'TRF10', 23::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-08 | TRN03 | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-08', 146, 8180, 20000, 1000, 500000, 2500000, 3001000, 'CLT06', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (146, 8180::real, 20000::real, 125::float8, 2500000::float8, 'TRF17', NULL::int, 8::int),
  (88, 5280::real, 20000::real, 0::float8, 0::float8, 'TRF17', 2::int, 8::int),
  (58, 2900::real, 20000::real, 0::float8, 0::float8, 'TRF17', 7::int, 8::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-10 | Express sans TVA | Ambinanindrano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-10', 72, 1313, 1313, 1000, 0, 738562.5, 739600, 'CLT06', 'DST14', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (18, 450::real, 450::real, 562.5::float8, 253125::float8, 'TRF22', 59::int, NULL::int),
  (17, 272::real, 272::real, 562.5::float8, 153000::float8, 'TRF22', 58::int, NULL::int),
  (19, 285::real, 285::real, 562.5::float8, 160312.5::float8, 'TRF22', 56::int, NULL::int),
  (18, 306::real, 306::real, 562.5::float8, 172125::float8, 'TRF22', 57::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-10 | Express avec TVA | Vohimasina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-10', 5, 40, 40, 1000, 1000, 5000, 7000, 'CLT01', 'DST02', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 40::real, 40::real, 125::float8, 5000::float8, 'TRF01', 23::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-11 | Express avec TVA | Volohosy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-11', 10, 60, 60, 1000, 3000, 15000, 19000, 'CLT15', 'DST10', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (7, 42::real, 42::real, 250::float8, 10500::float8, 'TRF11', 31::int, NULL::int),
  (3, 18::real, 18::real, 250::float8, 4500::float8, 'TRF11', 48::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-12 | Express sans TVA | Mahakobo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-12', 55, 944, 944, 1000, 0, 531000, 532000, 'CLT06', 'DST15', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (20, 360::real, 360::real, 562.5::float8, 202500::float8, 'TRF22', 60::int, NULL::int),
  (11, 187::real, 187::real, 562.5::float8, 105187.5::float8, 'TRF22', 57::int, NULL::int),
  (14, 210::real, 210::real, 562.5::float8, 118125::float8, 'TRF22', 56::int, NULL::int),
  (7, 112::real, 112::real, 562.5::float8, 63000::float8, 'TRF22', 58::int, NULL::int),
  (3, 75::real, 75::real, 562.5::float8, 42187.5::float8, 'TRF22', 59::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-13 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-13', 6, 110, 110, 1000, 3437.5, 17187.5, 21700, 'CLT15', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 50::real, 50::real, 156.25::float8, 7812.5::float8, 'TRF05', 50::int, NULL::int),
  (1, 60::real, 60::real, 156.25::float8, 9375::float8, 'TRF05', 53::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-15 | Express avec TVA | Ambida
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-15', 34, 445, 445, 1000, 11125, 55625, 67800, 'CLT14', 'DST05', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 300::real, 300::real, 125::float8, 37500::float8, 'TRF01', 5::int, NULL::int),
  (29, 145::real, 145::real, 125::float8, 18125::float8, 'TRF01', 17::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-18 | Express sans TVA | Volohosy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-18', 62, 1067, 1067, 1000, 0, 400125, 401200, 'CLT04', 'DST10', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (13, 195::real, 195::real, 375::float8, 73125::float8, 'TRF13', 56::int, NULL::int),
  (6, 150::real, 150::real, 375::float8, 56250::float8, 'TRF13', 59::int, NULL::int),
  (18, 306::real, 306::real, 375::float8, 114750::float8, 'TRF13', 57::int, NULL::int),
  (17, 272::real, 272::real, 375::float8, 102000::float8, 'TRF13', 58::int, NULL::int),
  (8, 144::real, 144::real, 375::float8, 54000::float8, 'TRF13', 60::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-18 | Express avec TVA | Manapatrana
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-18', 13, 74, 74, 1000, 3700, 18500, 23200, 'CLT13', 'DST12', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 9::real, 9::real, 250::float8, 2250::float8, 'TRF11', 42::int, NULL::int),
  (1, 5::real, 5::real, 250::float8, 1250::float8, 'TRF11', 37::int, NULL::int),
  (1, 12::real, 12::real, 250::float8, 3000::float8, 'TRF11', 26::int, NULL::int),
  (8, 48::real, 48::real, 250::float8, 12000::float8, 'TRF11', 31::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-19 | Express avec TVA | Fianarantsoa
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-19', 14, 415, 415, 1000, 10375, 51875, 63300, 'CLT18', 'DST01', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 15::real, 15::real, 125::float8, 1875::float8, 'TRF01', 17::int, NULL::int),
  (4, 240::real, 240::real, 125::float8, 30000::float8, 'TRF01', 5::int, NULL::int),
  (3, 60::real, 60::real, 125::float8, 7500::float8, 'TRF01', 6::int, NULL::int),
  (4, 100::real, 100::real, 125::float8, 12500::float8, 'TRF01', 22::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-19 | Express avec TVA | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-19', 17, 130, 130, 1000, 4333.42, 21667.1, 27100, 'CLT13', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 30::real, 30::real, 166.67::float8, 5000.1::float8, 'TRF10', 14::int, NULL::int),
  (6, 60::real, 60::real, 166.67::float8, 10000.2::float8, 'TRF10', 10::int, NULL::int),
  (8, 40::real, 40::real, 166.67::float8, 6666.8::float8, 'TRF10', 15::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-20 | Express avec TVA | Amboanjobe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-20', 16, 237.6, 237.6, 1000, 10630.05, 53150.25, 64800, 'CLT10', 'DST11', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 27::real, 27::real, 250::float8, 6750::float8, 'TRF11', 30::int, NULL::int),
  (1, 3::real, 3::real, 250::float8, 750::float8, 'TRF11', 42::int, NULL::int),
  (3, 75::real, 75::real, 166.67::float8, 12500.25::float8, 'TRF10', 22::int, NULL::int),
  (2, 40::real, 40::real, 250::float8, 10000::float8, 'TRF11', 27::int, NULL::int),
  (3, 75::real, 75::real, 250::float8, 18750::float8, 'TRF11', 35::int, NULL::int),
  (4, 17.6::real, 17.6::real, 250::float8, 4400::float8, 'TRF11', 43::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-23 | Express avec TVA | Andrambovato
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-23', 1, 20, 20, 1000, 500, 2500, 4000, 'CLT09', 'DST07', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 20::real, 20::real, 125::float8, 2500::float8, 'TRF02', 33::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-24 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-24', 13, 161, 161, 1000, 4025, 20125, 25200, 'CLT12', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 25::real, 25::real, 125::float8, 3125::float8, 'TRF01', 9::int, NULL::int),
  (6, 36::real, 36::real, 125::float8, 4500::float8, 'TRF01', 19::int, NULL::int),
  (2, 100::real, 100::real, 125::float8, 12500::float8, 'TRF01', 3::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-24 | Express avec TVA | Fianarantsoa
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-24', 8, 400, 400, 1000, 10000, 50000, 61000, 'CLT05', 'DST01', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 150::real, 150::real, 125::float8, 18750::float8, 'TRF01', 1::int, NULL::int),
  (5, 250::real, 250::real, 125::float8, 31250::float8, 'TRF01', 4::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-24 | TRN03 | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-24', 992, 12438, 20000, 1000, 1600000, 8000000, 9601000, 'CLT06', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (992, 12438::real, 20000::real, 400::float8, 8000000::float8, 'TRF36', NULL::int, 5::int),
  (717, 8604::real, 20000::real, 0::float8, 0::float8, 'TRF36', 40::int, 5::int),
  (149, 2980::real, 20000::real, 0::float8, 0::float8, 'TRF36', 36::int, 5::int),
  (56, 504::real, 20000::real, 0::float8, 0::float8, 'TRF36', 30::int, 5::int),
  (70, 350::real, 20000::real, 0::float8, 0::float8, 'TRF36', 37::int, 5::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-29 | Express avec TVA | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-29', 18, 204, 204, 1000, 10200, 51000, 62200, 'CLT12', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (4, 48::real, 48::real, 250::float8, 12000::float8, 'TRF11', 26::int, NULL::int),
  (8, 40::real, 40::real, 250::float8, 10000::float8, 'TRF11', 37::int, NULL::int),
  (4, 100::real, 100::real, 250::float8, 25000::float8, 'TRF11', 35::int, NULL::int),
  (2, 16::real, 16::real, 250::float8, 4000::float8, 'TRF11', 44::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-06-30 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-06-30', 8, 710, 710, 1000, 44375, 221875, 267300, 'CLT10', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 300::real, 300::real, 312.5::float8, 93750::float8, 'TRF14', 52::int, NULL::int),
  (3, 60::real, 60::real, 312.5::float8, 18750::float8, 'TRF14', 49::int, NULL::int),
  (1, 150::real, 150::real, 312.5::float8, 46875::float8, 'TRF14', 51::int, NULL::int),
  (2, 200::real, 200::real, 312.5::float8, 62500::float8, 'TRF14', 54::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-01 | Express avec TVA | Ambinanindrano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-01', 1, 5, 20, 1000, 666.68, 3333.4, 5000, 'CLT16', 'DST14', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 5::real, 5::real, 166.67::float8, 833.35::float8, 'TRF19', 9::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-02 | Express avec TVA | Andrambovato
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-02', 8, 570, 570, 1000, 17812.5, 89062.5, 107900, 'CLT04', 'DST07', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 150::real, 150::real, 156.25::float8, 23437.5::float8, 'TRF05', 52::int, NULL::int),
  (7, 420::real, 420::real, 156.25::float8, 65625::float8, 'TRF05', 53::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-03 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-03', 11, 122, 122, 1000, 4066.75, 20333.74, 25400, 'CLT18', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 60::real, 60::real, 166.67::float8, 10000.2::float8, 'TRF19', 18::int, NULL::int),
  (2, 50::real, 50::real, 166.67::float8, 8333.5::float8, 'TRF19', 22::int, NULL::int),
  (4, 12::real, 12::real, 166.67::float8, 2000.04::float8, 'TRF19', 13::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-07 | Express avec TVA | Andrambovato
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-07', 70, 583, 583, 1000, 14575, 72875, 88500, 'CLT11', 'DST07', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (26, 78::real, 78::real, 125::float8, 9750::float8, 'TRF02', 42::int, NULL::int),
  (19, 380::real, 380::real, 125::float8, 47500::float8, 'TRF02', 33::int, NULL::int),
  (25, 125::real, 125::real, 125::float8, 15625::float8, 'TRF01', 17::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-09 | Express avec TVA | Antsaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-09', 133, 846, 846, 1000, 54075.15, 270375.75, 325500, 'CLT02', 'DST18', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (40, 240::real, 240::real, 375::float8, 90000::float8, 'TRF20', 48::int, NULL::int),
  (22, 264::real, 264::real, 375::float8, 99000::float8, 'TRF20', 26::int, NULL::int),
  (26, 117::real, 117::real, 375::float8, 43875::float8, 'TRF20', 46::int, NULL::int),
  (17, 85::real, 85::real, 166.67::float8, 14166.95::float8, 'TRF19', 24::int, NULL::int),
  (28, 140::real, 140::real, 166.67::float8, 23333.8::float8, 'TRF19', 15::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-09 | Express avec TVA | Amboanjobe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-09', 10, 57, 57, 1000, 2150.03, 10750.14, 13900, 'CLT16', 'DST11', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (7, 42::real, 42::real, 166.67::float8, 7000.14::float8, 'TRF10', 11::int, NULL::int),
  (3, 15::real, 15::real, 250::float8, 3750::float8, 'TRF11', 41::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-10 | Express sans TVA | Mahakobo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-10', 17, 279, 279, 1000, 0, 156937.5, 158000, 'CLT14', 'DST15', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 75::real, 75::real, 562.5::float8, 42187.5::float8, 'TRF22', 56::int, NULL::int),
  (12, 204::real, 204::real, 562.5::float8, 114750::float8, 'TRF22', 57::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-11 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-11', 66, 438.5, 438.5, 1000, 32250.12, 161250.58, 194600, 'CLT11', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (7, 24.5::real, 24.5::real, 500::float8, 12250::float8, 'TRF29', 45::int, NULL::int),
  (30, 240::real, 240::real, 500::float8, 120000::float8, 'TRF29', 38::int, NULL::int),
  (29, 174::real, 174::real, 166.67::float8, 29000.58::float8, 'TRF28', 20::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-13 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-13', 12, 137, 137, 1000, 10275, 51375, 62700, 'CLT18', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 25::real, 25::real, 375::float8, 9375::float8, 'TRF20', 35::int, NULL::int),
  (4, 12::real, 12::real, 375::float8, 4500::float8, 'TRF20', 42::int, NULL::int),
  (2, 40::real, 40::real, 375::float8, 15000::float8, 'TRF20', 33::int, NULL::int),
  (5, 60::real, 60::real, 375::float8, 22500::float8, 'TRF20', 34::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-17 | Express avec TVA | Madiorano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-17', 9, 400, 400, 1000, 25000, 125000, 151000, 'CLT17', 'DST08', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 180::real, 180::real, 312.5::float8, 56250::float8, 'TRF14', 53::int, NULL::int),
  (3, 30::real, 30::real, 312.5::float8, 9375::float8, 'TRF14', 50::int, NULL::int),
  (2, 40::real, 40::real, 312.5::float8, 12500::float8, 'TRF14', 49::int, NULL::int),
  (1, 150::real, 150::real, 312.5::float8, 46875::float8, 'TRF14', 52::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-18 | Express avec TVA | Ambila
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-18', 1, 6, 20, 1000, 666.68, 3333.4, 5000, 'CLT18', 'DST21', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 6::real, 6::real, 166.67::float8, 1000.02::float8, 'TRF28', 19::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-18 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-18', 15, 690, 690, 1000, 86250, 431250, 518500, 'CLT09', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 100::real, 100::real, 625::float8, 62500::float8, 'TRF32', 54::int, NULL::int),
  (3, 60::real, 60::real, 625::float8, 37500::float8, 'TRF32', 49::int, NULL::int),
  (2, 300::real, 300::real, 625::float8, 187500::float8, 'TRF32', 52::int, NULL::int),
  (8, 80::real, 80::real, 625::float8, 50000::float8, 'TRF32', 50::int, NULL::int),
  (1, 150::real, 150::real, 625::float8, 93750::float8, 'TRF32', 51::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-20 | Express avec TVA | Fenomby
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-20', 18, 360, 360, 1000, 27000, 135000, 163000, 'CLT14', 'DST16', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (18, 360::real, 360::real, 375::float8, 135000::float8, 'TRF20', 27::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-21 | Express avec TVA | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-21', 22, 227, 227, 1000, 11350, 56750, 69100, 'CLT08', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 18::real, 18::real, 250::float8, 4500::float8, 'TRF11', 48::int, NULL::int),
  (4, 18::real, 18::real, 250::float8, 4500::float8, 'TRF11', 46::int, NULL::int),
  (8, 96::real, 96::real, 250::float8, 24000::float8, 'TRF11', 40::int, NULL::int),
  (4, 20::real, 20::real, 250::float8, 5000::float8, 'TRF11', 37::int, NULL::int),
  (3, 75::real, 75::real, 250::float8, 18750::float8, 'TRF11', 35::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-21 | TRN02 | Ampitabe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-21', 548, 6498, 15000, 1000, 300000, 1500000, 1801000, 'CLT04', 'DST04', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (548, 6498::real, 15000::real, 100::float8, 1500000::float8, 'TRF07', NULL::int, 4::int),
  (409, 4908::real, 15000::real, 0::float8, 0::float8, 'TRF07', 26::int, 4::int),
  (54, 1080::real, 15000::real, 0::float8, 0::float8, 'TRF07', 33::int, 4::int),
  (85, 510::real, 15000::real, 0::float8, 0::float8, 'TRF07', 48::int, 4::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-22 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-22', 11, 230, 230, 1000, 7666.82, 38334.1, 47100, 'CLT17', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 180::real, 180::real, 166.67::float8, 30000.6::float8, 'TRF10', 5::int, NULL::int),
  (2, 20::real, 20::real, 166.67::float8, 3333.4::float8, 'TRF10', 14::int, NULL::int),
  (6, 30::real, 30::real, 166.67::float8, 5000.1::float8, 'TRF10', 9::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-23 | TRN03 | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-23', 279, 7940, 20000, 1000, 500000, 2500000, 3001000, 'CLT05', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (279, 7940::real, 20000::real, 125::float8, 2500000::float8, 'TRF26', NULL::int, 7::int),
  (220, 4400::real, 20000::real, 0::float8, 0::float8, 'TRF26', 16::int, 7::int),
  (59, 3540::real, 20000::real, 0::float8, 0::float8, 'TRF26', 5::int, 7::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-24 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-24', 2, 300, 300, 1000, 28125, 140625, 169800, 'CLT10', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 300::real, 300::real, 468.75::float8, 140625::float8, 'TRF23', 51::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-24 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-24', 58, 787, 787, 1000, 19675, 98375, 119100, 'CLT06', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (39, 312::real, 312::real, 125::float8, 39000::float8, 'TRF02', 44::int, NULL::int),
  (19, 475::real, 475::real, 125::float8, 59375::float8, 'TRF02', 32::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-27 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-27', 15, 88.5, 88.5, 1000, 8850, 44250, 54100, 'CLT08', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (7, 24.5::real, 24.5::real, 500::float8, 12250::float8, 'TRF29', 45::int, NULL::int),
  (8, 64::real, 64::real, 500::float8, 32000::float8, 'TRF29', 44::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-28 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-28', 110, 1607, 1607, 1000, 53567.74, 267838.69, 322500, 'CLT14', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (37, 185::real, 185::real, 166.67::float8, 30833.95::float8, 'TRF19', 9::int, NULL::int),
  (22, 132::real, 132::real, 166.67::float8, 22000.44::float8, 'TRF19', 11::int, NULL::int),
  (11, 550::real, 550::real, 166.67::float8, 91668.5::float8, 'TRF19', 1::int, NULL::int),
  (12, 600::real, 600::real, 166.67::float8, 100002::float8, 'TRF19', 7::int, NULL::int),
  (28, 140::real, 140::real, 166.67::float8, 23333.8::float8, 'TRF19', 15::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-28 | Express sans TVA | Ambila
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-28', 16, 305, 305, 1000, 0, 228750, 229800, 'CLT16', 'DST21', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 85::real, 85::real, 750::float8, 63750::float8, 'TRF31', 57::int, NULL::int),
  (2, 32::real, 32::real, 750::float8, 24000::float8, 'TRF31', 58::int, NULL::int),
  (3, 45::real, 45::real, 750::float8, 33750::float8, 'TRF31', 56::int, NULL::int),
  (1, 18::real, 18::real, 750::float8, 13500::float8, 'TRF31', 60::int, NULL::int),
  (5, 125::real, 125::real, 750::float8, 93750::float8, 'TRF31', 59::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-29 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-29', 4, 20, 20, 1000, 666.68, 3333.4, 5000, 'CLT08', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (4, 20::real, 20::real, 166.67::float8, 3333.4::float8, 'TRF28', 24::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-30 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-30', 12, 123, 123, 1000, 4100.08, 20500.41, 25600, 'CLT12', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (8, 48::real, 48::real, 166.67::float8, 8000.16::float8, 'TRF10', 11::int, NULL::int),
  (3, 15::real, 15::real, 166.67::float8, 2500.05::float8, 'TRF10', 9::int, NULL::int),
  (1, 60::real, 60::real, 166.67::float8, 10000.2::float8, 'TRF10', 2::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-30 | Express avec TVA | Sahambavy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-30', 42, 174, 174, 1000, 4350, 21750, 27100, 'CLT14', 'DST03', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (24, 120::real, 120::real, 125::float8, 15000::float8, 'TRF01', 24::int, NULL::int),
  (18, 54::real, 54::real, 125::float8, 6750::float8, 'TRF01', 13::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-07-31 | Express avec TVA | Madiorano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-07-31', 8, 84, 84, 1000, 4200, 21000, 26200, 'CLT18', 'DST08', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 12::real, 12::real, 250::float8, 3000::float8, 'TRF11', 31::int, NULL::int),
  (6, 72::real, 72::real, 250::float8, 18000::float8, 'TRF11', 40::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-01 | Express avec TVA | Marofarihy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-01', 38, 190, 190, 1000, 6333.46, 31667.3, 39100, 'CLT02', 'DST19', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (38, 190::real, 190::real, 166.67::float8, 31667.3::float8, 'TRF19', 17::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-03 | Express avec TVA | Antsaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-03', 51, 445, 445, 1000, 14833.63, 74168.15, 90100, 'CLT06', 'DST18', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (38, 380::real, 380::real, 166.67::float8, 63334.6::float8, 'TRF19', 14::int, NULL::int),
  (13, 65::real, 65::real, 166.67::float8, 10833.55::float8, 'TRF19', 17::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-04 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-04', 108, 648, 648, 1000, 16200, 81000, 98200, 'CLT14', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (30, 180::real, 180::real, 125::float8, 22500::float8, 'TRF01', 11::int, NULL::int),
  (39, 390::real, 390::real, 125::float8, 48750::float8, 'TRF01', 12::int, NULL::int),
  (39, 78::real, 78::real, 125::float8, 9750::float8, 'TRF01', 21::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-06 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-06', 34, 605.6, 605.6, 1000, 27227, 136135, 164400, 'CLT03', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (6, 300::real, 300::real, 166.67::float8, 50001::float8, 'TRF28', 4::int, NULL::int),
  (24, 105.6::real, 105.6::real, 500::float8, 52800::float8, 'TRF29', 43::int, NULL::int),
  (4, 200::real, 200::real, 166.67::float8, 33334::float8, 'TRF28', 3::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-08 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-08', 8, 480, 480, 1000, 16000.32, 80001.6, 97100, 'CLT03', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (8, 480::real, 480::real, 166.67::float8, 80001.6::float8, 'TRF19', 5::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-08 | Express avec TVA | Ambinanindrano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-08', 19, 265, 265, 1000, 8833.51, 44167.55, 54100, 'CLT16', 'DST14', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF19', 3::int, NULL::int),
  (6, 30::real, 30::real, 166.67::float8, 5000.1::float8, 'TRF19', 15::int, NULL::int),
  (2, 50::real, 50::real, 166.67::float8, 8333.5::float8, 'TRF19', 22::int, NULL::int),
  (1, 5::real, 5::real, 166.67::float8, 833.35::float8, 'TRF19', 24::int, NULL::int),
  (8, 80::real, 80::real, 166.67::float8, 13333.6::float8, 'TRF19', 14::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-11 | TRN03 | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-11', 432, 10920, 20000, 1000, 400000, 2000000, 2401000, 'CLT02', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (432, 10920::real, 20000::real, 100::float8, 2000000::float8, 'TRF08', NULL::int, 9::int),
  (334, 6680::real, 20000::real, 0::float8, 0::float8, 'TRF08', 6::int, 9::int),
  (40, 2000::real, 20000::real, 0::float8, 0::float8, 'TRF08', 7::int, 9::int),
  (27, 1620::real, 20000::real, 0::float8, 0::float8, 'TRF08', 2::int, 9::int),
  (31, 620::real, 20000::real, 0::float8, 0::float8, 'TRF08', 16::int, 9::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-12 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-12', 15, 400, 400, 1000, 13333.6, 66668, 81100, 'CLT10', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF10', 3::int, NULL::int),
  (4, 40::real, 40::real, 166.67::float8, 6666.8::float8, 'TRF10', 14::int, NULL::int),
  (4, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF10', 22::int, NULL::int),
  (2, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF10', 7::int, NULL::int),
  (3, 60::real, 60::real, 166.67::float8, 10000.2::float8, 'TRF10', 6::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-14 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-14', 75, 375, 375, 1000, 12500.25, 62501.25, 76100, 'CLT14', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (40, 200::real, 200::real, 166.67::float8, 33334::float8, 'TRF10', 24::int, NULL::int),
  (35, 175::real, 175::real, 166.67::float8, 29167.25::float8, 'TRF10', 15::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-14 | Express sans TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-14', 2, 36, 36, 1000, 0, 27000, 28000, 'CLT09', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 36::real, 36::real, 750::float8, 27000::float8, 'TRF31', 60::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-19 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-19', 18, 950, 950, 1000, 118750, 593750, 713500, 'CLT13', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 300::real, 300::real, 625::float8, 187500::float8, 'TRF32', 51::int, NULL::int),
  (2, 200::real, 200::real, 625::float8, 125000::float8, 'TRF32', 54::int, NULL::int),
  (3, 180::real, 180::real, 625::float8, 112500::float8, 'TRF32', 53::int, NULL::int),
  (8, 80::real, 80::real, 625::float8, 50000::float8, 'TRF32', 50::int, NULL::int),
  (2, 40::real, 40::real, 625::float8, 25000::float8, 'TRF32', 49::int, NULL::int),
  (1, 150::real, 150::real, 625::float8, 93750::float8, 'TRF32', 52::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-20 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-20', 3, 13.5, 20, 1000, 1000, 5000, 7000, 'CLT15', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 13.5::real, 13.5::real, 250::float8, 3375::float8, 'TRF11', 46::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-21 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-21', 35, 496, 496, 1000, 21133.48, 105667.4, 127900, 'CLT05', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (23, 276::real, 276::real, 250::float8, 69000::float8, 'TRF11', 34::int, NULL::int),
  (2, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF10', 7::int, NULL::int),
  (10, 120::real, 120::real, 166.67::float8, 20000.4::float8, 'TRF10', 18::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-22 | Express sans TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-22', 11, 198, 198, 1000, 0, 148500, 149500, 'CLT17', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 90::real, 90::real, 750::float8, 67500::float8, 'TRF31', 60::int, NULL::int),
  (1, 25::real, 25::real, 750::float8, 18750::float8, 'TRF31', 59::int, NULL::int),
  (2, 32::real, 32::real, 750::float8, 24000::float8, 'TRF31', 58::int, NULL::int),
  (3, 51::real, 51::real, 750::float8, 38250::float8, 'TRF31', 57::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-27 | Express avec TVA | Sahambavy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-27', 27, 287, 287, 1000, 7175, 35875, 44100, 'CLT07', 'DST03', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 50::real, 50::real, 125::float8, 6250::float8, 'TRF02', 35::int, NULL::int),
  (6, 33::real, 33::real, 125::float8, 4125::float8, 'TRF02', 47::int, NULL::int),
  (8, 72::real, 72::real, 125::float8, 9000::float8, 'TRF02', 29::int, NULL::int),
  (4, 48::real, 48::real, 125::float8, 6000::float8, 'TRF02', 34::int, NULL::int),
  (7, 84::real, 84::real, 125::float8, 10500::float8, 'TRF02', 40::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-29 | Express avec TVA | Andrambovato
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-29', 89, 693.4, 693.4, 1000, 17335, 86675, 105100, 'CLT03', 'DST07', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (6, 26.4::real, 26.4::real, 125::float8, 3300::float8, 'TRF02', 43::int, NULL::int),
  (36, 432::real, 432::real, 125::float8, 54000::float8, 'TRF02', 40::int, NULL::int),
  (18, 90::real, 90::real, 125::float8, 11250::float8, 'TRF02', 37::int, NULL::int),
  (29, 145::real, 145::real, 125::float8, 18125::float8, 'TRF02', 41::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-29 | Express avec TVA | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-29', 12, 246, 246, 1000, 8766.81, 43834.04, 53700, 'CLT08', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 18::real, 18::real, 250::float8, 4500::float8, 'TRF11', 48::int, NULL::int),
  (2, 16::real, 16::real, 250::float8, 4000::float8, 'TRF11', 38::int, NULL::int),
  (3, 180::real, 180::real, 166.67::float8, 30000.6::float8, 'TRF10', 2::int, NULL::int),
  (4, 32::real, 32::real, 166.67::float8, 5333.44::float8, 'TRF10', 23::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-31 | Express avec TVA | Amboanjobe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-31', 24, 289, 289, 1000, 10033.51, 50167.55, 61300, 'CLT07', 'DST11', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 20::real, 20::real, 166.67::float8, 3333.4::float8, 'TRF10', 16::int, NULL::int),
  (5, 15::real, 15::real, 166.67::float8, 2500.05::float8, 'TRF10', 13::int, NULL::int),
  (2, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF10', 4::int, NULL::int),
  (1, 5::real, 5::real, 166.67::float8, 833.35::float8, 'TRF10', 17::int, NULL::int),
  (4, 24::real, 24::real, 166.67::float8, 4000.08::float8, 'TRF10', 11::int, NULL::int),
  (2, 24::real, 24::real, 250::float8, 6000::float8, 'TRF11', 34::int, NULL::int),
  (8, 96::real, 96::real, 166.67::float8, 16000.32::float8, 'TRF10', 18::int, NULL::int),
  (1, 5::real, 5::real, 166.67::float8, 833.35::float8, 'TRF10', 24::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-08-31 | TRN02 | Sahambavy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-08-31', 590, 7050, 15000, 1000, 300000, 1500000, 1801000, 'CLT05', 'DST03', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (590, 7050::real, 15000::real, 100::float8, 1500000::float8, 'TRF06', NULL::int, 4::int),
  (292, 2920::real, 15000::real, 0::float8, 0::float8, 'TRF06', 12::int, 4::int),
  (275, 2750::real, 15000::real, 0::float8, 0::float8, 'TRF06', 14::int, 4::int),
  (23, 1380::real, 15000::real, 0::float8, 0::float8, 'TRF06', 5::int, 4::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-01 | Express avec TVA | Vohimasina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-01', 27, 260.5, 260.5, 1000, 6512.5, 32562.5, 40100, 'CLT15', 'DST02', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 12::real, 12::real, 125::float8, 1500::float8, 'TRF02', 31::int, NULL::int),
  (5, 17.5::real, 17.5::real, 125::float8, 2187.5::float8, 'TRF02', 45::int, NULL::int),
  (4, 22::real, 22::real, 125::float8, 2750::float8, 'TRF02', 47::int, NULL::int),
  (1, 12::real, 12::real, 125::float8, 1500::float8, 'TRF02', 40::int, NULL::int),
  (5, 60::real, 60::real, 125::float8, 7500::float8, 'TRF02', 26::int, NULL::int),
  (1, 12::real, 12::real, 125::float8, 1500::float8, 'TRF02', 34::int, NULL::int),
  (4, 80::real, 80::real, 125::float8, 10000::float8, 'TRF02', 27::int, NULL::int),
  (5, 45::real, 45::real, 125::float8, 5625::float8, 'TRF02', 30::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-03 | Express avec TVA | Andrambovato
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-03', 14, 116, 116, 1000, 2900, 14500, 18400, 'CLT16', 'DST07', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (8, 80::real, 80::real, 125::float8, 10000::float8, 'TRF01', 8::int, NULL::int),
  (2, 24::real, 24::real, 125::float8, 3000::float8, 'TRF01', 18::int, NULL::int),
  (4, 12::real, 12::real, 125::float8, 1500::float8, 'TRF01', 13::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-05 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-05', 71, 302, 302, 1000, 10066.87, 50334.34, 61500, 'CLT06', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (22, 110::real, 110::real, 166.67::float8, 18333.7::float8, 'TRF19', 17::int, NULL::int),
  (15, 90::real, 90::real, 166.67::float8, 15000.3::float8, 'TRF19', 11::int, NULL::int),
  (34, 102::real, 102::real, 166.67::float8, 17000.34::float8, 'TRF19', 13::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-08 | Express avec TVA | Fianarantsoa
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-08', 117, 886, 886, 1000, 22150, 110750, 133900, 'CLT06', 'DST01', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (25, 150::real, 150::real, 125::float8, 18750::float8, 'TRF02', 31::int, NULL::int),
  (16, 56::real, 56::real, 125::float8, 7000::float8, 'TRF02', 45::int, NULL::int),
  (36, 360::real, 360::real, 125::float8, 45000::float8, 'TRF01', 10::int, NULL::int),
  (40, 320::real, 320::real, 125::float8, 40000::float8, 'TRF02', 44::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-10 | TRN03 | Mahakobo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-10', 265, 8424, 20000, 1000, 500000, 2500000, 3001000, 'CLT02', 'DST15', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (265, 8424::real, 20000::real, 125::float8, 2500000::float8, 'TRF26', NULL::int, 5::int),
  (138, 6900::real, 20000::real, 0::float8, 0::float8, 'TRF26', 4::int, 5::int),
  (127, 1524::real, 20000::real, 0::float8, 0::float8, 'TRF26', 18::int, 5::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-11 | Express avec TVA | Madiorano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-11', 5, 125, 125, 1000, 4166.75, 20833.75, 26100, 'CLT13', 'DST08', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 125::real, 125::real, 166.67::float8, 20833.75::float8, 'TRF10', 22::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-16 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-16', 8, 212, 212, 1000, 5300, 26500, 32800, 'CLT17', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 100::real, 100::real, 125::float8, 12500::float8, 'TRF02', 25::int, NULL::int),
  (4, 100::real, 100::real, 125::float8, 12500::float8, 'TRF02', 35::int, NULL::int),
  (2, 12::real, 12::real, 125::float8, 1500::float8, 'TRF02', 48::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-16 | Express avec TVA | Manapatrana
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-16', 1, 9, 20, 1000, 1000, 5000, 7000, 'CLT08', 'DST12', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 9::real, 9::real, 250::float8, 2250::float8, 'TRF11', 29::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-17 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-17', 91, 757.6, 757.6, 1000, 75760, 378800, 455600, 'CLT04', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (12, 60::real, 60::real, 500::float8, 30000::float8, 'TRF29', 37::int, NULL::int),
  (11, 38.5::real, 38.5::real, 500::float8, 19250::float8, 'TRF29', 45::int, NULL::int),
  (19, 104.5::real, 104.5::real, 500::float8, 52250::float8, 'TRF29', 47::int, NULL::int),
  (7, 350::real, 350::real, 500::float8, 175000::float8, 'TRF29', 25::int, NULL::int),
  (33, 165::real, 165::real, 500::float8, 82500::float8, 'TRF29', 39::int, NULL::int),
  (9, 39.6::real, 39.6::real, 500::float8, 19800::float8, 'TRF29', 43::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-18 | Express avec TVA | Sahambavy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-18', 66, 606, 606, 1000, 15150, 75750, 91900, 'CLT05', 'DST03', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (31, 186::real, 186::real, 125::float8, 23250::float8, 'TRF02', 48::int, NULL::int),
  (35, 420::real, 420::real, 125::float8, 52500::float8, 'TRF02', 40::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-18 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-18', 23, 126.5, 126.5, 1000, 12650, 63250, 76900, 'CLT03', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (23, 126.5::real, 126.5::real, 500::float8, 63250::float8, 'TRF29', 47::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-18 | TRN02 | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-18', 1590, 6704.5, 15000, 1000, 1200000, 6000000, 7201000, 'CLT02', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1590, 6704.5::real, 15000::real, 400::float8, 6000000::float8, 'TRF34', NULL::int, 3::int),
  (1537, 5379.5::real, 15000::real, 0::float8, 0::float8, 'TRF34', 45::int, 3::int),
  (53, 1325::real, 15000::real, 0::float8, 0::float8, 'TRF34', 35::int, 3::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-19 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-19', 91, 965, 965, 1000, 24125, 120625, 145800, 'CLT14', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (26, 260::real, 260::real, 125::float8, 32500::float8, 'TRF01', 8::int, NULL::int),
  (39, 117::real, 117::real, 125::float8, 14625::float8, 'TRF01', 13::int, NULL::int),
  (8, 480::real, 480::real, 125::float8, 60000::float8, 'TRF01', 5::int, NULL::int),
  (18, 108::real, 108::real, 125::float8, 13500::float8, 'TRF01', 20::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-21 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-21', 5, 45, 45, 1000, 1125, 5625, 7800, 'CLT13', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 5::real, 5::real, 125::float8, 625::float8, 'TRF01', 17::int, NULL::int),
  (4, 40::real, 40::real, 125::float8, 5000::float8, 'TRF01', 10::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-22 | Express avec TVA | Mizilo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-22', 1, 10, 20, 1000, 666.68, 3333.4, 5000, 'CLT08', 'DST20', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 10::real, 10::real, 166.67::float8, 1666.7::float8, 'TRF19', 10::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-23 | Express avec TVA | Sahasinaka
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-23', 22, 187.6, 187.6, 1000, 9986.73, 49933.66, 61000, 'CLT13', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 60::real, 60::real, 375::float8, 22500::float8, 'TRF20', 33::int, NULL::int),
  (7, 42::real, 42::real, 166.67::float8, 7000.14::float8, 'TRF19', 19::int, NULL::int),
  (4, 17.6::real, 17.6::real, 375::float8, 6600::float8, 'TRF20', 43::int, NULL::int),
  (1, 12::real, 12::real, 375::float8, 4500::float8, 'TRF20', 40::int, NULL::int),
  (7, 56::real, 56::real, 166.67::float8, 9333.52::float8, 'TRF19', 23::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-24 | Express avec TVA | Ampitabe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-24', 4, 132, 132, 1000, 3300, 16500, 20800, 'CLT12', 'DST04', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (2, 12::real, 12::real, 125::float8, 1500::float8, 'TRF02', 48::int, NULL::int),
  (2, 120::real, 120::real, 125::float8, 15000::float8, 'TRF01', 2::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-26 | Express avec TVA | Mizilo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-26', 1, 5, 20, 1000, 666.68, 3333.4, 5000, 'CLT08', 'DST20', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 5::real, 5::real, 166.67::float8, 833.35::float8, 'TRF19', 9::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-29 | Express avec TVA | Marofarihy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-29', 14, 207, 207, 1000, 15525, 77625, 94200, 'CLT06', 'DST19', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 75::real, 75::real, 375::float8, 28125::float8, 'TRF20', 35::int, NULL::int),
  (11, 132::real, 132::real, 375::float8, 49500::float8, 'TRF20', 34::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-29 | TRN03 | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-29', 1024, 7257, 20000, 1000, 1600000, 8000000, 9601000, 'CLT14', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1024, 7257::real, 20000::real, 400::float8, 8000000::float8, 'TRF36', NULL::int, 9::int),
  (828, 4140::real, 20000::real, 0::float8, 0::float8, 'TRF36', 37::int, 9::int),
  (33, 1650::real, 20000::real, 0::float8, 0::float8, 'TRF36', 25::int, 9::int),
  (163, 1467::real, 20000::real, 0::float8, 0::float8, 'TRF36', 30::int, 9::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-30 | Express avec TVA | Manapatrana
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-30', 12, 104, 104, 1000, 3466.74, 17333.68, 21800, 'CLT15', 'DST12', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 36::real, 36::real, 166.67::float8, 6000.12::float8, 'TRF10', 18::int, NULL::int),
  (1, 20::real, 20::real, 166.67::float8, 3333.4::float8, 'TRF10', 16::int, NULL::int),
  (2, 12::real, 12::real, 166.67::float8, 2000.04::float8, 'TRF10', 11::int, NULL::int),
  (6, 36::real, 36::real, 166.67::float8, 6000.12::float8, 'TRF10', 20::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-09-30 | Express avec TVA | Ambida
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-09-30', 51, 810, 810, 1000, 25312.5, 126562.5, 152900, 'CLT14', 'DST05', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 150::real, 150::real, 156.25::float8, 23437.5::float8, 'TRF05', 52::int, NULL::int),
  (34, 340::real, 340::real, 156.25::float8, 53125::float8, 'TRF05', 50::int, NULL::int),
  (16, 320::real, 320::real, 156.25::float8, 50000::float8, 'TRF05', 49::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-01 | Express sans TVA | Fenomby
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-01', 14, 265, 265, 1000, 0, 149062.5, 150100, 'CLT15', 'DST16', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 15::real, 15::real, 562.5::float8, 8437.5::float8, 'TRF22', 56::int, NULL::int),
  (3, 75::real, 75::real, 562.5::float8, 42187.5::float8, 'TRF22', 59::int, NULL::int),
  (5, 90::real, 90::real, 562.5::float8, 50625::float8, 'TRF22', 60::int, NULL::int),
  (5, 85::real, 85::real, 562.5::float8, 47812.5::float8, 'TRF22', 57::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-01 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-01', 58, 485, 485, 1000, 16166.99, 80834.95, 98100, 'CLT03', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (11, 110::real, 110::real, 166.67::float8, 18333.7::float8, 'TRF28', 10::int, NULL::int),
  (19, 95::real, 95::real, 166.67::float8, 15833.65::float8, 'TRF28', 9::int, NULL::int),
  (28, 280::real, 280::real, 166.67::float8, 46667.6::float8, 'TRF28', 14::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-02 | Express sans TVA | Andrambovato
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-02', 10, 191, 191, 1000, 0, 35812.5, 36900, 'CLT07', 'DST07', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 80::real, 80::real, 187.5::float8, 15000::float8, 'TRF04', 58::int, NULL::int),
  (3, 75::real, 75::real, 187.5::float8, 14062.5::float8, 'TRF04', 59::int, NULL::int),
  (2, 36::real, 36::real, 187.5::float8, 6750::float8, 'TRF04', 60::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-02 | Express avec TVA | Mahakobo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-02', 12, 85, 85, 1000, 2833.39, 14166.95, 18000, 'CLT08', 'DST15', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (7, 35::real, 35::real, 166.67::float8, 5833.45::float8, 'TRF19', 15::int, NULL::int),
  (5, 50::real, 50::real, 166.67::float8, 8333.5::float8, 'TRF19', 10::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-02 | TRN03 | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-02', 473, 6922, 20000, 1000, 800000, 4000000, 4801000, 'CLT02', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (473, 6922::real, 20000::real, 200::float8, 4000000::float8, 'TRF18', NULL::int, 6::int),
  (65, 3250::real, 20000::real, 0::float8, 0::float8, 'TRF18', 25::int, 6::int),
  (408, 3672::real, 20000::real, 0::float8, 0::float8, 'TRF18', 30::int, 6::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-05 | Express avec TVA | Amboanjobe
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-05', 10, 280, 280, 1000, 9333.52, 46667.6, 57100, 'CLT04', 'DST11', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 250::real, 250::real, 166.67::float8, 41667.5::float8, 'TRF10', 4::int, NULL::int),
  (5, 30::real, 30::real, 166.67::float8, 5000.1::float8, 'TRF10', 20::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-05 | Express avec TVA | Ranomena
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-05', 4, 100, 100, 1000, 2500, 12500, 16000, 'CLT12', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (4, 100::real, 100::real, 125::float8, 12500::float8, 'TRF01', 22::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-06 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-06', 11, 155, 155, 1000, 5166.77, 25833.85, 32100, 'CLT18', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 125::real, 125::real, 166.67::float8, 20833.75::float8, 'TRF28', 22::int, NULL::int),
  (6, 30::real, 30::real, 166.67::float8, 5000.1::float8, 'TRF28', 15::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-07 | Express avec TVA | Sahambavy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-07', 4, 80, 80, 1000, 2000, 10000, 13000, 'CLT13', 'DST03', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (4, 80::real, 80::real, 125::float8, 10000::float8, 'TRF02', 27::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-09 | TRN03 | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-09', 1138, 12420, 20000, 1000, 500000, 2500000, 3001000, 'CLT04', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1138, 12420::real, 20000::real, 125::float8, 2500000::float8, 'TRF35', NULL::int, 9::int),
  (843, 8430::real, 20000::real, 0::float8, 0::float8, 'TRF35', 8::int, 9::int),
  (104, 2080::real, 20000::real, 0::float8, 0::float8, 'TRF35', 16::int, 9::int),
  (191, 1910::real, 20000::real, 0::float8, 0::float8, 'TRF35', 10::int, 9::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-10 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-10', 5, 28, 28, 1000, 933.35, 4666.76, 6600, 'CLT01', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 8::real, 8::real, 166.67::float8, 1333.36::float8, 'TRF28', 23::int, NULL::int),
  (4, 20::real, 20::real, 166.67::float8, 3333.4::float8, 'TRF28', 9::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-15 | Express avec TVA | Fenomby
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-15', 12, 112, 112, 1000, 3733.41, 18667.04, 23400, 'CLT16', 'DST16', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 50::real, 50::real, 166.67::float8, 8333.5::float8, 'TRF19', 4::int, NULL::int),
  (7, 42::real, 42::real, 166.67::float8, 7000.14::float8, 'TRF19', 19::int, NULL::int),
  (4, 20::real, 20::real, 166.67::float8, 3333.4::float8, 'TRF19', 9::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-17 | Express avec TVA | Marofarihy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-17', 1, 9, 20, 1000, 1500, 7500, 10000, 'CLT07', 'DST19', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 9::real, 9::real, 375::float8, 3375::float8, 'TRF20', 29::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-17 | Express avec TVA | Ambida
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-17', 8, 84, 84, 1000, 2100, 10500, 13600, 'CLT13', 'DST05', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (5, 60::real, 60::real, 125::float8, 7500::float8, 'TRF02', 26::int, NULL::int),
  (3, 24::real, 24::real, 125::float8, 3000::float8, 'TRF02', 38::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-20 | Express avec TVA | Manakara
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-20', 6, 150, 150, 1000, 18750, 93750, 113500, 'CLT01', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (1, 100::real, 100::real, 625::float8, 62500::float8, 'TRF32', 54::int, NULL::int),
  (5, 50::real, 50::real, 625::float8, 31250::float8, 'TRF32', 50::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-20 | Express avec TVA | Mizilo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-20', 48, 675, 675, 1000, 22500.45, 112502.25, 136100, 'CLT03', 'DST20', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (25, 125::real, 125::real, 166.67::float8, 20833.75::float8, 'TRF19', 17::int, NULL::int),
  (15, 90::real, 90::real, 166.67::float8, 15000.3::float8, 'TRF19', 20::int, NULL::int),
  (6, 360::real, 360::real, 166.67::float8, 60001.2::float8, 'TRF19', 5::int, NULL::int),
  (2, 100::real, 100::real, 166.67::float8, 16667::float8, 'TRF19', 7::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-21 | Express avec TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-21', 159, 2106, 2106, 1000, 70201.4, 351007.02, 422300, 'CLT04', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (26, 260::real, 260::real, 166.67::float8, 43334.2::float8, 'TRF10', 12::int, NULL::int),
  (21, 126::real, 126::real, 166.67::float8, 21000.42::float8, 'TRF10', 19::int, NULL::int),
  (5, 125::real, 125::real, 166.67::float8, 20833.75::float8, 'TRF10', 22::int, NULL::int),
  (6, 300::real, 300::real, 166.67::float8, 50001::float8, 'TRF10', 3::int, NULL::int),
  (39, 195::real, 195::real, 166.67::float8, 32500.65::float8, 'TRF10', 9::int, NULL::int),
  (40, 480::real, 480::real, 166.67::float8, 80001.6::float8, 'TRF10', 18::int, NULL::int),
  (12, 120::real, 120::real, 166.67::float8, 20000.4::float8, 'TRF10', 8::int, NULL::int),
  (10, 500::real, 500::real, 166.67::float8, 83335::float8, 'TRF10', 7::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-21 | Express sans TVA | Ionilahy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-21', 52, 868, 868, 1000, 0, 325500, 326500, 'CLT06', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (20, 340::real, 340::real, 375::float8, 127500::float8, 'TRF13', 57::int, NULL::int),
  (11, 198::real, 198::real, 375::float8, 74250::float8, 'TRF13', 60::int, NULL::int),
  (6, 90::real, 90::real, 375::float8, 33750::float8, 'TRF13', 56::int, NULL::int),
  (15, 240::real, 240::real, 375::float8, 90000::float8, 'TRF13', 58::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-23 | Express avec TVA | Volohosy
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-23', 143, 1277, 1277, 1000, 63850, 319250, 384100, 'CLT03', 'DST10', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (40, 320::real, 320::real, 250::float8, 80000::float8, 'TRF11', 44::int, NULL::int),
  (27, 243::real, 243::real, 250::float8, 60750::float8, 'TRF11', 29::int, NULL::int),
  (19, 228::real, 228::real, 250::float8, 57000::float8, 'TRF11', 34::int, NULL::int),
  (22, 66::real, 66::real, 250::float8, 16500::float8, 'TRF11', 42::int, NULL::int),
  (35, 420::real, 420::real, 250::float8, 105000::float8, 'TRF11', 26::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-24 | Express sans TVA | Fenomby
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-24', 64, 1201, 1201, 1000, 0, 675562.5, 676600, 'CLT04', 'DST16', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (16, 240::real, 240::real, 562.5::float8, 135000::float8, 'TRF22', 56::int, NULL::int),
  (5, 85::real, 85::real, 562.5::float8, 47812.5::float8, 'TRF22', 57::int, NULL::int),
  (18, 450::real, 450::real, 562.5::float8, 253125::float8, 'TRF22', 59::int, NULL::int),
  (13, 234::real, 234::real, 562.5::float8, 131625::float8, 'TRF22', 60::int, NULL::int),
  (12, 192::real, 192::real, 562.5::float8, 108000::float8, 'TRF22', 58::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-27 | Express avec TVA | Tolongoina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-27', 8, 137, 137, 1000, 6850, 34250, 42100, 'CLT07', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (4, 12::real, 12::real, 250::float8, 3000::float8, 'TRF11', 42::int, NULL::int),
  (1, 50::real, 50::real, 250::float8, 12500::float8, 'TRF11', 25::int, NULL::int),
  (3, 75::real, 75::real, 250::float8, 18750::float8, 'TRF11', 35::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-27 | Express sans TVA | Vohimasina
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-27', 12, 199, 199, 1000, 0, 37312.5, 38400, 'CLT16', 'DST02', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (3, 54::real, 54::real, 187.5::float8, 10125::float8, 'TRF04', 60::int, NULL::int),
  (5, 85::real, 85::real, 187.5::float8, 15937.5::float8, 'TRF04', 57::int, NULL::int),
  (4, 60::real, 60::real, 187.5::float8, 11250::float8, 'TRF04', 56::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-28 | Express avec TVA | Madiorano
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-28', 40, 200, 200, 1000, 6666.8, 33334, 41100, 'CLT11', 'DST08', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (40, 200::real, 200::real, 166.67::float8, 33334::float8, 'TRF10', 17::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-28 | Express avec TVA | Mahakobo
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-28', 33, 1156, 1156, 1000, 69450.48, 347252.4, 417800, 'CLT05', 'DST15', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (17, 340::real, 340::real, 562.5::float8, 191250::float8, 'TRF21', 55::int, NULL::int),
  (12, 720::real, 720::real, 166.67::float8, 120002.4::float8, 'TRF19', 2::int, NULL::int),
  (4, 96::real, 96::real, 375::float8, 36000::float8, 'TRF20', 28::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- 2026-10-29 | Express sans TVA | Fenomby
WITH f AS (
  INSERT INTO public.facturemarchandise (datefacturemarchandise, nombrecolistotal, poidsreeltotal, poidsfacturetotal, piquiremarchandise, tva, montanthttotal, montantttc, idclient, iddestination, iduser)
  VALUES ('2026-10-29', 6, 96, 96, 1000, 0, 54000, 55000, 'CLT11', 'DST16', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'))
  RETURNING idfacturemarchandise
)
INSERT INTO public.detailfacture (nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon, idfacturemarchandise)
SELECT l.*, f.idfacturemarchandise FROM f, (VALUES
  (6, 96::real, 96::real, 562.5::float8, 54000::float8, 'TRF22', 58::int, NULL::int)
) AS l(nombrecolis, poidsreel, poidsfacture, prixapplicable, montantht, idtarifmarchandise, idmarchandise, idwagon);

-- =====================================================================
-- 13) FACTURES FUNÉRAIRES : 16 factures
-- Montant HT = 7267 x tarif de la zone ; TTC = HT + piquire, arrondi.
-- Le numéro (001/04-06-2026/F ...) est créé par le trigger.
-- =====================================================================
INSERT INTO public.facturefuneraire (datefacturefuneraire, piquirefuneraire, montanthttfuneraire, montantttcfunerare, nomdefunt, idclient, iddestination, iduser) VALUES
  ('2026-06-02', 1000, 1211190.89, 1212200, 'Rakotozafy Jean', 'CLT09', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-06-11', 1000, 1211190.89, 1212200, 'Razafimahefa Marie', 'CLT01', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-07-07', 1000, 1211190.89, 1212200, 'Randrianantoandro Paul', 'CLT07', 'DST20', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-07-08', 1000, 1211190.89, 1212200, 'Rasoanirina Jeanne', 'CLT12', 'DST16', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-07-15', 1000, 1211190.89, 1212200, 'Ramanantsoa Albert', 'CLT17', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-07-29', 1000, 1211190.89, 1212200, 'Rahelimalala Suzanne', 'CLT01', 'DST09', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-08-06', 1000, 1211190.89, 1212200, 'Andriamihaja Victor', 'CLT16', 'DST20', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-08-18', 1000, 908375, 909400, 'Ravoninahitra Lucie', 'CLT08', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-09-01', 1000, 908375, 909400, 'Rakotobe Gilbert', 'CLT17', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-09-12', 1000, 908375, 909400, 'Razanadrakoto Hanta', 'CLT08', 'DST06', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-09-18', 1000, 1211190.89, 1212200, 'Rabenoro Michel', 'CLT16', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-09-23', 1000, 1211190.89, 1212200, 'Ramaroson Yvonne', 'CLT09', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-09-30', 1000, 1211190.89, 1212200, 'Rajaonarison Daniel', 'CLT01', 'DST17', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-10-05', 1000, 1211190.89, 1212200, 'Raharisoa Berthe', 'CLT07', 'DST15', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-10-19', 1000, 1211190.89, 1212200, 'Ratsimba Félix', 'CLT07', 'DST13', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg')),
  ('2026-10-26', 1000, 1211190.89, 1212200, 'Rasoamanana Clarisse', 'CLT17', 'DST22', (SELECT iduser FROM public.usertable WHERE emailutilisateur = 'taxateur@taxe.mg'));
