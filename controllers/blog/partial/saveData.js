const { DB } = include("db/");
const { saveQuery, updateQuery } = require("../scrapper/scrap-query");

const saveDataToDatabase = async (data, id) => {
  if (!data)
    return console.log(
      "Skipping saving record. Content is not relevant to Accelerator lab."
    );
  try {
    await DB.blog.tx(async (t) => {
      const batch = [];

      if (id == null || isNaN(id)) {
        // Insert new record
        const record = await t.oneOrNone(
          saveQuery(
            data.url,
            data.language,
            data.articleTitle,
            data.postedDate,
            data.article_type,
            data.postedDateStr,
            "2",
            data.iso3
          )
        );
        batch.push(
          t.any(
            `
            INSERT INTO article_content (article_id, content)
            VALUES ($1, $2)
          `,
            [record?.id, data.content]
          )
        );

        batch.push(
          t.any(
            `
              INSERT INTO  article_html_content (article_id, html_content)
              VALUES ($1, $2)
          `,
            [record?.id, data.html_content]
          )
        );

        batch.push(
          t.any(
            `
              INSERT INTO  raw_html (article_id, raw_html)
              VALUES ($1, $2)
            `,
            [record?.id, data.raw_html]
          )
        );
      } else {
        // Update existing record
        batch.push(
          t.oneOrNone(
            updateQuery(
              id,
              data.url,
              data.language,
              data.articleTitle,
              data.postedDate,
              data.article_type,
              data.postedDateStr,
              data.iso3 || null,
              "2"
            )
          )
        );

        batch.push(
          t.any(
            `
              UPDATE article_content
              SET content = $2
              WHERE article_id = $1
            `,
            [id, data.content]
          )
        );

        batch.push(
          t.any(
            `
              UPDATE article_html_content
              SET html_content = $2
              WHERE article_id = $1
            `,
            [id, data.html_content]
          )
        );

        batch.push(
          t.any(
            `
              UPDATE raw_html
              SET raw_html = $2
              WHERE article_id = $1
            `,
            [id, data.raw_html]
          )
        );
      }

      return t.batch(batch).catch((err) => console.log(err));
    });
    console.log("Saving record successful.");
  } catch (error) {
    console.error("Error saving data to database:", error);
  }
};

module.exports = saveDataToDatabase;
