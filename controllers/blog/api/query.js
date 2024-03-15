const { sqlregex } = include("middleware/search");

const theWhereClause = (country, type, language, iso3) => {
  let whereClause = "";
  if (country) {
    if (Array.isArray(country) && country.length ) {
      whereClause += ` AND iso3 IN ('${country.join("','")}')`;
    } else if (typeof country === "string") {
      whereClause += ` AND iso3 = '${country}'`;
    }
  }

  if (type) {
    if (Array.isArray(type) && type.length ) {
      whereClause += ` AND article_type IN ('${type.join("','")}')`;
    } else if (typeof type === "string") {
      whereClause += ` AND article_type = '${type}'`;
    }
  }

  if (language) {
    if (Array.isArray(language) && language.length) {
      whereClause += ` AND language IN ('${language.join("','")}')`;
    } else if (typeof language === "string") {
      whereClause += ` AND language = '${language}'`;
    }
  }

  if(iso3 && iso3.length && Array.isArray(iso3)){
    whereClause += ` AND iso3 IN ('${iso3.join("','")}')`;
  }

  whereClause += ` AND article_type != 'toolkit' AND relevance > 1`;
  
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
        OR b.content ~* '\\m${search}\\M'
        OR c.html_content ~* '\\m${search}\\M')
    `;
  }
  return searchTextCondition;
};

exports.searchBlogQuery = (
  searchText,
  page,
  country,
  type,
  page_content_limit,
  language,
  iso3
) => {
  let whereClause = theWhereClause(country, type, language, iso3);
  let values = [page_content_limit, (page - 1) * page_content_limit, +page];

  let searchTextCondition = searchTextConditionFn(searchText);
  let textColumn = "COALESCE(b.content, c.html_content)";

  return {
    text: `
      WITH search_results AS (
        SELECT a.url, a.article_type, a.title, a.iso3, a.posted_date, a.posted_date_str, a.parsed_date, a.language, a.created_at,
          regexp_replace(${textColumn}, E'\\n', ' ', 'g') AS content
        FROM articles a
        JOIN article_content b ON b.article_id = a.id 
        JOIN article_html_content c ON c.article_id = a.id
        WHERE TRUE
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
        WHERE TRUE
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

exports.articleGroup = (searchText, country, type, language, iso3) => {
  let whereClause = theWhereClause(country, type, language, iso3);
  let searchTextCondition = searchTextConditionFn(searchText);

  return {
    text: `
      SELECT article_type, COUNT(*) AS recordCount
      FROM articles a
      JOIN article_content b ON b.article_id = a.id 
      JOIN article_html_content c ON c.article_id = a.id
      WHERE TRUE
        ${searchTextCondition}
        ${whereClause}
      GROUP BY article_type;
    `,
  };
};

exports.languageGroup = (searchText, country, type, language, iso3) => {
  let whereClause = theWhereClause(country, type, language, iso3);
  let searchTextCondition = searchTextConditionFn(searchText);

  return {
    text: `
    SELECT a.language AS iso_lang, iso_languages.Name AS lang, COUNT(*) AS recordCount
    FROM articles a
    JOIN article_content b ON b.article_id = a.id 
    JOIN article_html_content c ON c.article_id = a.id
    JOIN iso_languages ON a.language = iso_languages.Set1
    WHERE TRUE
    ${searchTextCondition}
    ${whereClause}
    GROUP BY a.language, iso_languages.Name;   
    `,
  };
};

exports.countryGroup = (searchText, country, type, language, iso3) => {
  let whereClause = theWhereClause(country, type, language, iso3);
  let searchTextCondition = searchTextConditionFn(searchText);

  return {
    text: `
      SELECT a.iso3, COUNT(*) AS recordCount
      FROM articles a
      JOIN article_content b ON b.article_id = a.id 
      JOIN article_html_content c ON c.article_id = a.id
      WHERE TRUE
        ${searchTextCondition}
        ${whereClause}
      GROUP BY iso3;
    `,
  };
};

exports.statsQuery = (searchText, country, type, language, iso3) => {
  let whereClause = theWhereClause(country, type, language, iso3);
  let searchTextCondition = searchTextConditionFn(searchText);

  return {
    text: `
        WITH search_results AS (
          SELECT a.url, a.article_type, a.title, a.posted_date, a.posted_date_str, a.created_at, a.iso3
          FROM articles a
          JOIN article_content b ON b.article_id = a.id 
          JOIN article_html_content c ON c.article_id = a.id
          WHERE TRUE
            ${searchTextCondition}
            ${whereClause}
        ),
        total_country_count AS (
          SELECT iso3, COUNT(*) AS count
          FROM search_results
          GROUP BY iso3
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
          (SELECT COUNT(DISTINCT iso3) FROM total_country_count) AS distinct_country_count,
          (SELECT count FROM total_null_country_count) AS null_country_count,
          (SELECT COUNT(DISTINCT article_type) FROM total_article_type_count) AS distinct_article_type_count,
          (SELECT total_records FROM total_count) AS total_records;
      `,
  };
};

exports.extractGeoQuery = (searchText, country, type, language, iso3) => {
  let whereClause = theWhereClause(country, type, language, iso3);
  let searchTextCondition = searchTextConditionFn(searchText);

  return {
    text: `
        WITH search_results AS (
          SELECT lat, lng, url, iso3
          FROM articles a
          JOIN article_content b ON b.article_id = a.id 
          JOIN article_html_content c ON c.article_id = a.id
          WHERE TRUE
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
          SELECT c.iso3 AS cid, ST_Point(c.lng, c.lat) AS geo
          FROM search_results c
        ) AS clusters
        GROUP BY clusters.cid
        ORDER BY clusters.cid;
      `,
  };
};
