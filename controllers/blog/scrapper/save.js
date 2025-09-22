const setupWebDriver = require("../../partial/webdriver");
const extractDataFromUrl = require("../../partial/extractData");
const saveDataToDatabase = require("../../partial/saveData");
const { DB } = include("db/");

const extractAndSaveData = async (_kwarq) => {
  const { url, id, defaultDB, ignoreRelevanceCheck } = _kwarq;
  // Setup WebDriver
  let driver;
  try {
    driver = await setupWebDriver();
  } catch (error) {
    console.error("Error setting up WebDriver:", error);
    return;
  }

  try {
    // Extract data from URL
    const data = await extractDataFromUrl(driver, url, ignoreRelevanceCheck);

    // If no data extracted, exit early
    if (!data) {
      console.log("No relevant data extracted.");
      return;
    }

    //if data.title already exists in the database, exit early (prefer UNDP over Medium)
    if (data.title) {
      const normTitle = data.title.trim().toLowerCase().replace(/\s+/g, " ");
      const existingRecords = await DB.blog.any(
        `
        SELECT id, url, article_type
        FROM articles
        WHERE lower(trim(regexp_replace(title, '\\s+', ' ', 'g'))) = $1
          AND article_type IN ('blog', 'press_release')
        `,
        [normTitle]
      );

      if (existingRecords && existingRecords.length > 0) {
        // determine current host
        let currentHost = "";
        try {
          currentHost = new URL(url).host || "";
        } catch (e) {
          currentHost = "";
        }

        const currentIsUndp =
          /(^|\.)undp\.org$/i.test(currentHost) || /undp\.org/i.test(url);
        const currentIsMedium =
          /(^|\.)medium\.com$/i.test(currentHost) ||
          /medium\.com|acclabs\.medium\.com/i.test(url);

        const hasUndpExisting = existingRecords.some((r) =>
          /undp\.org/i.test(r.url)
        );
        const hasMediumExisting = existingRecords.some((r) =>
          /medium\.com|acclabs\.medium\.com/i.test(r.url)
        );

        // If UNDP exists and current is Medium -> skip insert
        if (hasUndpExisting && currentIsMedium) {
          console.log("UNDP version exists; skipping Medium duplicate.");
          return;
        }

        // If current is UNDP and only Medium exists -> update Medium row to point to UNDP and skip insert
        if (currentIsUndp && hasMediumExisting && !hasUndpExisting) {
          const mediumRec = existingRecords.find((r) =>
            /medium\.com|acclabs\.medium\.com/i.test(r.url)
          );
          if (mediumRec) {
            await DB.blog.none(
              `UPDATE articles SET url = $1, updated_at = now() WHERE id = $2`,
              [url, mediumRec.id]
            );
            console.log(
              "Replaced existing Medium record with UNDP URL; skipping new insert."
            );
            return;
          }
        }

        // Default: title exists -> skip to avoid duplicates
        // console.log("Title already exists in DB; skipping save.");
        // return;
      }
    }

    // Save data to database
    await saveDataToDatabase({ data, id, defaultDB });
  } catch (error) {
    console.error("Error extracting and saving data:", error);
  } finally {
    // Quit WebDriver
    if (driver) {
      driver.quit();
    }
  }
};

module.exports = extractAndSaveData;
