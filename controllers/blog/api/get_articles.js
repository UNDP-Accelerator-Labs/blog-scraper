const { DB } = include("db/");

exports.get_articles = async (req, res) => {
  const { id, url, pinboard, page, limit } = req.query;

  // Normalize `id` and `url` into arrays
  let idList = id ? (Array.isArray(id) ? id : [id]).map(Number) : [];
  let urlList = url ? (Array.isArray(url) ? url : [url]) : [];
  let pagination = {};
  let totalRecords = 0;

  if (pinboard && +pinboard) {
    // Handle pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * pageLimit;

    pagination = { limit: pageLimit, offset };

    // Fetch total count of records
    totalRecords = await DB.general
      .one(
        `
      SELECT COUNT(*) AS total
      FROM pinboard_contributions a
      JOIN pinboards b
      ON a.pinboard = b.id
      WHERE b.id = $1 AND a.db = 5
      `,
        [pinboard]
      )
      .then((row) => parseInt(row.total, 10));

    if (!totalRecords)
      return res
        .status(200)
        .json({ message: "No related articles found", data: [] });

    idList = await DB.general.any(
      `
      SELECT a.pad FROM pinboard_contributions a
      JOIN pinboards b
      ON a.pinboard = b.id
      WHERE b.id = $1
      AND a.db = 5
      ${limit ? `LIMIT $2 OFFSET $3` : ""}
      `,
      limit ? [pinboard, pageLimit, offset] : [pinboard]
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
      LEFT JOIN article_content b ON b.article_id = a.id 
      LEFT JOIN article_html_content c ON c.article_id = a.id
      WHERE (array_length($1::int[], 1) > 0 AND a.id = ANY ($1::int[]))
        
      `,
      [idList, urlList]
    );
    // Extract IDs from the first query results
    const articleIds = results.map((item) => item.id);

    // Fetch related data using the extracted IDs
    const relatedData = await DB.general.any(
      `
      SELECT id as pinboard_id, title, b.pad as article_id
      FROM pinboards a
      JOIN pinboard_contributions b ON b.pinboard = a.id
      WHERE b.pad = ANY ($1::int[])
        AND a.status >= 1
      `,
      [articleIds]
    );

    // Merge the related data into the first query results
    const mergedResults = results.map((item) => {
      // Find matching related data by article_id
      const relatedItems = relatedData.filter(
        (rel) => rel.article_id === item.id
      );
      return {
        totalRecords: totalRecords ? totalRecords : results?.length,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : results?.length,
        ...item,
        pinboards: relatedItems,
      };
    });

    // HACK: DELETE FROM PINBOARD TABLE IDS THAT DOES NOT EXIST IN BLOG DB
    // if (pinboard && idList && idList.length > articleIds.length) {
    //   const unrelatedIds = idList.filter((item) => !articleIds.includes(item));
    //   if (unrelatedIds.length) {
    //     await DB.general.any(
    //       `
    //       DELETE FROM pinboard_contributions a
    //       WHERE a.pinboard = $1
    //       AND a.pad = ANY ($2::int[])
    //       AND a.db = 5
    //       `,
    //       [pinboard, unrelatedIds]
    //     );
    //   }
    // }

    return res.status(200).json(mergedResults);
  } catch (err) {
    console.error("Database query failed:", err);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};
