const { bg_scrap, tk_scrap, scrapper, cleanup } = include('/controllers')
if (!exports.api) { exports.api = {} }
if (!exports.cron) { exports.cron = {} }

exports.api.blog = bg_scrap;
exports.api.toolkit = tk_scrap;
exports.api.cleanup = cleanup;

exports.cron.scrapper = scrapper;