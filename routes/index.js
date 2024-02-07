const { bg_scrap, tk_scrap, scrapper } = include('/controllers')
if (!exports.api) { exports.api = {} }
if (!exports.cron) { exports.cron = {} }

exports.api.blog = bg_scrap;
exports.api.toolkit = tk_scrap;


exports.cron.scrapper = scrapper;