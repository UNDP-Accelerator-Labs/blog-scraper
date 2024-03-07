require("dotenv").config();
const { firefoxOption, config } = require("../../config");
const { Builder, By } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const { spawn } = require("child_process");
const { DB } = require("../../db");
const path = require("path");

const {
  evaluateArticleType,
  extractLanguageFromUrl,
  article_types,
  checkSearchTerm,
  getDocumentMeta,
} = include("services/");
const { saveQuery, saveHrefLinks, updateQuery } = require("./scrap-query");
const getPdfMetadataFromUrl = require("./pdf");
const fs = require("fs");

const extractAndSaveData = async (url, id = null, countryName = null) => {
  // Start WebDriver
  let options = new firefox.Options();
  const downloadsFolder = path.join(__dirname, "../../downloads");
  options.headless();
  options.setPreference("browser.download.folderList", 2);
  options.setPreference("browser.download.dir", downloadsFolder);
  // options.setPreference('browser.helperApps.neverAsk.saveToDisk', 'application/pdf');

  // Navigate to the URL
  if (!url) return;

  let driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();

  try {
    await driver.manage().window().maximize();
  } catch (e) {}

  await driver.get(url);

  let articleTitle = null;
  let postedDate = null;
  let country = null;
  let contentElements = [];
  let content = null;

  let languageName = (await extractLanguageFromUrl(url)) || "en";
  let postedDateStr = null;
  let archorTags = [];
  let hrefObj = [];

  let article_type = await evaluateArticleType(url);
  let html_content;

  try {
    html_content =
      (await driver
        .findElement(
          By.tagName(config["html_content.element.article_page.tagname"])
        )
        .getText()) || null;
  } catch (err) {
    html_content = null;
  }

  let raw_html = await driver.getPageSource();

  if (article_type == "document") {
    if (url.includes(".pdf") || url.includes(".PDF")) {
      // Extract pdf content and metadata
      const pdfContent = (await getPdfMetadataFromUrl(url)) || {};
      content = (await pdfContent?.text) || null;
      postedDate =
        new Date(pdfContent?.metadata?._metadata["xmp:createdate"]) || null;
      postedDateStr =
        (await pdfContent?.metadata?._metadata["xmp:createdate"]) || null;
      articleTitle =
        (await pdfContent?.metadata?._metadata["dc:title"]) ||
        pdfContent?.text?.substring(0, 100) ||
        null;

      country = countryName;
    } else if (
      url.includes(".docx") || // TODO:: Fix bug in word doc extract
      url.includes(".doc") ||
      url.includes(".odt") ||
      url.includes(".rtf") ||
      url.includes(".txt") ||
      url.includes("docs.goo")
    ) {
      // Extract docx content and metadata
      // const docxContent = await getWordDocumentMetadataFromUrl(url);
      // content = docxContent?.text || '';
      // postedDate = docxContent?.metadata?.creationDate || new Date();
      // postedDateStr = docxContent?.metadata?.creationDate || '';
      // articleTitle = docxContent?.metadata?.title ||  '';

      return;
    }
  } else if (article_type == "project") {
    try {
      articleTitle =
        (await driver
          .findElement(
            By.css(config["title.element.project_page.css_selector"])
          )
          .getText()) ||
        (await driver
          .findElement(
            By.css(config["title_2.element.project_page.css_selector"])
          )
          .getText());
    } catch (err) {
      articleTitle = null;
    }

    try {
      postedDateStr =
        (await driver
          .findElement(
            By.css(config["posted_date_str.element.project_page.css_selector"])
          )
          .getText()) || null;
    } catch (err) {
      postedDateStr = null;
    }

    postedDate = isNaN(new Date(postedDateStr))
      ? null
      : new Date(postedDateStr);

    try {
      contentElements = await driver.findElements(
        By.css(config["content.element.project_page.css_selector"])
      );
    } catch (err) {
      contentElements = [];
    }

    try {
      archorTags = await driver.findElements(
        By.css(config["content_url_list.elements.project_page.css_selector"])
      );
    } catch (err) {
      archorTags = [];
    }

    content = "";
    for (let i = 0; i < contentElements.length; i++) {
      const hasFeaturedClass = await contentElements[i]
        .getAttribute("class")
        .then((classes) => classes.includes("featured-stories"));
      if (!hasFeaturedClass) {
        const text = await contentElements[i].getText();
        content += text + "\n";
      }
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const hasFeaturedClass = await archorTags[i]
        .getAttribute("class")
        .then((classes) => classes.includes("featured-stories"));
      if (!hasFeaturedClass) {
        const linktext = await archorTags[i].getText();

        try {
          href = await archorTags[i].getAttribute(
            config["content_url.element.project_page.attribute"]
          );
        } catch (err) {
          href = "";
        }

        hrefObj.push({
          linktext,
          href,
        });
      }
    }
  } else if (article_type == "publications") {
    try {
      let titleElement = await driver.findElement(
        By.css(".publication-card__title .coh-heading")
      );
      articleTitle = await titleElement.getText();
    } catch (err) {
      articleTitle = null;
    }

    try {
      postedDateStr =
        (await driver
          .findElement(
            By.css(config["posted_date_str.element.publication.css_selector"])
          )
          .getText()) || null;
    } catch (err) {
      postedDateStr = null;
    }

    postedDate = isNaN(new Date(postedDateStr))
      ? null
      : new Date(postedDateStr);
    try {
      country =
        (await driver
          .findElement(
            By.css(config["country_name.element.publication.css_selector"])
          )
          .getText()) || null;
    } catch (err) {
      country = null;
    }

    try {
      contentElements = await driver.findElements(
        By.css(config["content.elements.publication.css_selector"])
      );
    } catch (err) {
      contentElements = [];
    }

    content = "";
    for (let i = 0; i < contentElements.length; i++) {
      const hasFeaturedClass = await contentElements[i]
        .getAttribute("class")
        .then((classes) => classes.includes("featured-stories"));
      if (!hasFeaturedClass) {
        const text = await contentElements[i].getText();
        content += text + "\n";
      }
    }

    let exe_file = false;
    try {
      const download = await driver.findElement(By.css("a.download"));
      if (download) {
        exe_file = true;
        try {
          await driver.executeScript(
            "arguments[0].scrollIntoView(false);",
            download
          );
          await driver.sleep(1000);

          await download.click();
          await driver.sleep(1000);
        } catch (e) {
          exe_file = false;
        }
        await driver.sleep(1000);
        const modals = await driver.findElements(
          By.className("chapter-item download-row")
        );
        await driver.sleep(1000);
        if (modals.length > 0) {
          let modalToClick;

          for (const modal of modals) {
            let englishButton;
            try {
              englishButton = await modal.findElement(
                By.xpath(".//a[.//div[text()='English']]")
              );
            } catch (e) {}
            if (englishButton) {
              modalToClick = modal;
              break; // Stop the loop once we find a modal with English button
            }
          }

          if (!modalToClick && modals.length > 0) {
            modalToClick = modals[0]; // If no modal with English button is found, click on the first modal
          }

          if (modalToClick) {
            await modalToClick.click();
            await driver.sleep(1000);
          }
        }
      }
    } catch (e) {
      console.log(e);
    }

    if (exe_file) {
      await executePythonScriptAndGetMetadata().then((metadata) => {
        if (metadata) {
          content += metadata?.content + "\n";
          postedDate = isNaN(new Date(metadata?.created))
            ? null
            : new Date(metadata?.created);
          raw_html = content;
        } else {
          // Handle case when metadata is null
          console.log("err ", metadata);
        }
      });
      exe_file = false;
    }
  } else if (url.includes(".medium.com")) {
    // Try to find and click on the close button if it exists
    try {
      const closeButton = await driver.findElement(By.css('[data-testid="close-button"]'));
      await closeButton.click();
      await driver.sleep(2000);
    } catch (error) {
      console.error("Modal not found or could not be closed:", error);
    }

    try {
      const closeButton = await driver.findElement(By.css('[data-testid="close-button"]'));
      await closeButton.click();
      await driver.sleep(2000);
    } catch (error) {
      console.error("Modal not found or could not be closed:", error);
    }

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

    try {
      postedDateStr =
        (await driver
          .findElement(By.css('[data-testid="storyPublishDate"]'))
          .getText()) || null;
    } catch (err) {
      postedDateStr = null;
    }
    postedDate = isNaN(new Date(postedDateStr))
      ? null
      : new Date(postedDateStr);
    languageName = null;

    try {
      articleTitle =
        (await driver
          .findElement(By.css('[data-testid="storyTitle"]'))
          .getText()) || null;
    } catch (err) {
      articleTitle = null;
    }

    try {
      country =
        (await driver
          .findElement(
            By.css(config["country_name.element.medium_post.css_selector"])
          )
          .getText()) || null;
    } catch (err) {
      country = null;
    }

    try {
      contentElements = await driver.findElements(
        By.css("[data-selectable-paragraph]")
      );
    } catch (err) {
      contentElements = [];
    }

    // // Extract the content
    try {
      archorTags = await driver.findElements(
        By.css(config["content_url.elements.medium_post.css_selector"])
      );
    } catch (err) {
      archorTags = [];
    }

    content = "";
    for (let i = 0; i < contentElements.length; i++) {
      const text = await contentElements[i].getText();
      content += text + "\n";
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      let href;
      try {
        href = await archorTags[i].getAttribute(
          config["content_url.element.project_page.attribute"]
        );
      } catch (err) {
        href = "";
      }

      hrefObj.push({
        linktext,
        href,
      });
    }
  } else if (article_types.filter((p) => url.includes(p)).length > 0) {
    try {
      articleTitle =
        (await driver
          .findElement(By.className(config["title.element.blog.classname"]))
          .getText()) || null;
    } catch (err) {
      articleTitle = null;
    }

    try {
      postedDateStr =
        (await driver
          .findElement(
            By.className(config["posted_date_str.element.blog.classname"])
          )
          .getText()) || null;
    } catch (err) {
      postedDateStr = null;
    }

    postedDate = isNaN(new Date(postedDateStr))
      ? null
      : new Date(postedDateStr);

    try {
      country =
        (await driver
          .findElement(By.css(config["country_name.element.blog.css_selector"]))
          .getText()) || null;
    } catch (err) {
      country = null;
    }

    try {
      contentElements =
        (await driver.findElements(
          By.css(config["content.elements.blog.css_selector"])
        )) || [];
    } catch (err) {
      contentElements = [];
    }

    try {
      archorTags =
        (await driver.findElements(
          By.css(config["content_url.elements.blog.css_selector"])
        )) || [];
    } catch (err) {
      archorTags = [];
    }

    //extract content of a blog
    content = "";
    for (let i = 0; i < contentElements.length; i++) {
      const hasFeaturedClass = await contentElements[i]
        .getAttribute("class")
        .then((classes) => classes.includes("featured-stories"));
      if (!hasFeaturedClass) {
        const text = await contentElements[i].getText();
        content += text + "\n";
      }
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      let href;
      try {
        href = await archorTags[i].getAttribute(
          config["content_url.element.project_page.attribute"]
        );
      } catch (err) {
        href = "";
      }

      hrefObj.push({
        linktext,
        href,
      });
    }
  } else {
    try {
      articleTitle =
        (await driver
          .findElement(By.css(config["title.element.webpage.css_selector"]))
          .getText()) ||
        (await driver
          .findElement(By.css(config["title2.element.webpage.css_selector"]))
          .getText()) ||
        null;
    } catch (err) {
      articleTitle = null;
    }

    postedDateStr = null;
    postedDate = null;

    try {
      country =
        (await driver
          .findElement(By.css(config["country_name.element.blog.css_selector"]))
          .getText()) || null;
    } catch (err) {
      country = null;
    }

    try {
      archorTags = await driver.findElements(By.css("a"));
    } catch (err) {
      archorTags = [];
    }

    content = null;

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      try {
        href = await archorTags[i].getAttribute(
          config["content_url.element.project_page.attribute"]
        );
      } catch (err) {
        href = "";
      }

      hrefObj.push({
        linktext,
        href,
      });
    }
  }

  //check relevance of document
  if (!checkSearchTerm(content).length || !checkSearchTerm(html_content).length)
    return;

  const [lang, location, meta] = await getDocumentMeta(html_content);
  const iso3 = location?.location?.country;
  const language = lang?.lang;

  // Save the data to the database if id = null
  if (id == null || isNaN(id) == true) {
    await DB.blog
      .tx(async (t) => {
        const batch = [];

        const record = await
        t.oneOrNone(
          saveQuery(
            url,
            language,
            articleTitle,
            postedDate,
            article_type,
            postedDateStr,
            "2",
            iso3,
          )
        );
        batch.push(
          t.any(
            `
        INSERT INTO article_content (article_id, content)
        VALUES ($1, $2)
      `,
            [record?.id, content]
          )
        );

        batch.push(
          t.any(
            `
            INSERT INTO  article_html_content (article_id, html_content)
            VALUES ($1, $2)
      `,
            [record?.id, html_content]
          )
        );

        batch.push(
          t.any(
            `
            INSERT INTO  raw_html (article_id, raw_html)
            VALUES ($1, $2)
          `,
                [record?.id, raw_html]
              )
        );

        return t.batch(batch).catch((err) => console.log(err));
      })
      .then(r=> console.log('Saving record successful.'))
      .catch((err) => console.log(err));
  } else {
    //update the record in db
    await DB.blog
      .tx(async (t) => {
        const batch = [];

        batch.push(
          t.oneOrNone(
            updateQuery(
              id,
              url,
              language,
              articleTitle,
              postedDate,
              article_type,
              postedDateStr,
              iso3,
              "2"
            )
          )
        );

        batch.push(
          t.any(
            `
        UPDATE article_content
        SET content = $2
        WHERE article_id = $1
      `,
            [id, content]
          )
        );

        batch.push(
          t.any(
            `
        UPDATE article_html_content
        SET html_content = $2
        WHERE article_id = $1
      `,
            [id, html_content]
          )
        );

        batch.push(
          t.any(
            `
        UPDATE raw_html
        SET raw_html = $2
        WHERE article_id = $1
      `,
            [id, raw_html]
          )
        );
        return t.batch(batch).catch((err) => console.log(err));
      })
      .then(r=> console.log('Updating record successful.'))
      .catch((err) => console.log(err));
  }

  // Quit WebDriver
  driver.quit();
  return;
};
// extractAndSaveData()
module.exports = extractAndSaveData;

const executePythonScriptAndGetMetadata = async () => {
  let pythonOutput = "";

  const executePythonScript = async () => {
    const pythonProcess = await spawn("python3", ["scripts/parsers/pdf.py"]);

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data;
    });

    // Listen for errors from the Python script (stderr)
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python stderr: ${data}`);
    });

    return new Promise((resolve, reject) => {
      // Listen for Python script exit
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(pythonOutput.trim());
        } else {
          reject(new Error(`Python process exited with code ${code}`));
        }
      });
    });
  };

  try {
    const pythonOutput = await executePythonScript();
    if (pythonOutput === "null") {
      console.log("No metadata found in document files.");
    } else {
      try {
        const metadata = JSON.parse(pythonOutput);
        return metadata;
      } catch (error) {
        console.error("Error parsing metadata:", pythonOutput);
      }
    }
  } catch (error) {
    console.error("Error executing Python script:", error);
  }

  return null; // Return null if any error occurs
};
