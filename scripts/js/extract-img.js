require("dotenv").config();
const cheerio = require("cheerio");
const { DB } = require("../../db");

(async () => {
  try {
    const blogs = await DB.blog.any(
      `
      SELECT a.id, a.url, a.title, d.raw_html, a.article_type, a.language, c.html_content as all_html_content
      FROM articles a
      JOIN article_content b ON b.article_id = a.id 
      JOIN article_html_content c ON c.article_id = a.id
      JOIN raw_html d ON d.article_id = a.id
      WHERE 
       a.article_type = 'event'
       OR a.article_type = 'stories'
       OR a.article_type = 'news'
      AND a.relevance > 1
      ORDER BY a.id DESC
      -- OFFSET 2
      -- LIMIT 10
      ;      
      `
    );

    for (const bg of blogs) {
      const $ = cheerio.load(bg.raw_html);

      $(
        "section.featured-stories.recent-news.featured-card-container"
      ).remove();
      $("div.country-switcher-ajax-wrapper").remove();
      $("div.related-publications").remove();
      $("header, footer, script, style, meta, iframe").remove();
      $("body")
        .find("header, footer, script, style, meta, iframe, noscript")
        .replaceWith(" ");
      $("body")
        .find("div.dialog-off-canvas-main-canvas.layout-container")
        .replaceWith(" ");
      $("body")
        .find("div.dialog-off-canvas-main-canvas.mega-wrapper")
        .replaceWith(" ");
      $("body")
        .find("div.dialog-off-canvas-main-canvas.footer")
        .replaceWith(" ");
      $("body").find("a.skip-link").replaceWith(" ");
      $("body footer").replaceWith(" ");

      let firstImageSrc;

      if (
        ["blog", "publications"].includes(bg.article_type) ||
        $("body article").length > 0
      ) {
        firstImageSrc = $("body article img").first().attr("src");

        if (!isValidUrl(firstImageSrc) && firstImageSrc != undefined) {
          firstImageSrc = `https://undp.org${firstImageSrc}`;
          if (!isValidUrl(firstImageSrc)) {
            firstImageSrc = null;
            console.log("No image found.");
          }
        }
      } else {
        firstImageSrc = $("body img").first().attr("src");

        if (!isValidUrl(firstImageSrc) && firstImageSrc != undefined) {
          firstImageSrc = `https://undp.org${firstImageSrc}`;
          if (!isValidUrl(firstImageSrc)) {
            firstImageSrc = null;
            console.log("No image found.");
          }
        }
      }

      if (firstImageSrc && firstImageSrc != undefined) {
        console.log("main ", bg.url, firstImageSrc);
        await DB.blog
          .tx(async (t) => {
            await t.any(
              `
            UPDATE articles
            SET 
                img = $1
            WHERE id = $2
          `,
              [firstImageSrc, bg.id]
            );
          })
          .then(() => {
            console.log("Successfully updated content");
          })
          .catch((e) => console.log(e));
      }
    }
  } catch (err) {
    console.log("Error occurred: ", err);
  }
})();

// Check if the URL is valid and modify if necessary
const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};
