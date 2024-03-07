require("dotenv").config();
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const extractAndSaveData = require("./saveToDb");
const { DB } = require("../../db");
const { checkUrlQuery } = require("./scrap-query");

const medium_posts = async () => {
  const baseurls = [
    "https://acclabs.medium.com/",
  ];

  // Set up the WebDriver
  let options = new firefox.Options();
//   options.headless();
  let driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();

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
      const linkElement = await article.findElement(By.tagName('a'));
      const url = await linkElement.getAttribute('href');
      urls.push(url)
    }

    for (const href of urls) {
        // Call a function to extract and save data for each URL
        const res = await DB.blog
          .any(checkUrlQuery, [href])
          .catch((err) => console.log("Error occurred ", err));
        
        if (!res.length) {
          await extractAndSaveData(href);
        } else console.log("Skipping... Record already exist.");
      }

  }

  // Close the WebDriver session
  if (driver) await driver.quit();
  console.log("Scrapping completed.")
};

module.exports = medium_posts;
