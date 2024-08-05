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
  iso3,
  parsed_date
) => ({
  text: `
    INSERT INTO public.articles (url, language, title, posted_date, article_type, posted_date_str, iso3, parsed_date, relevance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
`,
  values: [
    url,
    languageName,
    title,
    postedDate,
    article_type,
    posted_date_str,
    iso3,
    parsed_date,
    relevance,
  ],
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
  iso3,
  relevance
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
        iso3 = $9
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
    a.id, 
    a.url, 
    REPLACE(
        COALESCE(b.content, c.all_html_content),
        E'\n', ' '
    ) AS content,
    a.iso3
FROM articles a
JOIN article_content b ON b.article_id = a.id 
JOIN article_html_content c ON c.article_id = a.id
WHERE created_at >= CURRENT_DATE - INTERVAL '6 day';
`;

module.exports = {
  checkUrlQuery,
  saveQuery,
  saveHrefLinks,

  getAllBlogs,
  updateQuery,

  getDistinctUrls,
  updateDocumentRecord,
  getAllPublicaltions,

  recordSince,
};
