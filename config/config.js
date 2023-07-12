
const config = {
    "baseUrl" : "https://www.undp.org",
    "headless.run" : true
}

config["baseUrl.basic"] = config['baseUrl'].replace(/^(https?:\/\/)/, "");

module.exports = config;