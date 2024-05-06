require("dotenv").config();
const { By } = require("selenium-webdriver");
const setupWebDriver = require("../../partial/webdriver");
const extractAndSaveData = require("../scrapper/save");
const { DB } = include("db");
const { checkUrlQuery } = require("../scrapper/scrap-query");

const medium_posts = async () => {
  const baseurls = [
    "https://acclabs.medium.com/",
  ];

  // Setup WebDriver
  let driver;
  try {
    driver = await setupWebDriver();
  } catch (error) {
    console.error("Error setting up WebDriver:", error);
    return;
  }

  await driver.manage().window().maximize();

  const urls = []
  // Loop through each base URL
  for (const baseUrl of baseurls) {
    // Navigate to the base website
    await driver.get(baseUrl);

    // Scroll to the bottom of the page
    let lastHeight = await driver.executeScript("return document.body.scrollHeight");
    while (true) {
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
      await driver.sleep(2000); // Adjust the interval as needed
      let newHeight = await driver.executeScript("return document.body.scrollHeight");
      if (newHeight === lastHeight) {
        // If the scroll position no longer changes, break out of the loop
        break;
      }
      lastHeight = newHeight;
    }

    // Extract URLs of articles
    const articleElements = await driver.findElements(By.tagName('article'));
    for (const article of articleElements) {
      const linkElement = await article.findElement(By.css('div[role="link"]'));
      const url = await linkElement.getAttribute('data-href');
      urls.push(url)
    }

    for (const href of urls) {
        // Call a function to extract and save data for each URL
        const res = await DB.blog
          .any(checkUrlQuery, [href])
          .catch((err) => console.log("Error occurred ", err));
        console.log('href ', href)
        if (!res.length) {
          await extractAndSaveData({ url: href });
        } else console.log("Skipping... Record already exist.");
      }

  }

  // Close the WebDriver session
  if (driver) await driver.quit();
  console.log("Scrapping completed.")
};

module.exports = medium_posts;
