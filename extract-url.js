require('dotenv').config();
const { chromeOption, config } = require('./config')
const {Builder, By, Key, until} = require('selenium-webdriver');

const { searchTerms } = require('./searchTerm');
const DB = require('./db/index').DB
const { checkUrlQuery, saveQuery } = require('./query');

const extractAndSaveData = require('./saveToDb');
const { extractLanguageFromUrl } = require('./utils');
const updateRecordsForDistinctCountries = require('./updateRecordWithIso3')

//Start WebDriver
let driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOption)
    .build();

const searchForKeywords = async (url ) => {
  let keywords = searchTerms['en']
  let lang = await extractLanguageFromUrl(url);
    if (lang !== null) {
    keywords = await searchTerms[lang] || searchTerms['en'];
  }
    for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
      try {
      await driver.get(`${url}?search=${keyword.split(" ").join('+')}`);
    }
    catch(err){ }

      let countryName = null;
    let resultList = [];
    let list = []
    let url = null;
      try {
      try {
        resultList = await driver.wait(until.elementLocated(By.className(config["keyword_search_list.elements.country_page.classname"])), 5000);
      }
      catch(err){ throw new Error(err)}
        try {
        countryName =  await driver.findElement(By.css(config['page_country_name.element.country_page.css_selector'])).getText();
      }
      catch(err){ throw new Error(err)}
        try {
        list = await resultList.findElements(By.tagName(config['search_result_list.elements.country_page.tagname']));
      }
      catch(err){ throw new Error(err)}
        for (let k = 0; k < list.length; k++) {
        try {
          url = await list[k].getAttribute(config["search_result_url.element.country_page.attribute"]);
        }
        catch(err){ throw new Error(err)} 
          const res = await DB.blog.any(checkUrlQuery, [url]).catch((err)=>  null)
        if (res.length) {
          await extractAndSaveData(url, null, countryName);
        } 
        }
      } catch (error) { }
    }
  return;
}

const extractBlogUrl = async () => {
  // Navigate to the base website
  await driver.get(config['baseUrl']);
   // Click the "icon-globe" button to reveal the dropdown
  const globeButton = await driver.findElement(By.className(config['search.element.homepage.classname']));
  await globeButton.click();
   // Find all the "countries" elements
  const countries = await driver.findElements(By.className(config['country_list.elements.homepage.classname']));
  let validUrls = [];
   // Loop through each "country" element
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
     // Extract the country name
    const countryName = await country.findElement(By.className(config['country_name.element.homepage.classname'])).getText();
     // Extract the URLs for each language in the "languages" element
    const languages = await country.findElements(By.className(config['language_list.elements.homepage.classname']));
    for (let j = 0; j < languages.length; j++) {
      const language = languages[j];
       // Extract the URLs from the <a> elements
      const urls = await language.findElements(By.tagName(config['language_name.element.homepage.tagname']));
       for (let k = 0; k < urls.length; k++) {
        const url = await urls[k].getAttribute(config['page_url.element.homepage.attribute']);
        validUrls.push(url);
      }
     }
     // Loop through each URL and perform a search
    for (let k = 0; k < validUrls.length; k++) {
      const url = validUrls[k];
      // Logging needed for debugging
      console.log('This is running for', k + 1, 'out of', validUrls.length);
      await searchForKeywords(url);
    }
     // Logging needed for debugging
    console.log('Successfully saved all blogs');
     // Update iso3 code of all records
    updateRecordsForDistinctCountries();
  }
   // Quit the WebDriver
  await driver.quit();
}

module.exports = extractBlogUrl;