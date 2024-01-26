const { pagemetadata, getdata } = require("../page");
const { DB } = include("db");

module.exports = async (req, res) => {
  const { page_content_limit, page } = req.query;
  const _kwarq = {
    page,
    pagecount: page_content_limit,
    page_content_limit,
    req,
    res,
  };
  const metadata = pagemetadata(_kwarq);
  const data = await getdata(DB.blog, req, res);

  const [stats, searchResults, filters] = data || [null, null, null];
  const results = searchResults?.searchResults || []
  const total_pages = results[0]?.total_pages || 0
  const current_page = results[0]?.current_page || 1

  res.render(
    "index",
    Object.assign(metadata, {
      stats: stats?.stats,
      results,
      total_pages,
      current_page,
      countries: filters?.countries,
      articletype: filters?.articleType,
      geodata: filters?.geoData,
    })
  );
};
