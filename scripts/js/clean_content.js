require("dotenv").config();
const { DB } = require("../../db");

(async () => {
  try {
    const blogs = await DB.blog.any(
      `
      SELECT a.id, a.url, b.content
        FROM articles a
        JOIN article_content b ON b.article_id = a.id 
        JOIN article_html_content c ON c.article_id = a.id
        JOIN raw_html d ON d.article_id = a.id
        WHERE a.relevance > 1
        AND (
            b.content LIKE '%Skip to main content%'
            OR b.content LIKE '%<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PHKHS2Q" height="0" width="0" style="display:none;visibility:hidden"></iframe>%'
        )
        ORDER BY a.id DESC
        LIMIT 2
        ;   
      `
    );

    for (const bg of blogs) {
      // Remove "Skip to main content"
      content = bg.content.replace(/Skip to main content/g, '');

      // Remove the specific iframe
      content = bg.content.replace(/<iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-PHKHS2Q" height="0" width="0" style="display:none;visibility:hidden"><\/iframe>/g, '');


        console.log('main ', bg.url, )
        // console.log('main ', content)
        await DB.blog.tx(async (t) => {
          await t.any(
            `
            UPDATE article_content
            SET 
                content = $1
            WHERE article_id = $2
          `,
            [content, bg.id]
          );

          await t.any(
            `
            UPDATE article_html_content
            SET 
                html_content = $1
            WHERE article_id = $2
          `,
            [content, bg.id]
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
