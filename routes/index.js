const {
  bg_scrap,
  tk_scrap,
  scrapper,
  cleanup,
  medium_posts,
  getWebContent,
  get_ce_rave,
} = include("/controllers");
if (!exports.api) {
  exports.api = {};
}
if (!exports.cron) {
  exports.cron = {};
}

exports.api.blog = bg_scrap;
exports.api.toolkit = tk_scrap;
exports.api.cleanup = cleanup;
exports.api.getWebContent = getWebContent;
exports.api.get_ce_rave = get_ce_rave;

exports.cron.medium_posts = medium_posts;
exports.cron.scrapper = scrapper;
