const { getdata } = include("controllers/blog/data");
const { DB } = include("db");

exports.app = async (req, res) => {
  const data = await getdata(DB.blog, req, res);
  if (data) return res.status(200).json(data);
  else return res.status(500).json(err);
};
