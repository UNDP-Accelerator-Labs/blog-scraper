require("dotenv").config();
const { firefoxOption, config } = include("/config");
const { Builder, By } = require("selenium-webdriver");

const { getDistinctUrls } = require("./scrap-query");
const { DB } = include("/db");
const { searchForKeywords } = require("./extract-url");

const updateMissingUrl = async () => {
  // Set up the WebDriver
  let driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(firefoxOption)
    .build();

  // Navigate to the base website
  await driver.get(config["baseUrl"]);

  // Click the "icon-globe" button to reveal the dropdown
  const globeButton = await driver.findElement(
    By.className(config["search.element.homepage.classname"])
  );
  await globeButton.click();

  // Find all the "countries" elements
  const countries = await driver.findElements(
    By.className(config["country_list.elements.homepage.classname"])
  );
  let validUrls = [];

  // Loop through each "country" element
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];

    // Extract the URLs for each language in the "languages" element
    const languages = await country.findElements(
      By.className(config["language_list.elements.homepage.classname"])
    );
    for (let j = 0; j < languages.length; j++) {
      const language = languages[j];

      // Extract the URLs from the <a> elements
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

    let getDistinct = await DB.blog
      .any(getDistinctUrls(validUrls))
      .catch(() => null);

    // Loop through each URL and perform a search
    for (let k = 0; k < getDistinct.length; k++) {
      const url = getDistinct[k]?.url || "";

      //Log needed for debugging
      console.log("url ", k + 1, " out of ", getDistinct.length, "urls");
      await searchForKeywords(url);
    }

    //Log needed for debugging
    console.log("Successfully saved all blogs");
  }
};

module.exports = updateMissingUrl;
