require('dotenv').config();
const { chromeOption, config } = require('./config')
const {Builder, By, Key, until} = require('selenium-webdriver');
const { searchTerms } = require('./searchTerm');
const DB = require('./db/index').DB

const { checkUrlQuery, saveQuery, getDistinctUrls } = require('./query');
const extractAndSaveData = require('./saveToDb');
const { extractLanguageFromUrl } = require('./utils');

// Set up the WebDriver
let driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOption)
    .build();

const searchForKeywords = async (url ) => {
    // Define the keywords to search 
    let keywords = searchTerms['en']

    // Extracting language from the url
    let lang = await extractLanguageFromUrl(url);

    if (lang !== null) {
      keywords = await searchTerms[lang] || searchTerms['en'];
    }

    // Loop through each keyword and perform a search
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];

      // Navigate to the URL with search parameters
      await driver.get(`${url}?search=${keyword.split(" ").join('+')}`);

      // Wait for the search results to load
      try {
        const resultList = await driver.wait(until.elementLocated(By.className(config["keyword_search_list.elements.country_page.classname"])), 5000) || [];
        const list = await resultList.findElements(By.tagName(config["search_result_list.elements.country_page.tagname"])) || [];

        for (let k = 0; k < list.length; k++) {
          // Extract the URLs from the <a> elements
          const url = await list[k].getAttribute(config["search_result_url.element.country_page.attribute"]);

          // Check if the URL already exists in the database
          const res = await DB.blog.any(checkUrlQuery, [url]);
          if (res.length === 0) {
            await extractAndSaveData(url);
          } 
          
        }

      } catch (error) {
        console.log('Error occurred while waiting for element:');
      }

    }
    return;
  }



const updateMissingUrl = async () => {
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

  let getDistinct = await DB.blog.any(getDistinctUrls(validUrls)).catch(()=> null);

  // Loop through each URL and perform a search
  for (let k = 0; k < getDistinct.length; k++) {
    const url = getDistinct[k]?.url || '';

    //Log needed for debugging
    console.log('url ', k + 1, ' out of ', getDistinct.length, 'urls')
    await searchForKeywords(url);
  }

  //Log needed for debugging
  console.log('Successfully saved all blogs')

}

}

module.exports = updateMissingUrl;