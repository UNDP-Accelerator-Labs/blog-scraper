require("dotenv").config();
const { firefoxOption, config } = include("/config");
const { Builder, By } = require("selenium-webdriver");

const { searchTerms, extractLanguageFromUrl } = include("/services");
const { DB } = include("/db");
const { checkUrlQuery, saveQuery } = require("./scrap-query");

const extractAndSaveData = require("./saveToDb");
const updateRecordsForDistinctCountries = require("./updateRecordWithIso3");

//Start WebDriver
const driver = new Builder()
  .forBrowser("firefox")
  .setFirefoxOptions(firefoxOption)
  .build();

const searchForKeywords = async (url) => {
  let keywords = searchTerms["en"];
  let lang = await extractLanguageFromUrl(url);

  let countryName = null;
  let contentFilter,
    blogFilter,
    urlElements,
    globeButton,
    typeSeachText = null;
  let resultList = [];
  let list,
    newurls = [];

  if (lang !== null) {
    keywords = (await searchTerms[lang]) || searchTerms["en"];
  }

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];

    try {
      await driver.get(`${url}`);
    } catch (err) {
      console.log("err", err);
    }

    try {
      globeButton = await driver.findElement(By.className("icon-search"));
      await globeButton.click();
    } catch (err) {
      console.log("err", err);
    }

    try {
      typeSeachText = await driver.findElement(By.className("form-text"));
      await typeSeachText.clear();
      await typeSeachText.sendKeys(keyword);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (err) {
      console.log("err", err);
    }

    //Only extract blogs if config["extract_blog_only"] is set to true
    if (config["extract_blog_only"]) {
      try {
        contentFilter = await driver.findElement(
          By.css(config["filter_select.select.country_page.css_selector"])
        );
        await contentFilter.click();
      } catch (err) {
        contentFilter = false; // If 'Load More' button doesn't exist, set the flag to false
      }

      try {
        blogFilter = await driver.findElement(
          By.id(config["blog_filter.select.country_page.id"])
        );
        await blogFilter.click();
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (err) {
        blogFilter = false; // If 'Load More' button doesn't exist, set the flag to false
      }
    }

    let loadMoreExists = true;
    while (loadMoreExists) {
      try {
        // Check if 'Load More' button exists
        let loadMoreButton = await driver.findElement(
          By.xpath(config["search_result_list.button.country_page.path"])
        );
        if (loadMoreButton) {
          // Scroll to the end of the main div
          const element = await driver.findElement(
            By.className(
              config["scroll_result_list.button.country_page.classname"]
            )
          );
          await driver.executeScript(
            "arguments[0].scrollTo(0, arguments[0].scrollHeight)",
            element
          );
        }
      } catch (err) {
        loadMoreExists = false; // If 'Load More' button doesn't exist, set the flag to false
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // After scrolling to the end, find all URLs in the 'a' elements
    try {
      urlElements = await driver.findElements(
        By.xpath(config["search_result_list.elements.country_page.path"])
      );
    } catch (err) {
      urlElements = [];
    }

    for (let element of urlElements) {
      let url = await element.getAttribute("href");
      newurls.push(url);
    }

    try {
      for (let k = 0; k < newurls.length; k++) {
        const res = await DB.blog
          .any(checkUrlQuery, [newurls[k]])
          .catch((err) => null);

        try {
          countryName = await driver
            .findElement(
              By.css(
                config["page_country_name.element.country_page.css_selector"]
              )
            )
            .getText();
        } catch (err) {
          countryName = null;
        }

        if (!res.length) {
          await extractAndSaveData(newurls[k], null, countryName);
        }
      }
    } catch (error) {}
  }
  return;
};

const extractBlogUrl = async (params) => {
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

    //THIS IS A LONG LOOP, HENCE SEVER USUSALLY RUN OUT OF MEMORY
    //SET START INDEX & delimeter TO LIMIT THE RANGE OF A SINGLE RUN
    //SETTING SMALL delimeter SHOULD AVOID SERVER CRASHING AFTER RUNNING FOR A LONG TIME
    const start = startIndex ?? 0;
    const end = delimeter ?? validUrls.length;
    for (let k = start; k < end; k++) {
      const url = validUrls[k];
      // Logging needed for debugging
      console.log("This is running for", k + 1, "out of ", end);
      await searchForKeywords(url);
    }

    updateRecordsForDistinctCountries();
  }

  await driver.quit();
};

module.exports = {
  extractBlogUrl,
  searchForKeywords,
};
