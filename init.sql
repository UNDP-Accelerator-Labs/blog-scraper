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

);

 CREATE TABLE IF NOT EXISTS public.links (
        id SERIAL PRIMARY KEY,
        article_id integer NOT NULL,
        href text NULL COLLATE pg_catalog."default",
        linktext text NULL COLLATE pg_catalog."default",
        CONSTRAINT links_article_id_fkey FOREIGN KEY (article_id)
        REFERENCES articles (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

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

ALTER TABLE articles
ADD COLUMN relevance INT DEFAULT 0;


CREATE TABLE IF NOT EXISTS public.nlp_fallback (
    id SERIAL PRIMARY KEY,
    article_id integer NOT NULL,
    col VARCHAR(50),
    CONSTRAINT nlp_article_id_fkey FOREIGN KEY (article_id)
    REFERENCES articles (id) MATCH SIMPLE
);

CREATE TABLE iso_languages (Name VARCHAR(99),Set1 VARCHAR (2),Set2T VARCHAR(3),Set2B VARCHAR (3),Set3 VARCHAR(9),Notes VARCHAR(199));

CREATE TABLE IF NOT EXISTS article_content (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_html_content (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    html_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_html (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    raw_html TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE article_content
ADD CONSTRAINT unique_article_content_id UNIQUE (article_id);

ALTER TABLE article_html_content
ADD CONSTRAINT unique_article_html_content_id UNIQUE (article_id);

ALTER TABLE raw_html
ADD CONSTRAINT unique_raw_html_id UNIQUE (article_id);

ALTER TABLE nlp_fallback
DROP CONSTRAINT nlp_article_id_fkey;

ALTER TABLE nlp_fallback
ADD CONSTRAINT nlp_article_id_fkey FOREIGN KEY (article_id)
REFERENCES articles (id)
ON DELETE CASCADE;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS parsed_date DATE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS img TEXT;