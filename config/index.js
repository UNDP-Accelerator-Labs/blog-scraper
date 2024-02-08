const { chromeOption } = require("./chrome");
const {optipns : firefoxOption } = require('./firefox')
const config = require("./config");
const { csp_links } = require("./csp");
const {
  app_suite,
  app_title,
  app_title_short,
  app_suite_secret,
  app_storage,
  own_app_url,
  app_base_host,
  app_suite_url,
  acclab_suites,
  sso_app_url,
} = require("./apps");

exports.config = config;
exports.chromeOption = chromeOption;
exports.firefoxOption = firefoxOption;
exports.csp_links = csp_links;

exports.app_title = app_title;
exports.app_title_short = app_title_short;
exports.app_suite = app_suite;
exports.app_suite_secret = app_suite_secret;

exports.app_storage = app_storage;
exports.own_app_url = own_app_url;
exports.app_base_host = app_base_host;
exports.app_suite_url = app_suite_url;
exports.acclab_suites = acclab_suites;
exports.sso_app_url = sso_app_url;
