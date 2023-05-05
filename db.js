require('dotenv').config();
const { Pool } = require('pg');

// Set up the connection to the database
const { 
  DB_USER, 
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  production,

  L_DB_USER,
  L_DB_HOST,
  L_DB_NAME,
  L_DB_PASS,
} = process.env;

const pool = new Pool({
 user: production == 'true'   ? DB_USER : L_DB_USER,
 host: production == 'true'   ? DB_HOST : L_DB_HOST,
 database: production == 'true'   ? DB_NAME : L_DB_NAME,
 password: production == 'true'   ? DB_PASS : L_DB_PASS,
 port: DB_PORT, 
});

// Create the table
pool.query(`
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
`).then(res => {
  console.log('Article Table created successfully');

    pool.query(`
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
      `).then(res => {
        console.log('Href Table created successfully');
      }).catch(err => {
        console.error('Error href creating table:', err);
      });

}).catch(err => {
  console.error('Error creating table:', err);
});


module.exports = pool;