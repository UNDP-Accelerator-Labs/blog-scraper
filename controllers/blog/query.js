const { sqlregex } = include("middleware/search");

const theWhereClause = (country, type) => {
  let whereClause = "";

  if (country) {
    if (Array.isArray(country) && country.length > 0) {
      whereClause += ` AND country IN ('${country.join("','")}')`;
    } else if (typeof country === "string") {
      whereClause += ` AND country = '${country}'`;
    }
  }

  if (type) {
    if (Array.isArray(type) && type.length > 0) {
      whereClause += ` AND article_type IN ('${type.join("','")}')`;
    } else if (typeof type === "string") {
      whereClause += ` AND article_type = '${type}'`;
    }
  }

  return whereClause;
};

const searchTextConditionFn = (searchText) => {
  const [search, terms] = sqlregex(searchText);
  let searchTextCondition = "";
  if (
    searchText !== null &&
    searchText !== undefined &&
    searchText.length > 0
  ) {
    searchTextCondition = `
      AND (title ~* '\\m${search}\\M'
        OR content ~* '\\m${search}\\M'
        OR all_html_content ~* '\\m${search}\\M')
    `;
  }
  return searchTextCondition;
};

exports.blogAggQuery = `
    SELECT COUNT(*) AS totalBlogs
    FROM articles
    WHERE has_lab IS TRUE
;`;

exports.totalArticleTyle = `
    SELECT COUNT(DISTINCT article_type) AS totalArticleTypes
    FROM articles;
`;

exports.totalCountries = `
    SELECT COUNT(DISTINCT country) AS totalCountries
    FROM articles WHERE has_lab IS TRUE;
`;

exports.totalUnknownCountries = `
    SELECT COUNT(*) AS totalUnknownCountries
    FROM articles
    WHERE country IS NULL;
`;

exports.searchBlogQuery = (
  searchText,
  page,
  country,
  type,
  page_content_limit
) => {
  let whereClause = theWhereClause(country, type);
  let values = [page_content_limit, (page - 1) * page_content_limit, page];

  let searchTextCondition = searchTextConditionFn(searchText);
  let textColumn = "COALESCE(content, all_html_content)";

  return {
    text: `
      WITH search_results AS (
        SELECT id, url, country, article_type, title, posted_date, posted_date_str, parsed_date, language, created_at,
          regexp_replace(${textColumn}, E'\\n', ' ', 'g') AS content
          -- CASE
          --  WHEN $3 = '' THEN
          --   regexp_replace(
          --     regexp_replace(${textColumn}, E'\\n', ' ', 'g'),
          --     E'\\s+', ' ', 'g'
          --   )
          -- END AS raw_content
        FROM articles
        WHERE has_lab IS TRUE
        ${searchTextCondition}
        ${whereClause}
        ORDER BY 
            CASE
                WHEN posted_date IS NOT NULL THEN posted_date
                WHEN parsed_date IS NOT NULL THEN parsed_date
                ELSE '1970-01-01'
            END DESC
        LIMIT $1 OFFSET $2
      ),
      total_count AS (
        SELECT COUNT(*) AS total_records
        FROM articles
        WHERE has_lab IS TRUE
        ${searchTextCondition}
        ${whereClause}
      )
      SELECT sr.*, tc.total_records, (CEIL(tc.total_records::numeric / $1)) AS total_pages, ${"$3"}  AS current_page
      FROM search_results sr
      CROSS JOIN total_count tc;
    `,
    values,
  };
};

exports.articleGroup = (searchText, country, type) => {
  let whereClause = theWhereClause(country, type);
  let searchTextCondition = searchTextConditionFn(searchText);
  const values = [];

  return {
    text: `
      SELECT article_type, COUNT(*) AS recordCount
      FROM articles
      WHERE has_lab IS TRUE
        ${searchTextCondition}
        ${whereClause}
      GROUP BY article_type;
    `,
    values,
  };
};

exports.countryGroup = (searchText, country, type) => {
  let whereClause = theWhereClause(country, type);
  let searchTextCondition = searchTextConditionFn(searchText);
  const values = [];

  return {
    text: `
      SELECT country, iso3, COUNT(*) AS recordCount
      FROM articles
      WHERE has_lab IS TRUE
        ${searchTextCondition}
        ${whereClause}
      GROUP BY country, iso3;
    `,
    values,
  };
};

