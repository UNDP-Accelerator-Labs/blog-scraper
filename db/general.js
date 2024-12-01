require("dotenv").config();

let isProd = ["production", "local-production"].includes(process.env.NODE_ENV);

exports.connection = {
  database: process.env.LOGIN_DB_NAME,
  port: process.env.LOGIN_DB_PORT,
  host: process.env.LOGIN_DB_HOST,
  user: process.env.LOGIN_DB_USERNAME,
  password: process.env.LOGIN_DB_PASSWORD,
  ssl: isProd,
};
