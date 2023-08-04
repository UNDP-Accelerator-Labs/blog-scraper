const express = require("express");
const blog = require("../controllers");

let router = express();

// api routes v2 (/v2/api)
router.use("/blog", blog());

module.exports = router;
