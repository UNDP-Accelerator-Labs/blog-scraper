const axios = require("axios");
const { DB } = include("/db");

const toolkit_list = [
  {
    url: "https://nie.sdg-innovation-commons.org/assets/js/lunr-feed.js",
    country: "Accelerator Labs",
    iso3: null,
    lat: null,
    lng: null,
    tags: ['toolkit', 'NIE']
  },
  {
    url: "https://undp-accelerator-labs.github.io/Financial-inclusion-toolkit/assets/lunr-feed.js",
    country: "Accelerator Labs",
    iso3: null,
    lat: null,
    lng: null,
    tags: ['toolkit', 'Digital Financial Inclusion', 'DFI']
  },
  {
    url: "https://undp-accelerator-labs.github.io/Innovation-Toolkit-for-UNDP-Signature-Solutions/assets/lunr-feed.js",
    country: "Bureau for Latin America and the Caribbean",
    iso3: "LAC",
    lat: 37.0902,
    lng: 95.7129,
    tags: ['toolkit', 'Signature Solution' ]
  },
];

exports.app = async (req, res) => {
  try {
    const matches = await this.scrapper();
    res.json(matches);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.scrapper = async () => {
  const matches = [];
  try {
    const responses = await Promise.all(
      toolkit_list.map((match) => axios.get(match.url))
    );

    // Iterate over each response
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const jsContent = response.data;
      const toolkitU = toolkit_list[i];

      const toolkitDomain = toolkitU.url.replace(/\/assets\/.*/, "");

      const regex = /index\.add\(([\s\S]*?)\);/g;
      let match;

      while ((match = regex.exec(jsContent)) !== null) {
        const contentString = match[1].trim();
        try {
          let contentObject = eval(`(${contentString})`);
          contentObject.content = contentObject?.content?.replace(/\n/g, " ") || null
          if (
            contentObject &&
            typeof contentObject.id === "number" &&
            !isNaN(contentObject.id) &&
            contentObject.content != null
          ) {
            // Format the contentObject
            const tagsArray = [...toolkitU.tags, ...(contentObject?.tags ? [contentObject.tags] : [])];
            const all_html_content = contentObject.content + " " + tagsArray.join(', ') + " " + (contentObject?.sdg ?? '') + " " + (contentObject?.tags ?? '') + " " + (contentObject?.enablers ?? '') + " " + (contentObject?.signature_solutions ?? '') + " " + (contentObject?.rblac_priorities ?? '');

            const formattedObject = {
                country: toolkitU.country,
                language: "en",
                posted_date: new Date().toISOString().split("T")[0], 
                article_type: "toolkit",
                privilege: 1,
                rights: 0,
                iso3: toolkitU.iso3,
                haslab: true,
                lat: toolkitU.lat,
                lng: toolkitU.lng,
                ...contentObject,
                tags: tagsArray,
                all_html_content,
            };

            formattedObject.url = `${toolkitDomain}${formattedObject.url}`;
            matches.push(formattedObject);

            // Perform upsert using INSERT ... ON CONFLICT UPDATE
            await DB.blog.none(
              `
                INSERT INTO public.articles (url, country, language, title, posted_date, content, article_type, iso3, has_lab, lat, lng, privilege, rights, tags, all_html_content)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (url) DO UPDATE
                SET
                  country = $2,
                  title = $4,
                  content = $6,
                  article_type = $7,
                  iso3 = $8,
                  lat = $10,
                  lng = $11,
                  privilege = $12,
                  rights = $13,
                  tags = $14,
                  has_lab = $9,
                  all_html_content = $15
              `,
              [
                formattedObject.url,
                formattedObject.country,
                formattedObject.language,
                formattedObject.title,
                formattedObject.posted_date,
                formattedObject.content,
                formattedObject.article_type,
                formattedObject.iso3,
                formattedObject.haslab,
                formattedObject.lat,
                formattedObject.lng,
                formattedObject.privilege,
                formattedObject.rights,
                formattedObject.tags,
                formattedObject.all_html_content,
              ]
            );
          }
        } catch (error) {
          console.error("Error parsing content:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error scraping content:", error);
  }

  return matches;
};
