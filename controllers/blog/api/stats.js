const { statsQuery } = require("./query");
const { DB } = include("db/");

exports.main = async (kwargs) => {
  const conn = kwargs.connection ? kwargs.connection : DB.conn;
  const { req, iso3 } = kwargs || {};
  let { search, country, type, language } = req.query || {};

  return conn
    .tx((t) => {
      const batch = [];

      batch.push(
        t
          .any(statsQuery(search?.trim(), country, type, language, iso3))
          .then(async (results) => results)
          .catch((err) => console.log(err))
      );

      return t.batch(batch).catch((err) => console.log(err));
    })
    .then((d) => ({
      stats: d.flat(),
    }))
    .catch((err) => console.log(err));
};
