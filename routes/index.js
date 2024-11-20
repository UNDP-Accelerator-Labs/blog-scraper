const {
  browse_data,
  get_blog_stats,
  get_toolkit_data,
  toolkit_scrapper,
  cleanup,
  scrap_medium_posts,
  getWebContent,
  get_ce_rave,
  get_articles,
} = include("/controllers");
if (!exports.api) {
  exports.api = {};
}
if (!exports.cron) {
  exports.cron = {};
}

exports.api.browse_data = browse_data;
exports.api.get_blog_stats = get_blog_stats;

exports.api.get_ce_rave = get_ce_rave;

exports.api.get_toolkit_data = get_toolkit_data;

exports.api.cleanup = cleanup;

exports.api.getWebContent = getWebContent;
exports.api.get_articles = get_articles;

exports.cron.scrap_medium_posts = scrap_medium_posts;
exports.cron.toolkit_scrapper = toolkit_scrapper;
