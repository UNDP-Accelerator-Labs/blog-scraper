require("dotenv").config();
const axios = require("axios");
const {
  getAllDocument,
  updateDocumentRecord,
  recordSince,
} = require("./scrap-query");
const { DB } = include("/db");

const { NLP_API_URL, API_TOKEN } = process.env;

const updateDocument = async () => {
  const res = await DB.blog.any(recordSince).catch((err) => []);

  // Loop through each document and update country name
  await res.forEach(async (p, i) => {
    if (p.content) {
      let cont = p["content"].slice(0, 100 * 1024)
      let loc = await getDocumentCountryName(cont);
      let lang = await getDocumentLanguage(cont);

      //check has_lab record from the genral database
      const hasLabQuery = `
          SELECT has_lab
          FROM countries
          WHERE iso3 = $1;
        `;
      const hasLabResult = await DB.general
        .one(hasLabQuery, [loc?.iso3])
        .catch(() => ({ has_lab: false }));

      try {
        await DB.blog
          .none(updateDocumentRecord, [
            p["id"],
            loc?.country,
            lang,
            loc?.lat,
            loc?.lng,
            loc?.iso3,
            hasLabResult?.has_lab,
          ])
          .catch((err) => {
            throw new Error(err);
          });
      } catch (err) {
        console.log("Error occurred while updating document record ", err);
      }
    }
  });

  //Log needed for debugging
  console.log("Successfully updated all document record");
};

const getDocumentCountryName = async (content) => {
  let body = {
    token: API_TOKEN,
    input: content,
  }
  return axios({
    method: 'post',
    url: `${NLP_API_URL}/locations`,
    data: JSON.stringify(body)
  })
    .then(({ data }) => {
      let location = data["entites"][0]["location"];
      return {
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        country: location?.formatted || "",
        iso3: location?.country || null,
      };
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
};

const getDocumentLanguage = async (content) => {
  let body = {
    token: API_TOKEN,
    input: content,
  }
  return axios({
    method: 'post',
    url: `${NLP_API_URL}/language`,
    data: JSON.stringify(body)
  })
    .then(({ data }) => {
      return data?.languages[0]["lang"] || "en";
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
};

module.exports = updateDocument;
