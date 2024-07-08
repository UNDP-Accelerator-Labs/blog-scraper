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
      --  a.article_type != 'blog'
      --  AND a.article_type != 'webpage'
      --  AND a.article_type != 'project'
      --  AND a.article_type != 'stories'
      --  AND a.article_type != 'news'
       a.article_type != 'document'
	  AND a.article_type != 'publications'
      --  AND a.article_type != 'press release'
      --  AND d.raw_html IS NOT NULL
      --  AND 
      AND a.created_at >= CURRENT_DATE - INTERVAL '180 day'
      AND a.relevance > 1
      -- AND a.url = 'https://www.undp.org/libya/projects/development-juvenile-system'
      ORDER BY a.id DESC
      -- OFFSET 2
      -- LIMIT 10
      ;      
      `
    );

    for (const bg of blogs) {
      const $ = cheerio.load(bg.raw_html);
    //   if ($("article").length > 0) {
        $("section.featured-stories.recent-news.featured-card-container").remove();
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

      let mainContent = ["blog", "publications"].includes(bg.article_type) || $("body article").length > 0
        ? $("body article").text().trim()
        : $("body").text().trim();

        console.log('main ', bg.url, )
        await DB.blog.tx(async (t) => {
          await t.any(
            `
            UPDATE article_content
            SET 
                content = $1
            WHERE article_id = $2
          `,
            [mainContent, bg.id]
          );

          await t.any(
            `
            UPDATE article_html_content
            SET 
                html_content = $1
            WHERE article_id = $2
          `,
            [mainContent, bg.id]
          );
        })
        .then(()=>{
            console.log("Successfully updated content");
        })
        .catch(e => console.log(e));

    //   }
    }
  } catch (err) {
    console.log("Error occurred: ", err);
  }
})();
