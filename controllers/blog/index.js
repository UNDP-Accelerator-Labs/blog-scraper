const { getdata } = include("controllers/blog/data");
const { DB } = include("db");
const cleanup = require('./clean-up')
const medium_posts = require('./medium')

exports.app = async (req, res) => {
  const data = await getdata(DB.blog, req, res);
  if (data) return res.status(200).json(data);
  else return res.status(500).json("Error occurred...");
};

exports.cleanup = async (req, res) => {
  cleanup(DB.blog, req, res);
};

exports.medium_posts = async (req, res) => {
  medium_posts(DB.blog, req, res);
  res.status(200).send('Medium scrapping has started.')
};
