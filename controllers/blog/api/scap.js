const setupWebDriver = require("../partial/webdriver");
const extractDataFromUrl = require("../partial/extractData");
const saveDataToDatabase = require("../partial/saveData");

const getWebContent = async (req, res) => {
  const { url, embed_data } = req.body;

  // Setup WebDriver
  let driver;
  try {
    driver = await setupWebDriver();
  } catch (error) {
    console.error("Error setting up WebDriver:", error);
    return res.status(500).send(error);
  }

  try {
    // Extract data from URL
    const data = await extractDataFromUrl(driver, url, true);

    if (embed_data) {
      // Save data to database
      await saveDataToDatabase(data);
    }
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  } finally {
    // Quit WebDriver
    if (driver) {
      driver.quit();
    }
  }
};

module.exports = getWebContent;
