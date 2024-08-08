const {
    countryGroup,
    articleGroup,
    languageGroup,
    extractGeoQuery,
  } = require("./query");
  const { DB } = include("db/");
  
  exports.main = async (kwargs) => {
    const conn = kwargs.connection ? kwargs.connection : DB.conn;
    const { req, iso3 } = kwargs || {};
    let { search, country, type, language, bureau } = req.query || {};
  
    return conn
      .task((t) => {
        const batch = [];
  
        batch.push(
          t
            .any(countryGroup(search?.trim(), country, type, language, iso3))
            .then(async (results) => {
              const iso3 = await results.map((p) => p.iso3);
              const region = await DB.general.any(
                `
                    SELECT a.name, a.language, a.iso3, b.bureau
                    FROM country_names a
                    JOIN countries b ON b.iso3 = a.iso3
                    WHERE 
                    a.iso3 = ANY($1) AND 
                    a.language = $2
                    ORDER BY a.name ASC
                `,
                [iso3, "en"]
              );
  
              const countries = results
                .map((itemA) => {
                  const matchingItemB = region.find(
                    (itemB) => itemB.iso3 === itemA.iso3
                  );
                  if (matchingItemB) {
                    return {
                      ...matchingItemB,
                      recordcount: parseInt(itemA.recordcount),
                    };
                  }
                  return null;
                })
                .filter(Boolean);
  
              
              const bureaus = countries.reduce((acc, curr) => {
                const foundIndex = acc.findIndex(
                  (item) => item.bureau === curr.bureau
                );
                if (foundIndex !== -1) {
                  acc[foundIndex].recordcount += curr.recordcount;
                } else {
                  acc.push({
                    bureau: curr.bureau,
                    iso3: curr.iso3,
                    recordcount: curr.recordcount,
                  });
                }
                return acc;
              }, []);
  
              return [countries, bureaus];
            })
            .catch((err) => console.log(err))
        );
  
        batch.push(
          t
            .any(articleGroup(search?.trim(), country, type, language, iso3))
            .then(async (results) => results)
            .catch((err) => console.log(err))
        );
  
        batch.push(
          t
            .any(languageGroup(search?.trim(), country, type, language, iso3))
            .then(async (results) => results)
            .catch((err) => console.log(err))
        );
  
        batch.push(
          t
            .any(extractGeoQuery(search?.trim(), country, type, language, iso3))
            .then(async (results) => results.map((p) => p?.json))
        );
  
        return t.batch(batch).catch((err) => console.log(err));
      })
      .then((data) => {
        const [countries, articleType, language, geoData] = data || [null, null, null, null];
  
        const [country, bureau] = countries || [null, null];
        
        return {
          countries: country,
          bureau,
          articleType,
          language,
          geoData,
        };
      })
      .catch((err) => console.log(err));
  };
  