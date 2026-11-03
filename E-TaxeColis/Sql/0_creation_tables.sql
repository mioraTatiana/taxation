-- =====================================================================
-- CRÉATION DES TABLES (base VIDE seulement)
-- À utiliser si vous créez la base "taxation" de zéro sur votre PC.
-- Si votre base contient déjà les tables (restaurée depuis Taxation.sql),
-- NE lancez PAS ce fichier : passez directement à 1_amelioration_base.sql.
--
-- Ordre : 0_creation_tables.sql -> 1_amelioration_base.sql -> 2_donnees_test.sql (facultatif)
-- C'est le même schéma que Taxation.sql (les corrections sont dans le fichier 1).
-- =====================================================================


-- ----- Compteurs des identifiants (CLT01, DST01, ...) -----
CREATE SEQUENCE public.client_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.destination_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.tarif_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.typemarchandise_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.typetrain_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.user_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE public.zone_seq START WITH 1 INCREMENT BY 1;


-- ----- Zones et destinations -----
CREATE TABLE public.zonedestination (
    idzone character varying(5) DEFAULT ('ZN'::text || lpad((nextval('public.zone_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    libellezone character varying(6),
    kilometrage integer,
    CONSTRAINT zonedestination_pkey PRIMARY KEY (idzone)
);

CREATE TABLE public.destination (
    iddestination character varying(10) DEFAULT ('DST'::text || lpad((nextval('public.destination_id_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    nomdestination character varying(50) NOT NULL,
    typedestination character varying(12) NOT NULL,
    codegare character varying(4),
    pointkilometrique integer,
    idzone character varying(5) NOT NULL,
    CONSTRAINT destination_pkey PRIMARY KEY (iddestination),
    CONSTRAINT fk_destination_zone FOREIGN KEY (idzone) REFERENCES public.zonedestination(idzone)
);


-- ----- Wagons -----
CREATE TABLE public.typewagon (
    idtypewagon character varying(5) DEFAULT ('TRN'::text || lpad((nextval('public.typetrain_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    libelletypewagon character varying(10),
    modefacturation boolean,
    poidsfacturation integer,
    CONSTRAINT typetrain_pkey PRIMARY KEY (idtypewagon)
);

CREATE TABLE public.wagon (
    idwagon serial NOT NULL,
    libellewagon character varying(20) NOT NULL,
    idtypewagon character varying(5) NOT NULL,
    CONSTRAINT train_pkey PRIMARY KEY (idwagon),
    CONSTRAINT fk_train_typetrain FOREIGN KEY (idtypewagon) REFERENCES public.typewagon(idtypewagon)
);
-- Le compteur de idwagon garde le nom de l'ancienne base
ALTER SEQUENCE public.wagon_idwagon_seq RENAME TO train_idtrain_seq;


-- ----- Marchandises -----
CREATE TABLE public.typemarchandise (
    idtypemarchandise character varying(4) DEFAULT ('TP'::text || lpad((nextval('public.typemarchandise_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    libelletype character varying(20),
    soumistva boolean,
    CONSTRAINT typemarchandise_pkey PRIMARY KEY (idtypemarchandise)
);

CREATE TABLE public.marchandise (
    idmarchandise serial NOT NULL,
    designation character varying(50) NOT NULL,
    poidscolis real NOT NULL,
    idtypemarchandise character varying(4) NOT NULL,
    CONSTRAINT marchandise_pkey PRIMARY KEY (idmarchandise),
    CONSTRAINT fk_marchandise_typemarchandise FOREIGN KEY (idtypemarchandise) REFERENCES public.typemarchandise(idtypemarchandise)
);


-- ----- Tarifs -----
CREATE TABLE public.tarifmarchandise (
    idtarifmarchandise character varying(5) DEFAULT ('TRF'::text || lpad((nextval('public.tarif_id_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    idzone character varying(5) NOT NULL,
    idtypemarchandise character varying(4) NOT NULL,
    idtypewagon character varying(5) NOT NULL,
    prixkg integer,
    CONSTRAINT tarif_pkey PRIMARY KEY (idtarifmarchandise),
    CONSTRAINT unique_tarif UNIQUE (idzone, idtypemarchandise, idtypewagon),
    CONSTRAINT fk_tarif_zone FOREIGN KEY (idzone) REFERENCES public.zonedestination(idzone),
    CONSTRAINT fk_tarif_marchandise FOREIGN KEY (idtypemarchandise) REFERENCES public.typemarchandise(idtypemarchandise),
    CONSTRAINT fk_tarif_train FOREIGN KEY (idtypewagon) REFERENCES public.typewagon(idtypewagon)
);

CREATE TABLE public.tariffuneraire (
    idtariffuneraire character varying(5) NOT NULL,
    prixfixe integer NOT NULL,
    prixzone integer,
    CONSTRAINT tariffuneraire_pkey PRIMARY KEY (idtariffuneraire)
);


-- ----- Clients et utilisateurs -----
CREATE TABLE public.client (
    idclient character varying(10) DEFAULT ('CLT'::text || lpad((nextval('public.client_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    nomclient character varying(100) NOT NULL,
    sigle character varying(10),
    cin character varying(12),
    telephone character varying(13) NOT NULL,
    adresse character varying(100),
    email character varying(50),
    CONSTRAINT client_pkey PRIMARY KEY (idclient)
);

CREATE TABLE public.usertable (
    iduser character varying(10) DEFAULT ('USER'::text || lpad((nextval('public.user_seq'::regclass))::text, 2, '0'::text)) NOT NULL,
    nomutilisateur character varying(20) NOT NULL,
    typeutilisateur character varying(16) NOT NULL,
    motpasse character varying(255) NOT NULL,
    emailutilisateur character varying(50) NOT NULL,
    statut character varying(10),
    CONSTRAINT usertable_pkey PRIMARY KEY (iduser)
);


-- ----- Factures marchandise -----
CREATE TABLE public.compteur_facture (
    annee integer NOT NULL,
    dernier_numero integer NOT NULL,
    CONSTRAINT compteur_facture_pkey PRIMARY KEY (annee)
);

CREATE TABLE public.facturemarchandise (
    idfacturemarchandise serial NOT NULL,
    numfacturemarchandise character varying(20) NOT NULL,
    datefacturemarchandise date NOT NULL,
    nombrecolistotal integer NOT NULL,
    poidsreeltotal real NOT NULL,
    poidsfacturetotal real NOT NULL,
    piquiremarchandise integer NOT NULL,
    tva real,
    montanthttotal integer NOT NULL,
    montantttc integer NOT NULL,
    idclient character varying(10) NOT NULL,
    iddestination character varying NOT NULL,
    iduser character varying(10),
    CONSTRAINT facture_pkey PRIMARY KEY (idfacturemarchandise),
    CONSTRAINT facture_numfacture_key UNIQUE (numfacturemarchandise),
    CONSTRAINT fk_facture_client FOREIGN KEY (idclient) REFERENCES public.client(idclient),
    CONSTRAINT fk_facture_destination FOREIGN KEY (iddestination) REFERENCES public.destination(iddestination)
);
ALTER SEQUENCE public.facturemarchandise_idfacturemarchandise_seq RENAME TO facture_idfacture_seq;

CREATE TABLE public.detailfacture (
    iddetailfacture serial NOT NULL,
    nombrecolis integer NOT NULL,
    poidsreel real NOT NULL,
    poidsfacture real,
    prixapplicable integer,
    montantht real NOT NULL,
    idtarifmarchandise character varying(5) NOT NULL,
    idfacturemarchandise integer NOT NULL,
    idmarchandise integer NOT NULL,
    idwagon integer,
    CONSTRAINT detailfacture_pkey PRIMARY KEY (iddetailfacture),
    CONSTRAINT fk_detail_facture FOREIGN KEY (idfacturemarchandise) REFERENCES public.facturemarchandise(idfacturemarchandise),
    CONSTRAINT fk_detail_tarif FOREIGN KEY (idtarifmarchandise) REFERENCES public.tarifmarchandise(idtarifmarchandise),
    CONSTRAINT fk_detailfacture_marchandise FOREIGN KEY (idmarchandise) REFERENCES public.marchandise(idmarchandise),
    CONSTRAINT fk_detailfacture_train FOREIGN KEY (idwagon) REFERENCES public.wagon(idwagon)
);


-- ----- Factures funéraires -----
CREATE TABLE public.compteur_facture_funeraire (
    annee integer NOT NULL,
    dernier_numero integer NOT NULL,
    CONSTRAINT compteur_facture_funeraire_pkey PRIMARY KEY (annee)
);

CREATE TABLE public.facturefuneraire (
    idfacturefuneraire serial NOT NULL,
    numfacturefuneraire character varying(20),
    datefacturefuneraire date,
    piquirefuneraire integer,
    montanthttfuneraire real,
    montantttcfunerare real,
    nomdefunt character varying(50),
    idclient character varying(10),
    iddestination character varying(10),
    iduser character varying(10),
    CONSTRAINT facturefuneraire_pkey PRIMARY KEY (idfacturefuneraire),
    CONSTRAINT facturefuneraire_numfacturefuneraire_key UNIQUE (numfacturefuneraire),
    CONSTRAINT fk_client_funaire FOREIGN KEY (idclient) REFERENCES public.client(idclient),
    CONSTRAINT fk_destination_funaire FOREIGN KEY (iddestination) REFERENCES public.destination(iddestination),
    CONSTRAINT fk_user_funaire FOREIGN KEY (iduser) REFERENCES public.usertable(iduser)
);


-- ----- Numéro automatique des factures funéraires : 001/05-01-2027/F -----
CREATE FUNCTION public.generer_num_facture_funeraire() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_date   DATE;
    v_annee  INTEGER;
    v_numero INTEGER;
BEGIN
    v_date := COALESCE(NEW.datefacturefuneraire, CURRENT_DATE);
    NEW.datefacturefuneraire := v_date;
    v_annee := EXTRACT(YEAR FROM v_date);

    INSERT INTO compteur_facture_funeraire (annee, dernier_numero)
    VALUES (v_annee, 0)
    ON CONFLICT (annee) DO NOTHING;

    SELECT dernier_numero INTO v_numero
    FROM compteur_facture_funeraire
    WHERE annee = v_annee
    FOR UPDATE;

    v_numero := v_numero + 1;

    UPDATE compteur_facture_funeraire
    SET dernier_numero = v_numero
    WHERE annee = v_annee;

    NEW.numfacturefuneraire := LPAD(v_numero::TEXT, 3, '0')
                               || '/' || TO_CHAR(v_date, 'DD-MM-YYYY')
                               || '/F';
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generer_num_facture_funeraire
    BEFORE INSERT ON public.facturefuneraire
    FOR EACH ROW EXECUTE FUNCTION public.generer_num_facture_funeraire();


-- ----- Numéro automatique des factures marchandise : 001/05-01-2027 -----
-- (la fonction est écrite par 1_amelioration_base.sql ; ici on crée une version vide
--  pour pouvoir brancher le trigger)
CREATE FUNCTION public.generer_num_facture() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN NEW; END; $$;

CREATE TRIGGER trg_generer_num_facture
    BEFORE INSERT ON public.facturemarchandise
    FOR EACH ROW EXECUTE FUNCTION public.generer_num_facture();
