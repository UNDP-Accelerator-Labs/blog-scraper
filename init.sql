CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE,
    country TEXT,
    language TEXT,
    title TEXT,
    posted_date DATE,
    posted_date_str VARCHAR(50),
    content TEXT,
    article_type TEXT,
    all_html_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE

)

 CREATE TABLE IF NOT EXISTS public.links (
        id SERIAL PRIMARY KEY,
        article_id integer NOT NULL,
        href text NULL COLLATE pg_catalog."default",
        linktext text NULL COLLATE pg_catalog."default",
        CONSTRAINT links_article_id_fkey FOREIGN KEY (article_id)
        REFERENCES articles (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

ALTER TABLE articles ADD COLUMN IF NOT EXISTS raw_html TEXT;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS iso3 VARCHAR (3);

ALTER TABLE articles ADD COLUMN IF NOT EXISTS has_lab BOOLEAN;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS lat FLOAT, ADD COLUMN IF NOT EXISTS lng FLOAT;

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE articles
ADD COLUMN privilege INT DEFAULT 1,
ADD COLUMN rights INT DEFAULT 1,
ADD CONSTRAINT unique_url UNIQUE (url),
ADD COLUMN tags TEXT[];
--  privilege 2 - private document
--  privilege 3 - confidential document

