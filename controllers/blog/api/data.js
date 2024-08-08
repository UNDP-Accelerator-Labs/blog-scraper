const loadStats = require("./stats");
const searchBlogs = require("./searchBlogs");
const filter = require("./filters");
const { DB } = include("db/");

exports.browse_data = async (conn, req, res) => {
  let { page_content_limit, page, language, bureau } = req.query;
  page = page ?? 1;
  page_content_limit = page_content_limit ?? 15;
  let iso3 = [];
  let whereClause = "";

  if (bureau) {
    if (Array.isArray(bureau) && bureau.length) {
      whereClause += `bureau IN ('${bureau.join("','")}')`;
    } else if (typeof bureau === "string") {
      whereClause += `bureau = '${bureau}'`;
    }
  }

  if (bureau) {
    iso3 = await DB.general
      .any(
        `
      SELECT iso3 FROM countries
      WHERE ${whereClause}
      `,
        [bureau]
      )
      .then((d) => d.map((p) => p?.iso3))
      .catch((e) => []);
  }

  return conn
    .tx(async (t) => {
      const batch = [];
      // LOAD AGGREGATE VALUES
      batch.push(loadStats.main({ connection: t, req, res, page, iso3 }));

      //LOAD search reasults
      batch.push(
        searchBlogs.main({
          connection: t,
          req,
          res,
          page_content_limit,
          page,
          language,
          iso3,
        })
      );
      //LOAD filter results
      batch.push(filter.main({ connection: t, req, res, iso3 }));

      return t.batch(batch).catch((err) => console.log(err));
    })
    .then(async (results) =>{
      const result = results;
      const [a, b, c] = results
      const transform_bureau = await c?.bureau?.map(item => {
          const nameObj = b_names.find(b => b.bureau === item.bureau);
          return { ...item, full_name: nameObj ? nameObj.full_name : '' };
      });
      if(transform_bureau?.length){
        result[2]['bureau'] = transform_bureau
      }
      return result
    })
    .then(async (results) => results)
    .catch((err) => console.log(err));
};


const b_names = [
  { bureau: 'RBA', full_name: 'Africa'},
  { bureau: 'RBLAC', full_name: 'Latin America and the Caribbean'},
  { bureau: 'RBEC', full_name: 'Europe and Central Asia'},
  { bureau: 'RBAP', full_name: 'Asia and the Pacific'},
  { bureau: 'HQ', full_name: 'Headquarters' },
  { bureau: 'RBAS', full_name: 'Arab States' }
]
