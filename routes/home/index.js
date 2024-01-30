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

  res.render(
    "home/",
    Object.assign(metadata, {
      stats: stats?.stats,
      countries: filters?.countries,
      articletype: filters?.articleType,
    })
  );
};
