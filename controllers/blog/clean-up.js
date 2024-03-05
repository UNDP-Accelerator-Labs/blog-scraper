require("dotenv").config();
const { checkSearchTerm, getDocumentMeta } = include("services/");
const cheerio = require("cheerio");

let t_non_relevance = 0;
const cleanup = async (conn, req, res) => {
  const { limit, offset } = req.query;

  if (!limit || !offset || isNaN(limit) || isNaN(offset))
    return res.send("Please provide valid offset and limit value");
  else res.send("Update started!");
  try {
    await conn.tx(async (t) => {
      const blogs = await t.any(
        `
          SELECT id, url, title, country, raw_html, article_type, language, all_html_content
          FROM articles
          WHERE country != 'Accelerator Labs'
          ORDER BY id DESC
          LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      for (bg of blogs) {
        if (
          [
            "blog",
            "events",
            "news",
            "press-releases",
            "speeches",
            "stories",
          ].includes(bg.article_type)
        ) {
          const $ = cheerio.load(bg.raw_html);
          $(
            "section.featured-stories.recent-news.featured-card-container"
          ).replaceWith("");
          const mainContent = $("article").text();

          await matched(mainContent, t, bg);
        } else if (["publications", "document"].includes(bg.article_type)) {
          await matched(bg.all_html_content, t, bg);
        } else if (bg.article_type == "webpage") {
          const $ = cheerio.load(bg.raw_html);
          $("footer").replaceWith("");
          $("header").replaceWith("");
          const mainContent = $("body").text();

          await matched(mainContent, t, bg);
        }
      }
    });

    console.log("All articles has been successfully updated");
    console.log(
      "Record update completed with non relevance of ",
      t_non_relevance
    );
  } catch (error) {
    console.log(error);
  }
};

module.exports = cleanup;

async function matched(mainContent, t, bg) {
  let relevance = 0;
  let unrecognize_col = null;

  if (checkSearchTerm(mainContent).length) {
    relevance = 2;
  } else {
    relevance = 1;
    t_non_relevance++;
    console.log("Content is not relevant to search terms", bg.url);
  }

  const [lang, location, meta] = await getDocumentMeta(bg.all_html_content);
  const iso3 = location?.location?.country;
  const language = lang?.lang;

  if (!iso3) unrecognize_col = "iso3";
  if (!language) unrecognize_col = "language";

  await t.any(
    `
      UPDATE articles
      SET 
          language = $1, relevance = $4,
          content = CASE
              WHEN content IS NULL AND $3 IS NOT NULL THEN $3
              ELSE content
          END,
          iso3 = CASE
              WHEN $2 IS NOT NULL THEN $2
              ELSE iso3
          END
        WHERE id = $5
      `,
    [language, iso3, mainContent, relevance, bg.id]
  );

  if (unrecognize_col) {
    await t.any(
      `
        INSERT INTO nlp_fallback
        (article_id, col)
        VALUES ($1, $2)
        `,
      [bg.id, unrecognize_col]
    );
  }
}
