// Check if the URL already exists in the database
const checkUrlQuery = url => ({
    text: 'SELECT * FROM articles WHERE url = $1',
    values: [url],
  });

const saveQuery = (url, countryName, languageName, title, postedDate, content, article_type, posted_date_str, html_content) =>   ({
text: `
    INSERT INTO articles (url, country, language, title, posted_date, content, article_type, posted_date_str, all_html_content)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
`,
values: [url, countryName, languageName, title, postedDate, content, article_type, posted_date_str, html_content],
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

module.exports = { 
    checkUrlQuery,
    saveQuery,
    saveAsArrayQuery,
    saveHrefLinks,
};