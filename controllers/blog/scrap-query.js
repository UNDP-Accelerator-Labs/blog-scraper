// Check if the URL already exists in the database
const checkUrlQuery = "SELECT * FROM articles WHERE url = $1";

const saveQuery = (
  url,
  languageName,
  title,
  postedDate,
  article_type,
  posted_date_str,
  relevance,
  iso3
) => ({
  text: `
    INSERT INTO articles (url, language, title, posted_date, article_type, posted_date_str, relevance, iso3)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
`,
  values: [
    url,
    languageName,
    title,
    postedDate,
    article_type,
    posted_date_str,
    relevance,
    iso3,
  ],
});

const saveAsArrayQuery = (articles) => ({
  text: `
    INSERT INTO articles (url, country, language, title, posted_date, content, article_type)
    VALUES ${articles.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(",")}
`,
  values: articles.flat(),
});

const saveHrefLinks = (arrObj) => {
  const values = arrObj
    .map((obj) => `(${obj.article_id}, '${obj.href}', '${obj.linktext}')`)
    .join(",");
  const query = `INSERT INTO public.links (article_id, href, linktext) VALUES ${values};`;
  return query;
};

const getAllBlogs = () => ({
  text: `SELECT id, url 
  FROM articles 
  WHERE DATE(updated_at) != CURRENT_DATE 
    AND DATE(created_at) != CURRENT_DATE 
    AND article_type NOT IN ('document')
  ORDER BY id ASC;
  
  `,
});

const getDistinctUrls = (validUrls) => ({
  text: `
    SELECT DISTINCT url
    FROM (
      SELECT unnest($1::text[]) AS url
    ) AS v
    WHERE NOT EXISTS (
      SELECT 1 FROM articles WHERE url LIKE '%' || v.url || '%'
    )
  `,
  values: [validUrls],
});

const updateQuery = (
  id,
  url,
  languageName,
  title,
  postedDate,
  article_type,
  posted_date_str,
  relevance,
  iso3
) => ({
  text: `
      UPDATE articles
      SET url = $2, 
        language = $3, 
        title = $4, 
        posted_date = $5, 
        article_type = $6, 
        posted_date_str = $7, 
        updated_at = now(),
        relevance = $8,
        iso3 = $9,
      WHERE id = $1
      RETURNING *
  `,
  values: [
    id,
    url,
    languageName,
    title,
    postedDate,
    article_type,
    posted_date_str,
    relevance,
    iso3,
  ],
});

const getAllBlogsWithNull = () => ({
  text: `SELECT id, url 
  FROM articles 
  WHERE title IS NULL 
    OR content IS NULL 
    AND DATE(updated_at) != CURRENT_DATE 
  ORDER BY id ASC;
  
  `,
});

const getAllDocument = `
  SELECT id, url, content, country
  FROM articles 
  WHERE article_type != 'document' 
  AND has_lab = true
  AND DATE(updated_at) != CURRENT_DATE 
  ORDER BY id ASC;
  `;

const updateDocumentRecord = `
      UPDATE articles
      SET country = $2, language = $3, lat = $4,
      lng = $5, iso3 = $6, has_lab = $7, updated_at = now()
      WHERE id = $1
  `;

const getAllPublicaltions = `
  SELECT *
  FROM articles
  WHERE article_type = 'publications'
  -- AND created_at < CURRENT_DATE - INTERVAL '10 day' 
  -- AND updated_at < CURRENT_DATE - INTERVAL '10 day'
  ORDER BY id ASC;
`;

const recordSince = `
SELECT 
    id, 
    url, 
    REPLACE(
        COALESCE(content, all_html_content),
        E'\n', ' '
    ) AS content,
    country
FROM articles 
WHERE created_at >= CURRENT_DATE - INTERVAL '6 day';
`;

module.exports = {
  checkUrlQuery,
  saveQuery,
  saveAsArrayQuery,
  saveHrefLinks,

  getAllBlogs,
  getAllBlogsWithNull,
  updateQuery,

  getDistinctUrls,
  getAllDocument,
  updateDocumentRecord,
  getAllPublicaltions,

  recordSince,
};
