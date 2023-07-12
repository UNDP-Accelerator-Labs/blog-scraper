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
    // Define the keywords to search for
    let keywords = searchTerms['en']

    // Extracting language from the url
    let lang = await extractLanguageFromUrl(url);

    if (lang !== null) {
      keywords = await searchTerms[lang] || searchTerms['en'];
    }

    // Loop through each keyword and perform a search
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log('Searching for keyword:')
      // Navigate to the URL with search parameters
      await driver.get(`${url}?search=${keyword.split(" ").join('+')}`);

      // Wait for the search results to load
      try {
        // await driver.wait(until.elementLocated(By.className('item-list')), 9000);
        const resultList = await driver.wait(until.elementLocated(By.className('item-list')), 5000);
        const list = await resultList.findElements(By.tagName('a'));

        for (let k = 0; k < list.length; k++) {
          // Extract the URLs from the <a> elements
          const url = await list[k].getAttribute('href');

          // Check if the URL already exists in the database
          const res = await DB.blog.any(checkUrlQuery, [url]);
          if (res.length === 0) {
            await extractAndSaveData(url);
          } else {
            console.log(`Article from ${url} already exists in database`);
          }
          
        }

      } catch (error) {
        console.log('Error occurred while waiting for element:', error);
      }

    }
    return;
  }



const updateMissingUrl = async () => {
console.log('start here ')
// Navigate to the base website
await driver.get(config['baseUrl']);

// Click the "icon-globe" button to reveal the dropdown
const globeButton = await driver.findElement(By.className('icon-globe'));
await globeButton.click();

// Find all the "countries" elements
const countries = await driver.findElements(By.className('countries'));
let validUrls = [];

// Loop through each "country" element
for (let i = 0; i < countries.length; i++) {
  const country = countries[i];

  // Extract the country name
  const countryName = await country.findElement(By.className('country')).getText();

  // Extract the URLs for each language in the "languages" element
  const languages = await country.findElements(By.className('languages'));
  for (let j = 0; j < languages.length; j++) {
    const language = languages[j];

    // Extract the URLs from the <a> elements
    const urls = await language.findElements(By.tagName('a'));
    
    for (let k = 0; k < urls.length; k++) {
      const url = await urls[k].getAttribute('href');
      // console.log('url', url);
      validUrls.push(url);
    }

  }

  let getDistinct = await DB.blog.any(getDistinctUrls(validUrls)).catch(()=> null);

  // Loop through each URL and perform a search
  for (let k = 0; k < getDistinct.length; k++) {
    const url = getDistinct[k]?.url || '';
    console.log('url ', k + 1, ' out of ', getDistinct.length, 'urls')
    await searchForKeywords(url);
  }

  console.log('Successfully saved all blogs')

}


// Quit the WebDriver
// await driver.quit();

}

module.exports = updateMissingUrl;