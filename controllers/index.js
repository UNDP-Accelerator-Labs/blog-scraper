require("dotenv").config();
const { Router } = require("express");
const { getdata } = include("routes/page");
const { DB } = include("db");

const app = () => {
  let api = Router();

  api.get("/:page_content_limit/:page", async (req, res) => {
    const data = await getdata(DB.blog, req, res);
    if (data) return res.status(200).json(data);
    else return res.status(500).json(err);
  });
  return api;
};

module.exports = app;
