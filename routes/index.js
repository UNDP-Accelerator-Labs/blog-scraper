if (!exports.api) { exports.api = {} }
if (!exports.home) { exports.home = {} }


exports.api.blog = require("../controllers");
exports.home.browse = require('./home')