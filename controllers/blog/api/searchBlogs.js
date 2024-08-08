const { searchBlogQuery } = require("./query");
const { DB } = include("db/");
const { sqlregex } = include("middleware/search");

exports.main = async (kwargs) => {
  const conn = kwargs.connection ? kwargs.connection : DB.conn;
  const { req, page, page_content_limit, iso3 } = kwargs || {};

  let { search, country, type, language, bureau } = req.query || {};
  const searchText = search || "";
  const [formated_search, terms] = sqlregex(searchText);

  return conn.task((t) => {
    return t
      .any(
        searchBlogQuery(
          searchText,
          page,
          country,
          type,
          page_content_limit,
          language,
          iso3
        )
      )
      .then(async (results) => {
        const iso3 = await results.map((p) => p.iso3);
        const countries = await DB.general
          .any(
            `
              SELECT name,  iso3
              FROM country_names 
              WHERE iso3 = ANY($1) 
          `,
            [iso3]
          )
          .catch((err) => {
            console.log(err);
            return [];
          });

        const data = await results.map((p) => ({
          ...p,
          country: countries.find((k) => k.iso3 == p.iso3)?.name || "",
          date: convertToDate(p),
          matched_texts: extractMatchedTexts(p, terms),
        }));

        return {
          searchResults: data,
          page,
          total_pages: data[0]?.total_pages || 0,
          totalRecords: data[0]?.total_records || 0,
        };
      })
      .catch((err) => {
        console.log(err);
        // NOTE recovering from any query parse errors
        return {
          searchResults: [],
        };
      });
  });
};

const extractMatchedTexts = (searchResults, searchWords) => {
  const textToSearch = removeNavigationTexts(
    `${searchResults.title || ""} ${searchResults.content || ""}`
  );

  if (searchWords.length === 0) {
    const startWordIndex = textToSearch.substring(100, 200).split(/\s+/).length;
    const endWordIndex = startWordIndex + 50;
    const words = textToSearch.split(/\s+/).slice(startWordIndex, endWordIndex);
    // return words.join(" ");
    return "";
  }

  const matchedTexts = [];

  for (const searchWord of searchWords) {
    const regex = new RegExp(`\\b${searchWord}\\b`, "gi");
    const match = regex.exec(textToSearch);

    if (match) {
      const words = match.input.split(/\s+/).slice(0, 50);
      const matchedText = words.join(" ");
      matchedTexts.push(matchedText);
      if (matchedTexts.length) return matchedTexts.join("");
    }
  }

  if (matchedTexts.length === 0) {
    const textToSearch = removeNavigationTexts(
      searchResults?.html_content || ""
    );
    for (const searchWord of searchWords) {
      const regex = new RegExp(`\\b${searchWord}\\b`, "gi");
      const match = regex.exec(textToSearch);

      if (match) {
        const startWordIndex =
          textToSearch.substring(0, match.index).split(/\s+/).length - 26;
        const endWordIndex = startWordIndex + 40;
        const words = textToSearch
          .split(/\s+/)
          .slice(startWordIndex, endWordIndex);
        const matchedText = words.join(" ");
        matchedTexts.push(matchedText);
        if (matchedTexts.length) return matchedTexts.join("");
      }
    }
  }

  if (matchedTexts.length === 0) {
    const words = textToSearch.split(/\s+/).slice(0, 50);
    return words.join(" ");
  }
};

function convertToDate(data) {
  if (data.parsed_date instanceof Date && !isNaN(data?.parsed_date)) {
    return new Date(data.parsed_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (data.posted_date instanceof Date && !isNaN(data?.posted_date)) {
    return new Date(data.posted_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (data.posted_date_str) {
    return data.posted_date_str;
  }

  return null;
}

const navigationTexts = [
  "About Us",
  "WHAT WE DO",
  "WHERE WE ARE",
  "OUR LEARNINGS",
  "Where we are",
  "Global Publications",
  "Country Publications",
  "Read more",
  "Our locations",
  "News center",
  "Events",
  "Newsletters",
  "Join our community",
  "Sign up to our newsletter",
  "Report fraud, abuse, misconduct",
  "Submit social or environmental complaint",
  "Scam alert",
  "Terms of use",
  "United Nations Development Programme",
  "Our work",
  "Partnerships: the core of our network",
  "UNTAPPED",
  "Grassroots Energy Solutions",
  "Blog",
  "NEWS",
  "twitter",
  "linkedin",
  "instagram",
  "youtube",
  "medium",
  "© 2024 United Nations Development",
];

function removeNavigationTexts(searchText) {
  const regex = new RegExp(
    navigationTexts.map((text) => `\\b${text}\\b`).join("|"),
    "gi"
  );

  // Replace occurrences of the texts with an empty string
  return searchText
    .replace(regex, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
