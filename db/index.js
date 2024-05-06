require("dotenv").config();

const logSQL = false;
const initOptions = {
  query(e) {
    if (logSQL) console.log(e.query);
  },
};
const pgp = require("pg-promise")(initOptions);

const DB_general = require("./general.js").connection;
const DB_blog = require("./blog.js").connection;
const DB_ce_rave = require("./ce_rave.js").connection;

exports.DB = {
  general: pgp(DB_general),
  blog: pgp(DB_blog),
  ce_rave: pgp(DB_ce_rave),
  pgp,
};
