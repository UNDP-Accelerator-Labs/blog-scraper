require('dotenv').config();
const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
var cron = require('node-cron');

const { searchTerms } = require('./searchTerm');
const pool =  require('./db');
const { checkUrlQuery, saveQuery, getAllBlogs } = require('./query');
const extractAndSaveData = require('./saveToDb');
const { extractLanguageFromUrl } = require('./utils');

// const { 
  const production = true;
// } = process.env;

// Set up the Chrome options
const options = new chrome.Options();
options.addArguments('--headless'); // Run Chrome in headless mode (without a UI)
options.addArguments('--window-size=1920,1080'); // Set the window size
options.addArguments('--no-sandbox')
options.addArguments('--disable-dev-shm-usage')


// Set up the WebDriver
const driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();


const searchForKeywords = async (obj) => {
    // Define the keywords to search for
    let keywords = searchTerms['en']
    let dbUrl = obj['url'];
    let id = obj['id'];

    // Extracting language from the url
    let lang = await extractLanguageFromUrl(dbUrl);

    if (lang !== null) {
      keywords = searchTerms[lang] || searchTerms['en'];
    }

    // Loop through each keyword and perform a search
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log('Searching for keyword:')
      // Navigate to the URL with search parameters
      await driver.get(`${dbUrl}?search=${keyword.split(" ").join('+')}`);

      // Wait for the search results to load
      try {
        // await driver.wait(until.elementLocated(By.className('item-list')), 9000);
        const resultList = await driver.wait(until.elementLocated(By.className('item-list')), 5000);
        const list = await resultList.findElements(By.tagName('a'));

        for (let k = 0; k < list.length; k++) {
          // Extract the URLs from the <a> elements
          const url = await list[k].getAttribute('href');
          await extractAndSaveData(url, id);
          
        }

      } catch (error) {
        console.log('Error occurred while waiting for element:', error);
      }

    }
    return;
  }



const fetchALlBlogs = async () => {
    // fetch all blogs
    const res = await pool.query(getAllBlogs());

  // Loop through each URL and perform a search
  for (let k = 0; k < res.rowCount; k++) {
    await searchForKeywords(res.rows[k]);
  }


// Quit the WebDriver
await driver.quit();

}

fetchALlBlogs()

// module.exports = fetchALlBlogs;