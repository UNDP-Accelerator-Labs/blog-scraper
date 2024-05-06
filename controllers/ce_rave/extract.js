require("dotenv").config();
const setupWebDriver = require("../partial/webdriver");
const { By } = require("selenium-webdriver");
const { DB } = include("/db");
const { keywords } = require("./keywords");
const { searchForKeywords } = require("../blog/scrapper/extract-url");
const { config } = include('/config');

exports.extract_ce = async (params) => {
  // Setup WebDriver
  let driver;
  try {
    driver = await setupWebDriver();
  } catch (error) {
    console.error("Error setting up WebDriver:", error);
    return;
  }

  const { startIndex, delimeter } = params || {};

  await driver.get(config["baseUrl"]);
  const globeButton = await driver.findElement(
    By.className(config["search.element.homepage.classname"])
  );
  await globeButton.click();
  const countries = await driver.findElements(
    By.className(config["country_list.elements.homepage.classname"])
  );
  let validUrls = [];

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const languages = await country.findElements(
      By.className(config["language_list.elements.homepage.classname"])
    );

    for (let j = 0; j < languages.length; j++) {
      const language = languages[j];
      const urls = await language.findElements(
        By.tagName(config["language_name.element.homepage.tagname"])
      );
      for (let k = 0; k < urls.length; k++) {
        const url = await urls[k].getAttribute(
          config["page_url.element.homepage.attribute"]
        );
        validUrls.push(url);
      }
    }

    const start = startIndex ?? 0;
    const end = delimeter ?? validUrls.length;
    for (let k = start; k <= end; k++) {
      const url = validUrls[k];
      // Logging needed for debugging
      console.log("This is running for", k + 1, "out of ", end);
      await searchForKeywords({
        url,
        driver,
        defaultTerms: keywords,
        defaultDB: DB.ce_rave,
        ignoreRelevanceCheck: true
      });
    }
  }

  await driver.quit();
};
