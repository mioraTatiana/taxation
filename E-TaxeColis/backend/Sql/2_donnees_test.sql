-- =====================================================================
-- DONNÉES DE TEST
-- À exécuter APRÈS 1_amelioration_base.sql, dans le Query Tool.
-- "ON CONFLICT DO NOTHING" : une ligne qui existe déjà n'est pas recopiée.
-- Les compteurs (séquences) sont remis à jour à la fin.
--
-- Le compte ADMIN n'est pas ici : il se crée avec "npm run creer-admin" (voir GUIDE.md).
--
-- Comptes de test (mot de passe pour tous : Motdepasse1)
--   taxateur@taxe.mg    Taxateur         actif
--   directeur@taxe.mg   Directeur        actif
--   chef@taxe.mg        Chef de division en attente (à activer par l'admin)
-- =====================================================================

-- ----- Zones -----
INSERT INTO public.zonedestination (idzone, libellezone, kilometrage) VALUES
  ('ZN01', 'Zone 1', 50),
  ('ZN02', 'Zone 2', 100),
  ('ZN03', 'Zone 3', 163)
ON CONFLICT DO NOTHING;

-- ----- Destinations -----
INSERT INTO public.destination (iddestination, nomdestination, typedestination, codegare, pointkilometrique, idzone) VALUES
  ('DST01', 'Sahambavy',  'Simple arrêt', NULL,  20,  'ZN01'),
  ('DST02', 'Andrambovato','Gare',        'ADR', 45,  'ZN01'),
  ('DST03', 'Ranomena',   'Gare',         'RNM', 70,  'ZN02'),
  ('DST04', 'Tolongoina', 'Gare',         'TLG', 95,  'ZN02'),
  ('DST05', 'Manakara',   'Gare',         'MKR', 163, 'ZN03')
ON CONFLICT DO NOTHING;

-- ----- Types de wagon -----
-- modefacturation : false = Express (facturé par marchandise), true = wagon complet
INSERT INTO public.typewagon (idtypewagon, libelletypewagon, modefacturation, poidsfacturation) VALUES
  ('TRN01', 'Express',   false, 0),
  ('TRN02', 'Série 100', true,  15000),
  ('TRN03', 'Série 400', true,  20000)
ON CONFLICT DO NOTHING;

-- ----- Wagons -----
INSERT INTO public.wagon (idwagon, libellewagon, idtypewagon) VALUES
  (1, 'EXP-01',  'TRN01'),
  (2, 'S100-01', 'TRN02'),
  (3, 'S100-02', 'TRN02'),
  (4, 'S400-01', 'TRN03'),
  (5, 'S400-02', 'TRN03')
ON CONFLICT DO NOTHING;

-- ----- Types de marchandise -----
INSERT INTO public.typemarchandise (idtypemarchandise, libelletype, soumistva) VALUES
  ('TP01', 'PPN',                true),
  ('TP02', 'Divers',             true),
  ('TP03', 'Carburant avec TVA', true),
  ('TP04', 'Carburant sans TVA', false),
  ('TP05', 'Encombrant',         true)
ON CONFLICT DO NOTHING;

-- ----- Marchandises (poids d'un colis en kg) -----
INSERT INTO public.marchandise (idmarchandise, designation, poidscolis, idtypemarchandise) VALUES
  (1, 'Sac de riz',        50,  'TP01'),
  (2, 'Sac de sucre',      50,  'TP01'),
  (3, 'Bidon d''huile 20L', 20, 'TP01'),
  (4, 'Sac de ciment',     50,  'TP02'),
  (5, 'Carton divers',     2.5, 'TP02'),
  (6, 'Fût de gasoil',     200, 'TP03'),
  (7, 'Bidon de pétrole',  20,  'TP04'),
  (8, 'Tôle ondulée',      15,  'TP05'),
  (9, 'Matelas',           12,  'TP05')
ON CONFLICT DO NOTHING;

-- ----- Tarifs marchandise (prix au kg) -----
-- Express : tous les types ; Série 100 / 400 : seulement PPN et Divers
INSERT INTO public.tarifmarchandise (idtarifmarchandise, idzone, idtypemarchandise, idtypewagon, prixkg) VALUES
  -- Zone 1
  ('TRF01', 'ZN01', 'TP01', 'TRN01', 150),
  ('TRF02', 'ZN01', 'TP02', 'TRN01', 200),
  ('TRF03', 'ZN01', 'TP03', 'TRN01', 250),
  ('TRF04', 'ZN01', 'TP04', 'TRN01', 220),
  ('TRF05', 'ZN01', 'TP05', 'TRN01', 300),
  ('TRF06', 'ZN01', 'TP01', 'TRN02', 40),
  ('TRF07', 'ZN01', 'TP02', 'TRN02', 50),
  ('TRF08', 'ZN01', 'TP01', 'TRN03', 35),
  ('TRF09', 'ZN01', 'TP02', 'TRN03', 45),
  -- Zone 2
  ('TRF10', 'ZN02', 'TP01', 'TRN01', 240),
  ('TRF11', 'ZN02', 'TP02', 'TRN01', 320),
  ('TRF12', 'ZN02', 'TP03', 'TRN01', 400),
  ('TRF13', 'ZN02', 'TP04', 'TRN01', 350),
  ('TRF14', 'ZN02', 'TP05', 'TRN01', 480),
  ('TRF15', 'ZN02', 'TP01', 'TRN02', 60),
  ('TRF16', 'ZN02', 'TP02', 'TRN02', 80),
  ('TRF17', 'ZN02', 'TP01', 'TRN03', 55),
  ('TRF18', 'ZN02', 'TP02', 'TRN03', 70),
  -- Zone 3
  ('TRF19', 'ZN03', 'TP01', 'TRN01', 360),
  ('TRF20', 'ZN03', 'TP02', 'TRN01', 480),
  ('TRF21', 'ZN03', 'TP03', 'TRN01', 600),
  ('TRF22', 'ZN03', 'TP04', 'TRN01', 530),
  ('TRF23', 'ZN03', 'TP05', 'TRN01', 720),
  ('TRF24', 'ZN03', 'TP01', 'TRN02', 90),
  ('TRF25', 'ZN03', 'TP02', 'TRN02', 110),
  ('TRF26', 'ZN03', 'TP01', 'TRN03', 80),
  ('TRF27', 'ZN03', 'TP02', 'TRN03', 100)
ON CONFLICT DO NOTHING;

-- ----- Tarifs funéraires (montant HT = prixfixe x prixzone) -----
INSERT INTO public.tariffuneraire (idtariffuneraire, idzone, prixfixe, prixzone) VALUES
  ('TF01', 'ZN01', 7267, 150),
  ('TF02', 'ZN02', 7267, 240),
  ('TF03', 'ZN03', 7267, 360)
ON CONFLICT DO NOTHING;

-- ----- Clients -----
INSERT INTO public.client (idclient, nomclient, sigle, cin, telephone, adresse, email) VALUES
  ('CLT01', 'Rakoto Jean',      NULL,     '101231456789', '+261341234567', 'Fianarantsoa',  'rakoto@gmail.com'),
  ('CLT02', 'Madagascar Fret',  'MAFRET', NULL,           '+261329876543', 'Manakara',      'contact@mafret.mg'),
  ('CLT03', 'Rasoa Hanitra',    NULL,     '201987654321', '0331122334',    'Ranomena',      NULL),
  ('CLT04', 'Société Vatovavy', 'SOVAT',  NULL,           '0345566778',    'Tolongoina',    'sovat@gmail.com')
ON CONFLICT DO NOTHING;

-- ----- Utilisateurs (mot de passe : Motdepasse1, haché avec bcrypt) -----
-- (sans iduser : la base donne USER01, USER02 ... à la suite du compte admin)
INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut) VALUES
  ('Miora',       'taxateur',         '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'taxateur@taxe.mg',  'actif'),
  ('Rabe',       'directeur',        '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'directeur@taxe.mg', 'actif'),
  ('Hery',       'chef de division', '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'chef@taxe.mg',      'en attente')
ON CONFLICT (emailutilisateur) DO NOTHING;


-- ----- Mise à jour des compteurs (pour que le prochain id ne soit pas un doublon) -----
SELECT setval('public.zone_seq',           (SELECT MAX(SUBSTRING(idzone FROM 3)::INT) FROM public.zonedestination));
SELECT setval('public.destination_id_seq', (SELECT MAX(SUBSTRING(iddestination FROM 4)::INT) FROM public.destination));
SELECT setval('public.typetrain_seq',      (SELECT MAX(SUBSTRING(idtypewagon FROM 4)::INT) FROM public.typewagon));
SELECT setval('public.train_idtrain_seq',  (SELECT MAX(idwagon) FROM public.wagon));
SELECT setval('public.typemarchandise_seq',(SELECT MAX(SUBSTRING(idtypemarchandise FROM 3)::INT) FROM public.typemarchandise));
SELECT setval('public.marchandise_idmarchandise_seq', (SELECT MAX(idmarchandise) FROM public.marchandise));
SELECT setval('public.tarif_id_seq',       (SELECT MAX(SUBSTRING(idtarifmarchandise FROM 4)::INT) FROM public.tarifmarchandise));
SELECT setval('public.tariffuneraire_seq', (SELECT MAX(SUBSTRING(idtariffuneraire FROM 3)::INT) FROM public.tariffuneraire) + 1, false);
SELECT setval('public.client_seq',         (SELECT MAX(SUBSTRING(idclient FROM 4)::INT) FROM public.client));
