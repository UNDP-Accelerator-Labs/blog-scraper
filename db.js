require('dotenv').config();
const { Pool } = require('pg');

// Set up the connection to the database
// const { 
   const DB_USER = 'undpacclab@acclabs';
   const DB_HOST = 'acclabs.postgres.database.azure.com';
   const DB_NAME = 'blogs';
   const DB_PASS = 'acclabsblogs@2023';
   const DB_PORT = '5432';
   const production = false;

   const L_DB_USER ='postgres';
   const L_DB_HOST = 'localhost';
   const L_DB_NAME ='acclab_website_extract';
   const L_DB_PASS ='     ';
// } = process.env;

console.log('production',production, DB_USER  )

const pool = new Pool({
  user:  L_DB_USER,
  host: L_DB_HOST,
  database: L_DB_NAME,
  password:  L_DB_PASS,
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