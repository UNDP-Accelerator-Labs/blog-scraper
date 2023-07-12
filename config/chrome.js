const chrome = require('selenium-webdriver/chrome');

const config = require('./config')

exports.chromeOption = function(){
    // Set up the Chrome options
    const options = new chrome.Options();

    if(config['headless.run']){
        options.addArguments('--headless'); // Run Chrome in headless mode (without a UI)
        options.addArguments('--window-size=1920,1080'); 
    }
    else{
          options.addArguments('--start-maximized'); // Maximize the window
          options.addArguments('--disable-gpu'); // Disable the GPU
    }
    
    options.addArguments('--no-sandbox') // Disable the sandbox
    options.addArguments('--disable-dev-shm-usage'); // Disable shared memory usage

    // Set up the WebDriver
    return options;
}()