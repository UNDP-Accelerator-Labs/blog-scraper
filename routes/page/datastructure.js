const {
  app_title: title,
  acclab_suites,
  own_app_url,
  sso_app_url,
  page_content_limit,
} = include("config/");

function compareReqDomain(req, page_url, domain) {
  const referrer = req.get("Referer");
  const referrerUrl = new URL(referrer, page_url);
  return referrerUrl.origin === domain;
}

exports.pagemetadata = (_kwargs) => {
  let { page, pagecount, page_content_limit, req, res } = _kwargs || {};
  let { headers, path, params, query, session } = req || {};

  const currentpage_url = `${req.protocol}://${req.get("host")}${
    req.originalUrl
  }`;

  if (session.uuid) {
    // USER IS LOGGED IN
    var { uuid, username: name, country, rights, sessions } = session || {};
  } else {
    // PUBLIC/ NO SESSION
    var {
      uuid,
      username: name,
      country,
      rights,
    } = this.sessiondata({ public: true }) || {};
  }

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
      login_url: !compareReqDomain(req, currentpage_url, sso_app_url)
        ? `${sso_app_url}?redirect_url=${encodeURIComponent(sso_app_url)}`
        : null,
    },
    user: {
      uuid,
      name,
      country,
      rights,
      sessions,
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

exports.sessiondata = (_data) => {
  let {
    uuid,
    name,
    email,
    team,
    collaborators,
    rights,
    public,
    language,
    iso3,
    countryname,
    bureau,
    lng,
    lat,
    device,
    is_trusted,
  } = _data || {};

  // GENERIC session INFO
  const obj = {};
  obj.uuid = uuid || null;
  obj.username = name || "Anonymous user";
  obj.email = email || null;
  obj.team = team || null;
  obj.collaborators = collaborators || [];
  obj.rights = rights ?? 0;
  obj.public = public || false;
  obj.language = language || "en";
  obj.country = {
    iso3: iso3 || "NUL",
    name: countryname || "Null Island",
    bureau: bureau,
    lnglat: { lng: lng ?? 0, lat: lat ?? 0 },
  };
  obj.app = title;
  obj.device = device || {};
  obj.is_trusted = is_trusted || false;

  return obj;
};
