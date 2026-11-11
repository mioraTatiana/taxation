-- =====================================================================
-- MISE À JOUR DE NOVEMBRE (document "Amélioration")
-- À exécuter UNE FOIS dans pgAdmin > base "taxation" > Query Tool.
-- Les données existantes (clients, factures, utilisateurs) sont gardées.
-- Le fichier peut être relancé sans erreur (IF NOT EXISTS / ON CONFLICT).
-- =====================================================================

-- 1) Client : le téléphone devient facultatif
ALTER TABLE public.client ALTER COLUMN telephone DROP NOT NULL;

-- 2) Type de wagon : poids FACTURÉ et poids SUPPORTÉ (charge maximum)
--    Série 100 : facturé 20 000 kg, supporté 15 000 kg
--    Série 400 : facturé 25 000 kg, supporté 20 000 kg
--    Express   : pas de poids fixe (0)
ALTER TABLE public.typewagon ADD COLUMN IF NOT EXISTS poidssupporte integer DEFAULT 0;
UPDATE public.typewagon SET poidsfacturation = 20000, poidssupporte = 15000 WHERE libelletypewagon = 'Série 100';
UPDATE public.typewagon SET poidsfacturation = 25000, poidssupporte = 20000 WHERE libelletypewagon = 'Série 400';
UPDATE public.typewagon SET poidsfacturation = 0,     poidssupporte = 0     WHERE modefacturation = false;

-- 3) Ligne de facture : désignation écrite par le taxateur
--    (marchandise qui n'est pas dans la liste, ou ligne "PPN"/"Divers" d'un wagon complet).
--    Si idmarchandise est rempli, c'est la désignation de la table marchandise qui est affichée.
ALTER TABLE public.detailfacture ADD COLUMN IF NOT EXISTS designation character varying(100);

-- 4) Nouveau type d'utilisateur : receveur (aucune contrainte à changer : typeutilisateur est un texte)
--    Compte de test : receveur@taxe.mg / Motdepasse1
INSERT INTO public.usertable (nomutilisateur, typeutilisateur, motpasse, emailutilisateur, statut) VALUES
  ('Receveur', 'receveur', '$2b$10$rmj14ztgxylLyBzKOriul.duDSqOAbvSJNhtC2Ix4Mkxau734k7Xq', 'receveur@taxe.mg', 'actif')
ON CONFLICT (emailutilisateur) DO NOTHING;
