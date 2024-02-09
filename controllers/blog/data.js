const loadAggValues = include("controllers/blog/loadAgg");
const searchBlogs = include("controllers/blog/searchBlogs");
const filter = include("controllers/blog/filters");

exports.getdata = async (conn, req, res) => {
  let { page_content_limit, page } = req.params;
  page = page ?? 1;
  page_content_limit = page_content_limit ?? 15;

  return conn
    .tx(async (t) => {
      const batch = [];
      // LOAD AGGREGATE VALUES
      batch.push(loadAggValues.main({ connection: t, req, res, page }));

      //LOAD search reasults
      batch.push(
        searchBlogs.main({ connection: t, req, res, page_content_limit, page })
      );

      //LOAD filter reasults
      batch.push(filter.main({ connection: t, req, res }));

      return t.batch(batch).catch((err) => console.log(err));
    })
    .then(async (results) => results)
    .catch((err) => null);
};