const {
  app: bg_scrap,
  cleanup,
  medium_posts,
  getWebContent,
} = require("./blog");
const { tk_scrap, scrapper } = require("./toolkits");

exports.bg_scrap = bg_scrap;
exports.tk_scrap = tk_scrap;
exports.scrapper = scrapper;

exports.cleanup = cleanup;
exports.medium_posts = medium_posts;

exports.getWebContent = getWebContent;