exports.statsQuery = (searchText, country, type) => {
  let whereClause = theWhereClause(country, type);
  let searchTextCondition = searchTextConditionFn(searchText);
  const values = [];

  return {
    text: `
        WITH search_results AS (
          SELECT id, url, content, country, article_type, title, posted_date, posted_date_str, created_at, has_lab, iso3
          FROM articles
          WHERE has_lab IS TRUE
            ${searchTextCondition}
            ${whereClause}
        ),
        total_country_count AS (
          SELECT country, COUNT(*) AS count
          FROM search_results
          GROUP BY country
        ),
        total_null_country_count AS (
          SELECT COUNT(*) AS count
          FROM search_results
        ),
        total_article_type_count AS (
          SELECT article_type, COUNT(*) AS count
          FROM search_results
          GROUP BY article_type
        ),
        total_count AS (
          SELECT COUNT(*) AS total_records
          FROM search_results
        )
        SELECT 
          (SELECT COUNT(DISTINCT country) FROM total_country_count) AS distinct_country_count,
          (SELECT count FROM total_null_country_count) AS null_country_count,
          (SELECT COUNT(DISTINCT article_type) FROM total_article_type_count) AS distinct_article_type_count,
          (SELECT total_records FROM total_count) AS total_records;
      `,
    values,
  };
};

exports.extractGeoQuery = (searchText, country, type) => {
  let whereClause = theWhereClause(country, type);
  let searchTextCondition = searchTextConditionFn(searchText);
  const values = [];

  return {
    text: `
        WITH search_results AS (
          SELECT *
          FROM articles
          WHERE has_lab IS TRUE
          ${searchTextCondition}
          ${whereClause}
        )
        SELECT
          jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJson(ST_Centroid(ST_Collect(clusters.geo)))::jsonb,
            'properties', json_build_object(
              'pads', json_agg(clusters.cid),
              'count', COUNT(clusters.cid),
              'cid', clusters.cid
            )::jsonb
          ) AS json
        FROM (
          SELECT c.iso3 AS cid, c.has_lab, ST_Point(c.lng, c.lat) AS geo
          FROM search_results c
        ) AS clusters
        GROUP BY clusters.cid
        ORDER BY clusters.cid;
      `,
    values,
  };
};

const checkRelevance = `
  UPDATE articles
SET has_lab = true
WHERE
    -- English search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'accelerator lab', 'innovation-acclab', 'acclab', 'acceleratorlab', 'AccLabGM'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'accelerator lab', 'innovation-acclab', 'acclab', 'acceleratorlab', 'AccLabGM'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- French search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratoire d''acceleration', 'accelerateur lab', 'laboratoire d''accelerateur', 'laboratoires d''acceleration', 'laboratoires d''accelerateur', 'accelerator lab'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratoire d''acceleration', 'accelerateur lab', 'laboratoire d''accelerateur', 'laboratoires d''acceleration', 'laboratoires d''accelerateur', 'accelerator lab'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Spanish search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratorios de aceleracion', 'laboratorio de aceleracion', 'LabPNUDArg'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratorios de aceleracion', 'laboratorio de aceleracion', 'LabPNUDArg'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Portuguese search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratorios aceleradores', 'laboratorio acelerador', 'acclab', 'Laboratório de Aceleração'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratorios aceleradores', 'laboratorio acelerador', 'acclab', 'Laboratório de Aceleração'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Ukrainian search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'Лабораторії інноваційного розвитку', 'Лабораторія інноваційного розвитку'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'Лабораторії інноваційного розвитку', 'Лабораторія інноваційного розвитку'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Azerbaijani search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'akselerator laboratoriyası'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'akselerator laboratoriyası'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Turkish search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'Hızlandırma laboratuvarı'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'Hızlandırma laboratuvarı'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Serbian search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratorija za ubrzani razvoj'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'laboratorija za ubrzani razvoj'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Uzbek search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'akselerator laboratoriyasi'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'akselerator laboratoriyasi'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    )) OR
    -- Russian search terms
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'Акселератор Лаборатория'
        ]) AS term
        WHERE content ILIKE '%' || term || '%'
    )) OR
    (SELECT EXISTS (
        SELECT 1 FROM unnest(ARRAY[
            'Акселератор Лаборатория'
        ]) AS term
        WHERE all_html_content ILIKE '%' || term || '%'
    ));
`;
