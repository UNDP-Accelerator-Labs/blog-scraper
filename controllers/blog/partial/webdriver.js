const { Builder } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const path = require("path");

const setupWebDriver = async () => {
  let options = new firefox.Options();
  const downloadsFolder = path.join(__dirname, "../../../downloads");
//   options.headless();
  options.setPreference("browser.download.folderList", 2);
  options.setPreference("browser.download.dir", downloadsFolder);
  return await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();
};

module.exports = setupWebDriver;
