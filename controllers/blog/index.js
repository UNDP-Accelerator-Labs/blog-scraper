const { getdata } = include("controllers/blog/data");
const { DB } = include("db");
const cleanup = require('./clean-up')

exports.app = async (req, res) => {
  const data = await getdata(DB.blog, req, res);
  if (data) return res.status(200).json(data);
  else return res.status(500).json("Error occurred...");
};

exports.cleanup = async (req, res) => {
  cleanup(DB.blog, req, res);
};
