-- =====================================================================
-- AJOUT DE DEUX COMPTES UTILISATEURS
-- À utiliser seulement si votre base est déjà prête et que vous ne voulez
-- PAS relancer 2_donnees_test.sql (qui contient déjà ces deux comptes).
-- Si l'email existe déjà, la ligne est ignorée (rien n'est écrasé).
--
--   Miora  : ttnmiora@gmail.com           / miora123    Taxateur          actif
--   Hasina : hasimiora.randira@gmail.com  / Hasina2026  Chef de division  actif
--            (mot de passe provisoire : à changer dans "Mon profil", ou par l'admin dans "Statut")
-- Les mots de passe sont chiffrés avec bcrypt, comme le fait le backend.
-- =====================================================================
INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut) VALUES
  ('Miora',  'taxateur',         '$2b$10$XsVdTsVnn/A.k09sc3/a6.DX9oALspfgP4FIIXBP1GMT48kwb/MoS', 'ttnmiora@gmail.com',          'actif'),
  ('Hasina', 'chef de division', '$2b$10$5vJCV32M5YVjM4POwI5JHuIhdfRBGUNAH1Au0Mmo1irvx3TM2pXFm', 'hasimiora.randira@gmail.com', 'actif')
ON CONFLICT (emailutilisateur) DO NOTHING;

SELECT iduser, nomutilisateur, typeutilisateur, emailutilisateur, statut FROM public.usertable ORDER BY iduser;
