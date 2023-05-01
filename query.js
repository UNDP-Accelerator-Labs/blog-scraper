// Check if the URL already exists in the database
const checkUrlQuery = url => ({
    text: 'SELECT * FROM articles WHERE url = $1',
    values: [url],
  });

const saveQuery = (url, countryName, languageName, title, postedDate, content, article_type, posted_date_str) =>   ({
text: `
    INSERT INTO articles (url, country, language, title, posted_date, content, article_type, posted_date_str)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`,
values: [url, countryName, languageName, title, postedDate, content, article_type, posted_date_str],
});

const saveAsArrayQuery = articles => ({
text: `
    INSERT INTO articles (url, country, language, title, posted_date, content, article_type)
    VALUES ${articles.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',')}
`,
values: articles.flat(),
});

module.exports = { 
    checkUrlQuery,
    saveQuery,
    saveAsArrayQuery
};