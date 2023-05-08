require('dotenv').config();
const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
var cron = require('node-cron');

const { searchTerms } = require('./searchTerm');
// const pool =  require('./db');
const { checkUrlQuery, saveQuery } = require('./query');
const extractAndSaveData = require('./saveToDb');
const { extractLanguageFromUrl } = require('./utils');

// const { 
  const production = true;
// } = process.env;

// Set up the Chrome options
const options = new chrome.Options();
// // if(production == 'true' ){
  options.addArguments('--headless'); // Run Chrome in headless mode (without a UI)
  options.addArguments('--window-size=1920,1080'); // Set the window size
  options.addArguments('--no-sandbox')
  options.addArguments('--disable-dev-shm-usage')
// }
// else{
//   options.addArguments('--start-maximized'); // Maximize the window
//   options.addArguments('--disable-gpu'); // Disable the GPU
//   options.addArguments('--disable-dev-shm-usage'); // Disable shared memory usage
//   options.addArguments('--no-sandbox'); // Disable the sandbox
// }


// Set up the WebDriver
const driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();

const searchResults = [];

const searchForKeywords = async (url) => {
    // Define the keywords to search for
    let keywords = searchTerms['en']

    // Extracting language from the url
    let lang = await extractLanguageFromUrl(url);

    if (lang !== null) {
      keywords = searchTerms[lang] || searchTerms['en'];
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
          // const res = await pool.query(checkUrlQuery(url));
          // if (res.rowCount === 0) {
          //   searchResults.push(url);
          //   await extractAndSaveData(url);
          // } else {
          //   console.log(`Article from ${url} already exists in database`);
          // }
          
        }

      } catch (error) {
        console.log('Error occurred while waiting for element:', error);
      }

    }
    return;
  }



const extractBlogUrl = async () => {
console.log('start here ')
// Navigate to the base website
await driver.get('https://www.undp.org/');

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

  // Loop through each URL and perform a search
  for (let k = 13; k < validUrls.length; k++) {
    const url = validUrls[k];
    await searchForKeywords(url);
  }

}

// searchResults.forEach(async (url) => {
//   await extractAndSaveData(url);
// });

// Quit the WebDriver
await driver.quit();

}


// if(production === 'true') {
//   cron.schedule('0 0 1,15 * *', () => {
//     console.log('running a task twice a month');
//     getFn();
//   });
// }
// else {
  // getFn();
// }

// extractBlogUrl()
module.exports = extractBlogUrl;