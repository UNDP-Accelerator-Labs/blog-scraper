const setupWebDriver = require("../partial/webdriver");
const extractDataFromUrl = require("../partial/extractData");
const saveDataToDatabase = require("../partial/saveData");

const extractAndSaveData = async (url, id = null) => {
  // Setup WebDriver
  let driver;
  try {
    driver = await setupWebDriver();
  } catch (error) {
    console.error("Error setting up WebDriver:", error);
    return;
  }

  try {
    // Extract data from URL
    const data = await extractDataFromUrl(driver, url);

    // Save data to database
    await saveDataToDatabase(data, id);
  } catch (error) {
    console.error("Error extracting and saving data:", error);
  } finally {
    // Quit WebDriver
    if (driver) {
      driver.quit();
    }
  }
};

module.exports = extractAndSaveData;
