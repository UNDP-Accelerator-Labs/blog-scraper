// Check if the URL already exists in the database
const checkUrlQuery = url => ({
    text: 'SELECT * FROM articles WHERE url = $1',
    values: [url],
  });

const saveQuery = (url, countryName, languageName, title, postedDate, content, article_type, posted_date_str, html_content, raw_html) =>   ({
text: `
    INSERT INTO articles (url, country, language, title, posted_date, content, article_type, posted_date_str, all_html_content, raw_html)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
`,
values: [url, countryName, languageName, title, postedDate, content, article_type, posted_date_str, html_content, raw_html],
});

const saveAsArrayQuery = articles => ({
text: `
    INSERT INTO articles (url, country, language, title, posted_date, content, article_type)
    VALUES ${articles.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',')}
`,
values: articles.flat(),
});

const saveHrefLinks = (arrObj) => {
    const values = arrObj.map(obj => `(${obj.article_id}, '${obj.href}', '${obj.linktext}')`).join(',');
    const query = `INSERT INTO public.links (article_id, href, linktext) VALUES ${values};`;
    return query;
  }


const getAllBlogs = () =>({
  text: 'SELECT id, url FROM articles'
})

const updateQuery = (id, url, countryName, languageName, title, postedDate, content, article_type, posted_date_str, html_content, raw_html) => ({
  text: `
      UPDATE articles
      SET url = $2, country = $3, language = $4, title = $5, posted_date = $6, content = $7, article_type = $8, posted_date_str = $9, all_html_content = $10, raw_html = $11
      WHERE id = $1
      RETURNING *
  `,
  values: [id, url, countryName, languageName, title, postedDate, content, article_type, posted_date_str, html_content, raw_html],
});



module.exports = { 
    checkUrlQuery,
    saveQuery,
    saveAsArrayQuery,
    saveHrefLinks,

    getAllBlogs,
    updateQuery,
};