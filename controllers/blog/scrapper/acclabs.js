require("dotenv").config();
const { Builder, By, until } = require("selenium-webdriver");
const extractAndSaveData = require("./save");
const { DB } = include("db");
const { checkUrlQuery } = require("./scrap-query");
const setupWebDriver = require("../partial/webdriver");

const acclab_publications = async () => {
  const baseurls = [
    "https://www.undp.org/acceleratorlabs/globalpublications",
    "https://www.undp.org/acceleratorlabs/countrypublications",
    "https://www.undp.org/acceleratorlabs/blog",
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
  async function getButton() {
    let viewMoreButton;
    try {
      // Try locating the element by className 'load-more-custom'
      viewMoreButton = await driver.findElement(
        By.className("load-more-custom")
      );
    } catch (error1) {
      try {
        // If element with class 'load-more-custom' is not found, try locating it by CSS selector
        viewMoreButton = await driver.findElement(
          By.css('.pager__item > .button[title="Load more items"]')
        );
      } catch (error2) {
        viewMoreButton = null;
        // If both class names do not exist, handle the error
        console.log(
          "Both class names 'load-more-custom' and '.pager__item > .button[title=\"Load more items\"]' not found."
        );
      }
    }
    return viewMoreButton;
  }
  // Loop through each base URL
  for (const baseUrl of baseurls) {
    // Navigate to the base website
    await driver.get(baseUrl);
    let esp = 0;
    let urls = [];
    let cards = [];

    try {
      // Define a function to scroll an element into view using JavaScript
      async function scrollIntoView(element) {
        await driver.executeScript(
          "arguments[0].scrollIntoView(false);",
          element
        );
        await driver.wait(until.elementIsVisible(element), 10000); // Adjust the timeout as needed
      }

      // Loop to scroll to the "View More" button and click it until it's no longer visible
      while (true) {
        let viewMoreButton = await getButton();

        if (!viewMoreButton || esp > 5) break; // Exit the loop if the button is not found

        try {
          await scrollIntoView(viewMoreButton);
          await driver.sleep(1000);
          await viewMoreButton.click();
          await driver.sleep(2000);

          // Get all the <a> tags within the content cards
          cards = await driver.findElements(By.className("content-card"));
        } catch (e) {
          console.log("err ", e);
          viewMoreButton = await getButton();
          esp += 1;
        }
      }

      for (const card of cards) {
        const link = await card.findElement(By.tagName("a"));
        const href = await link.getAttribute("href");
        urls.push(href);
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
    } catch (error) {
      console.error("Error occurred:", error);
    }
  }

  // Close the WebDriver session
  if (driver) await driver.quit();
};

module.exports = acclab_publications;
