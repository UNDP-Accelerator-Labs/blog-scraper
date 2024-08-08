const { browse_data } = require("./api/data");
const { main } = require("./api/stats");
const { DB } = include("db");
const cleanup = require('./scrapper/clean-up')

exports.browse_data = async (req, res) => {
  const data = await browse_data(DB.blog, req, res);
  if (data) return res.status(200).json(data);
  else return res.status(500).json("Error occurred...");
};

exports.get_stats = async (req, res) => {
  const data = await main({ connection: DB.blog, req, res });
  if (data) return res.status(200).json(data);
  else return res.status(500).json("Error occurred...");
};

exports.cleanup = async (req, res) => {
  cleanup(DB.blog, req, res);
};

exports.getWebContent = require('../blog/api/scap')
exports.scrap_medium_posts = require('./blog_type/medium').scrap_medium_posts