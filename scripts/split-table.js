require("dotenv").config();
const { DB } = require("../db");

const app = async () => {
  await DB.blog
    .tx(async (t) => {
      const batch = [];
      // CREATE TABLES
      batch.push(
        t.any(`
        CREATE TABLE IF NOT EXISTS article_content (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id),
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      );

      batch.push(
        t.any(`
        CREATE TABLE IF NOT EXISTS article_html_content (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id),
            html_content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      );

      batch.push(
        t.any(`
        CREATE TABLE IF NOT EXISTS raw_html (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id),
            raw_html TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      );

      // INSERT INTO TABLES
      batch.push(
        t.any(`
            INSERT INTO article_content (article_id, content)
            SELECT id, content FROM articles;
      `)
      );

      batch.push(
        t.any(`
        INSERT INTO article_html_content (article_id, html_content)
        SELECT id, all_html_content FROM articles;
      `)
      );

      batch.push(
        t.any(`
        INSERT INTO raw_html (article_id, raw_html)
        SELECT id, raw_html FROM articles;
      `)
      );

      // DROP THE COLUMNS --DO NOT DROP THE TABLES FOR NOW UNTIL WE ARE SURE THERE ARE NO BREAKING CHANGES.
    //   batch.push(
    //     t.any(`
    //     ALTER TABLE articles DROP COLUMN content, 
    //     DROP COLUMN all_html_content, 
    //     DROP COLUMN raw_html, 
    //     DROP COLUMN country;
    //   `)
    //   );

      return t.batch(batch).catch((err) => console.log(err));
    })
    .then(async () => console.log('Successful'))
    .catch((err) => console.log('Error occurred: ', err));
};

app()