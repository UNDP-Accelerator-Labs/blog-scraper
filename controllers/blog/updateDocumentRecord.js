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
  res.forEach(async (p) => {
    if (p.content) {
      let loc = await getDocumentCountryName(p["content"]);
      let lang = await getDocumentLanguage(p["content"]);

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
  return axios
    .post(`${NLP_API_URL}/locations`, {
      token: API_TOKEN,
      input: content,
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
  return axios
    .post(`${NLP_API_URL}/language`, {
      token: API_TOKEN,
      input: content,
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
