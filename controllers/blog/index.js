const { getdata } = include("controllers/blog/api/data");
const { DB } = include("db");
const cleanup = require('./scrapper/clean-up')
const medium_posts = require('./blog_type/medium')

exports.app = async (req, res) => {
  const data = await getdata(DB.blog, req, res);
  if (data) return res.status(200).json(data);
  else return res.status(500).json("Error occurred...");
};

exports.cleanup = async (req, res) => {
  cleanup(DB.blog, req, res);
};

exports.medium_posts = async (req, res) => {
  medium_posts();
  if(req && res){
    res.status(200).send('Medium scrapping has started.')
  }
};

exports.getWebContent = require('../blog/api/scap')

exports.ce_rave = async (req, res) => {
  const data = await getdata(DB.ce_rave, req, res);
  if (data) return res.status(200).json(data);
  else return res.status(500).json("Error occurred...");
};