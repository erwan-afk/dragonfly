-- Création des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Création d'un utilisateur avec les permissions nécessaires
-- (optionnel si l'utilisateur existe déjà)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'postgres') THEN
        CREATE USER postgres WITH PASSWORD 'Ywars.ollo6255';
    END IF;
END
$$;

-- S'assurer que l'utilisateur a les bonnes permissions
GRANT ALL PRIVILEGES ON DATABASE "default" TO postgres;

-- Création du schéma public s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS public;

-- Permissions sur le schéma
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public; 