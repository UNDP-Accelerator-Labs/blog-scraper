require("dotenv").config();
const fetch = require("node-fetch");
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
  for (const p of res) {
    if (p.content && p.content.length) {
      const content = p["content"]
      const meta = await getDocumentMeta(content);

      if (meta) {
        // Extract language with maximum score
        const languages = meta?.language?.languages;
        const maxLanguage = languages?.reduce(
          (maxLang, lang) => (lang?.score > maxLang?.score ? lang : maxLang),
          languages[0]
        );

        // Extract country with highest confidence
        const entities = meta?.location.entities;
        const maxConfidenceEntity = entities?.reduce(
          (maxEntity, entity) =>
            entity?.location?.confidence > maxEntity?.location?.confidence
              ? entity
              : maxEntity,
          entities[0]
        );

        //check has_lab record from the genral database
        const hasLabQuery = `
          SELECT has_lab
          FROM countries
          WHERE iso3 = $1;
        `;
        const hasLabResult = await DB.general
          .one(hasLabQuery, [maxConfidenceEntity?.location?.country])
          .catch(() => ({ has_lab: false }));

        try {
          await DB.blog
            .none(updateDocumentRecord, [
              p["id"],
              maxConfidenceEntity?.location?.formatted,
              maxLanguage.lang,
              maxConfidenceEntity?.location?.lat,
              maxConfidenceEntity?.location?.lng,
              maxConfidenceEntity?.location?.country,
              hasLabResult?.has_lab,
            ])
            .catch((err) => {
              throw new Error(err);
            });
        } catch (err) {
          console.log("Error occurred while updating document record ", err);
        }
      }
    }
  }

  //Log needed for debugging
  console.log("Successfully updated all document record");
};

const getDocumentMeta = async (content) => {
  let body = {
    modules: [{ name: "location" }, { name: "language" }],
    token: API_TOKEN,
    input: content,
  };

  try {
    const response = await fetch(NLP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(
        "Network response was not ok: ",
        response.statusText,
        errorMessage
      );
      throw new Error("Network response was not ok ");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

module.exports = updateDocument;
