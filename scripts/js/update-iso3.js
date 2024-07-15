require("dotenv").config();
const { DB } = require("../../db");
const { getIso3 } = require("../../services/utils");

(async () => {
  try {
    const blogs = await DB.blog.any(
      `
      SELECT id, url, relevance
      FROM articles
      WHERE 
      created_at >= CURRENT_DATE - INTERVAL '40 day'
      AND relevance > 1
      ORDER BY id DESC
      ;      
      `
    );

    for (const bg of blogs) {
      const iso3 = await getIso3(bg.url);

      if (iso3) {
        await DB.blog
          .tx(async (t) => {
            await t.any(
              `
            UPDATE articles
            SET 
                iso3 = $1
            WHERE id = $2
          `,
              [iso3, bg.id]
            );
          })
          .then(() => {
            console.log("Successfully updated iso3");
          })
          .catch((e) => console.log(e));
      }
    }
  } catch (err) {
    console.log("Error occurred: ", err);
  }
})();
