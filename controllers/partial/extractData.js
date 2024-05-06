const {
  evaluateArticleType,
  extractLanguageFromUrl,
  checkSearchTerm,
  getDocumentMeta,
  article_types,
  getDate
} = include("services/");
const executePythonScriptAndGetMetadata = require("./executePython");
const { By } = require("selenium-webdriver");
const { config } = include("config/");
const cheerio = require("cheerio");

const extractDataFromUrl = async (driver, url, ignoreRelevanceCheck=false) => {
  let data = {
    url,
    articleTitle: null,
    postedDate: null,
    article_type: null,
    postedDateStr: null,
    country: null,
    content: null,
    html_content: null,
    raw_html: null,
    languageName: null,
    iso3: null,
    parsed_date: null
  };

  try {
    // Navigate to the URL
    await driver.get(url);

    // Evaluate article type
    data.article_type = await evaluateArticleType(url);

    // Extract language from URL
    data.languageName = (await extractLanguageFromUrl(url)) || "en";

    // Extract HTML content
    data.raw_html = await driver.getPageSource();

    // Extract article metadata based on type
    if (data.article_type === "document") {
      try {
        if (url.includes(".pdf") || url.includes(".PDF")) {
          // Extract PDF content and metadata
          const pdfContent = await getPdfMetadataFromUrl(url);
          data.content = pdfContent?.text || null;
          data.postedDate =
            new Date(pdfContent?.metadata?._metadata["xmp:createdate"]) || null;
          data.postedDateStr =
            pdfContent?.metadata?._metadata["xmp:createdate"] || null;
          data.articleTitle =
            pdfContent?.metadata?._metadata["dc:title"] ||
            pdfContent?.text?.substring(0, 100) ||
            null;
          data.country = countryName;
        } 
      } catch (error) {
        console.error("Error extracting document metadata:", error);
      }
    } // Extract article metadata based on type
    else if (data.article_type === "project") {
      try {
        // Your logic for extracting project metadata
        data.articleTitle =
          (await driver
            .findElement(
              By.css(config["title.element.project_page.css_selector"])
            )
            .getText()) ||
          (await driver
            .findElement(
              By.css(config["title_2.element.project_page.css_selector"])
            )
            .getText()) ||
          null;

        data.postedDateStr =
          (await driver
            .findElement(
              By.css(
                config["posted_date_str.element.project_page.css_selector"]
              )
            )
            .getText()) || null;

        data.postedDate = isNaN(new Date(data.postedDateStr))
          ? null
          : new Date(data.postedDateStr);
      } catch (error) {
        console.error("Error extracting project metadata:", error);
      }
    } // Extract article metadata based on type
    else if (data.article_type === "publications") {
      try {
        let titleElement = await driver.findElement(
          By.css(".publication-card__title .coh-heading")
        );
        data.articleTitle = await titleElement.getText();

        data.postedDateStr =
          (await driver
            .findElement(
              By.css(config["posted_date_str.element.publication.css_selector"])
            )
            .getText()) || null;

        data.postedDate = isNaN(new Date(data.postedDateStr))
          ? null
          : new Date(data.postedDateStr);

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
              data.content += `${metadata?.content} || ''` + "\n";
              data.postedDate = isNaN(new Date(metadata?.created))
                ? null
                : new Date(metadata?.created);
              data.raw_html = data.content;
            } else {
              // Handle case when metadata is null
              console.log("err ", metadata);
            }
          });
          exe_file = false;
        }
      } catch (error) {
        console.error("Error extracting publications metadata:", error);
      }
    } // Extract article metadata based on type
    else if (url.includes(".medium.com")) {
      try {
        // Try to find and click on the close button if it exists
        try {
          const closeButton = await driver.findElement(
            By.css('[data-testid="close-button"]')
          );
          await closeButton.click();
          await driver.sleep(2000);
        } catch (error) {
          console.error("Modal not found or could not be closed:", error);
        }

        // Scroll to the bottom of the page
        let lastHeight = await driver.executeScript(
          "return document.body.scrollHeight"
        );
        while (true) {
          await driver.executeScript(
            "window.scrollTo(0, document.body.scrollHeight);"
          );
          await driver.sleep(2000); // Adjust the interval as needed
          let newHeight = await driver.executeScript(
            "return document.body.scrollHeight"
          );
          if (newHeight === lastHeight) {
            // If the scroll position no longer changes, break out of the loop
            break;
          }
          lastHeight = newHeight;
        }

        data.postedDateStr =
          (await driver
            .findElement(By.css('[data-testid="storyPublishDate"]'))
            .getText()) || null;
        data.postedDate = isNaN(new Date(data.postedDateStr))
          ? null
          : new Date(data.postedDateStr);
        data.languageName = null;

        data.articleTitle =
          (await driver
            .findElement(By.css('[data-testid="storyTitle"]'))
            .getText()) || null;

        const contentElements = await driver.findElements(
          By.css("[data-selectable-paragraph]")
        );

        data.content = "";
        for (let i = 0; i < contentElements.length; i++) {
          const text = await contentElements[i].getText();
          data.content += text + "\n";
        }
      } catch (error) {
        console.error("Error extracting Medium post metadata:", error);
      }
    } // Extract article metadata based on type
    else if (article_types.filter((p) => url.includes(p)).length > 0) {
      try {
        data.articleTitle =
          (await driver
            .findElement(By.className(config["title.element.blog.classname"]))
            .getText()) || null;

        data.postedDateStr =
          (await driver
            .findElement(
              By.className(config["posted_date_str.element.blog.classname"])
            )
            .getText()) || null;

        data.postedDate = isNaN(new Date(data.postedDateStr))
          ? null
          : new Date(data.postedDateStr);
      } catch (error) {
        console.error("Error extracting blog metadata:", error);
      }
    } else {
      try {
        // Default logic for extracting metadata

        data.articleTitle =
          (await driver
            .findElement(By.css(config["title.element.webpage.css_selector"]))
            .getText()) ||
          (await driver
            .findElement(By.css(config["title2.element.webpage.css_selector"]))
            .getText()) ||
          null;

        data.postedDateStr = null;
        data.postedDate = null;
      } catch (error) {
        console.error("Error extracting default metadata:", error);
      }
    }

    if (data.content == null) {
      const $ = cheerio.load(data.raw_html);
      $(
        "section.featured-stories.recent-news.featured-card-container"
      ).replaceWith("");
      $("header").replaceWith("");
      $("footer").replaceWith("");
      $("script").replaceWith("");
      $("style").replaceWith("");
      $("meta").replaceWith("");
      $("iframe").replaceWith("");

      const content = $("body").text();
      data.html_content = content;
      data.content = content;
    }

    // Check relevance of document content
    if (
      (!checkSearchTerm(data.content).length ||
      !checkSearchTerm(data.html_content).length)
      && !ignoreRelevanceCheck
    ) {
      return null;
    }

    // Extract document meta
    const [lang, location, meta] = await getDocumentMeta(data.html_content);
    data.iso3 = location?.location?.country;
    data.language = lang?.lang;
    // data.parsed_date = await getDate(data.raw_html);

    return data;
  } catch (error) {
    console.error("Error extracting data from URL:", error);
    return null;
  }
};

module.exports = extractDataFromUrl;
