-- =====================================================================
-- AMÉLIORATION DE LA BASE "taxation"
-- À copier et exécuter UNE FOIS dans le Query Tool de pgAdmin,
-- sur votre base déjà créée (celle de Taxation.sql).
-- Le script peut être relancé sans danger.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Trigger du numéro de facture marchandise (CORRECTION)
--    L'ancien trigger utilisait NEW.datefacture et NEW.numFacture,
--    mais les colonnes s'appellent datefacturemarchandise et
--    numfacturemarchandise : chaque INSERT plantait.
--    Numéro créé : 001/05-01-2027
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generer_num_facture() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_date   DATE;
    v_annee  INTEGER;
    v_numero INTEGER;
BEGIN
    -- Sans date, on prend la date du jour
    v_date := COALESCE(NEW.datefacturemarchandise, CURRENT_DATE);
    NEW.datefacturemarchandise := v_date;
    v_annee := EXTRACT(YEAR FROM v_date);

    -- Créer le compteur de l'année s'il n'existe pas
    INSERT INTO compteur_facture (annee, dernier_numero)
    VALUES (v_annee, 0)
    ON CONFLICT (annee) DO NOTHING;

    -- Verrouiller le compteur (évite les doublons entre utilisateurs)
    SELECT dernier_numero INTO v_numero
    FROM compteur_facture
    WHERE annee = v_annee
    FOR UPDATE;

    v_numero := v_numero + 1;

    UPDATE compteur_facture
    SET dernier_numero = v_numero
    WHERE annee = v_annee;

    NEW.numfacturemarchandise := LPAD(v_numero::TEXT, 3, '0')
                                 || '/' || TO_CHAR(v_date, 'DD-MM-YYYY');
    RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------
-- 2) Montants : type "double precision" (nombre réel précis)
--    - montanthttotal était un entier : le montant HT peut avoir des virgules
--    - le type "real" ne garde que 7 chiffres : 1 234 567,89 devenait 1 234 568
--      "double precision" en garde 15, et Node le lit toujours comme un nombre
-- ---------------------------------------------------------------------
ALTER TABLE public.facturemarchandise ALTER COLUMN montanthttotal TYPE double precision;
ALTER TABLE public.facturemarchandise ALTER COLUMN tva TYPE double precision;
ALTER TABLE public.detailfacture ALTER COLUMN montantht TYPE double precision;
ALTER TABLE public.facturefuneraire ALTER COLUMN montanthttfuneraire TYPE double precision;
ALTER TABLE public.facturefuneraire ALTER COLUMN montantttcfunerare TYPE double precision;


-- ---------------------------------------------------------------------
-- 3) detailfacture.idmarchandise devient facultatif
--    Wagon complet (série 100 / 400) : la 1re ligne de la facture est le
--    wagon lui-même (PPN ou Divers), elle n'a pas de marchandise.
-- ---------------------------------------------------------------------
ALTER TABLE public.detailfacture ALTER COLUMN idmarchandise DROP NOT NULL;


-- ---------------------------------------------------------------------
-- 4) facturemarchandise.iduser -> clé étrangère vers usertable
-- ---------------------------------------------------------------------
ALTER TABLE public.facturemarchandise DROP CONSTRAINT IF EXISTS fk_facture_user;
ALTER TABLE public.facturemarchandise
    ADD CONSTRAINT fk_facture_user FOREIGN KEY (iduser) REFERENCES public.usertable(iduser);


-- ---------------------------------------------------------------------
-- 5) Email unique (sert pour se connecter)
-- ---------------------------------------------------------------------
ALTER TABLE public.usertable DROP CONSTRAINT IF EXISTS usertable_email_unique;
ALTER TABLE public.usertable
    ADD CONSTRAINT usertable_email_unique UNIQUE (emailutilisateur);


-- ---------------------------------------------------------------------
-- 6) tariffuneraire
--    a) l'id est créé tout seul : TF01, TF02, TF03 ...
--    b) on ajoute la zone : le tarif funéraire dépend de la zone de la
--       destination (prixzone = prix de la zone, prixfixe = prix imposé)
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.tariffuneraire_seq START WITH 1 INCREMENT BY 1;

-- Les tarifs déjà présents sont renumérotés TF01, TF02 ... (aucune table ne les utilise encore)
UPDATE public.tariffuneraire t
SET idtariffuneraire = 'TF' || LPAD(n.rang::TEXT, 2, '0')
FROM (SELECT idtariffuneraire, ROW_NUMBER() OVER (ORDER BY idtariffuneraire) AS rang
      FROM public.tariffuneraire) n
WHERE t.idtariffuneraire = n.idtariffuneraire
  AND t.idtariffuneraire NOT LIKE 'TF%';

-- Le compteur repart après le plus grand numéro existant
SELECT setval('public.tariffuneraire_seq',
              COALESCE((SELECT MAX(SUBSTRING(idtariffuneraire FROM 3)::INT) FROM public.tariffuneraire), 0) + 1,
              false);

ALTER TABLE public.tariffuneraire
    ALTER COLUMN idtariffuneraire
    SET DEFAULT ('TF'::text || lpad((nextval('public.tariffuneraire_seq'::regclass))::text, 2, '0'::text));

ALTER TABLE public.tariffuneraire ADD COLUMN IF NOT EXISTS idzone character varying(5);

ALTER TABLE public.tariffuneraire DROP CONSTRAINT IF EXISTS fk_tariffuneraire_zone;
ALTER TABLE public.tariffuneraire
    ADD CONSTRAINT fk_tariffuneraire_zone FOREIGN KEY (idzone) REFERENCES public.zonedestination(idzone);

-- Un seul tarif funéraire par zone
ALTER TABLE public.tariffuneraire DROP CONSTRAINT IF EXISTS unique_tariffuneraire_zone;
ALTER TABLE public.tariffuneraire
    ADD CONSTRAINT unique_tariffuneraire_zone UNIQUE (idzone);


-- Vérification : doit afficher les tarifs avec TF01, TF02 ...
SELECT * FROM public.tariffuneraire ORDER BY idtariffuneraire;
