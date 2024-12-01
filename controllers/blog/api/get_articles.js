const { DB } = include("db/");

exports.get_articles = async (req, res) => {
  const { id, url, pinboard } = req.query;

  // Normalize `id` and `url` into arrays
  let idList = id ? (Array.isArray(id) ? id : [id]).map(Number) : [];
  let urlList = url ? (Array.isArray(url) ? url : [url]) : [];

  if (pinboard && +pinboard) {
    idList = await DB.general.any(
      `
      SELECT a.pad FROM pinboard_contributions a
      JOIN pinboards b
      ON a.pinboard = b.id
      WHERE b.id = $1
      AND a.db = 5
      `,
      [pinboard]
    );

    idList = idList.map((row) => row.pad);
  }

  // Ensure at least one of `id` or `url` is provided
  if (
    (!id || (Array.isArray(id) && id.length === 0)) &&
    (!url || (Array.isArray(url) && url.length === 0)) &&
    idList.length === 0 &&
    urlList.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "At least one 'id' or 'url' must be provided." });
  }

  try {
    const results = await DB.blog.any(
      `
      SELECT a.id, a.url, a.article_type, a.title, a.iso3, a.posted_date, a.posted_date_str, a.parsed_date, a.language, a.created_at, c.html_content,
          regexp_replace(
              regexp_replace(COALESCE(b.content, c.html_content), E'\\n', ' ', 'g'),
              E'<iframe[^>]*>.*?</iframe>',
              '',
              'gi'
          ) AS content
      FROM articles a
      JOIN article_content b ON b.article_id = a.id 
      JOIN article_html_content c ON c.article_id = a.id
      WHERE (array_length($1::int[], 1) > 0 AND a.id = ANY ($1::int[]))
         OR (array_length($2::text[], 1) > 0 AND a.url = ANY ($2::text[]))
      `,
      [idList, urlList]
    );

    return res.status(200).json(results);
  } catch (err) {
    console.error("Database query failed:", err);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};
