const {
  app_title: title,
  acclab_suites,
  own_app_url,
  page_content_limit,
} = include("config/");

exports.pagemetadata = (_kwargs) => {
  let {
    page,
    pagecount,
    page_content_limit,
    req,
    res,
  } = _kwargs || {};
  let { headers, path, params, query, session } = req || {};

  const currentpage_url = `${req.protocol}://${req.get("host")}${
    req.originalUrl
  }`;

  const parsedQuery = {};
  for (let key in query) {
    if (key === "search") {
      if (query[key].trim().length) parsedQuery[key] = query[key];
    } else {
      if (!Array.isArray(query[key])) parsedQuery[key] = [query[key]];
      else parsedQuery[key] = query[key];
    }
  }

  const obj = {};
  obj.metadata = {
    site: {
      title,
      own_app_url,
      acclab_suites,
    },
    page: {
      title,
      id: page ?? undefined,
      count: pagecount ?? null,
      path,
      referer: headers.referer || null,
      currentpage_url,
      originalUrl: req.originalUrl,
      query: parsedQuery,
      page_content_limit,

    },
  };
  return obj;
};
