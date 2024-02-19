require("dotenv").config();
const { Builder, By } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const extractAndSaveData = require("./saveToDb");
const { DB } = require("../../db");
const { checkUrlQuery } = require("./scrap-query");

const acclab_publications = async () => {
  const baseurls = [
    "https://www.undp.org/acceleratorlabs/globalpublications",
    "https://www.undp.org/acceleratorlabs/countrypublications",
    'https://www.undp.org/acceleratorlabs/blog',
  ];

  // Set up the WebDriver
  let options = new firefox.Options();
  options.headless();
  let driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();

  // Loop through each base URL
  for (const baseUrl of baseurls) {
    // Navigate to the base website
    await driver.get(baseUrl);

    try {
      // Define a function to scroll an element into view using JavaScript
      async function scrollIntoView(element) {
        await driver.executeScript(
          'arguments[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });',
          element
        );
      }

      // Loop to scroll to the "View More" button and click it until it's no longer visible
      while (true) {
        let viewMoreButton
        try{
            viewMoreButton = await driver.findElement(
                By.className("load-more-custom")
              );
        }catch(e){}

        if (!viewMoreButton) break; // Exit the loop if the button is not found
        await scrollIntoView(viewMoreButton);
        await viewMoreButton.click();
        await driver.sleep(4000); // Adjust the sleep duration as needed
      }

      // Get all the <a> tags within the content cards
      const contentCards = await driver.findElements(
        By.className("content-card")
      );
      for (const card of contentCards) {
        const link = await card.findElement(By.tagName("a"));
        const href = await link.getAttribute("href");
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
