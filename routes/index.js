if (!exports.api) { exports.api = {} }
if (!exports.home) { exports.home = {} }


exports.api.blog = require("../controllers");
exports.home.index = require('./home')
exports.home.browse = require('./browse')