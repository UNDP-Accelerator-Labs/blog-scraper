const {
  evaluateArticleType,
  extractLanguageFromUrl,
  checkSearchTerm,
  getDocumentMeta,
  article_types,
  getDate,
  getIso3,
} = include("services/");
const getPdfMetadataFromUrl = require("../blog/blog_type/pdf");
const executePythonScriptAndGetMetadata = require("./executePython");
const { By, until } = require("selenium-webdriver");
const { config } = include("config/");
const cheerio = require("cheerio");

const extractTitle = async (driver, selectors) => {
  for (const selector of selectors) {
    try {
      const element = await driver.findElement(By.css(selector));
      return await element.getText();
    } catch (error) {
      console.log("selectors error ", error);
      // continue to the next selector
    }
  }
  return null;
};

const extractContent = async (driver, selectors) => {
  let content = "";
  for (const selector of selectors) {
    try {
      const elements = await driver.findElements(By.css(selector));
      for (const element of elements) {
        content += (await element.getText()) + "\n";
      }
    } catch (error) {
      // continue to the next selector
    }
  }
  return content.trim();
};

const extractPostedDate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date) ? null : date;
};

const extractDataFromUrl = async (
  driver,
  url,
  ignoreRelevanceCheck = false
) => {
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
    parsed_date: null,
  };

  try {
    await driver.get(url);

    data.article_type = await evaluateArticleType(url);
    data.languageName = (await extractLanguageFromUrl(url)) || "en";
    data.raw_html = await driver.getPageSource();

    if (
      data.article_type === "document" &&
      (url.includes(".pdf") || url.includes(".PDF"))
    ) {
      try {
        const pdfContent = await getPdfMetadataFromUrl(url);
        data.content = pdfContent?.text || null;
        data.postedDateStr =
          pdfContent?.metadata?._metadata["xmp:createdate"] || null;
        data.postedDate = extractPostedDate(data.postedDateStr);
        data.articleTitle =
          pdfContent?.metadata?._metadata["dc:title"] ||
          data.content?.substring(0, 100) ||
          null;
      } catch (error) {
        console.error("Error extracting document metadata:", error);
      }
    } else if (data.article_type === "project") {
      try {
        data.articleTitle = await extractTitle(driver, [
          config["title.element.project_page.css_selector"],
          config["title_2.element.project_page.css_selector"],
          "section.innerBannerNoImage__JX6zS.scrolledBanner__XJxL5 .title__n-lM8",
        ]);

        data.postedDateStr = await extractTitle(driver, [
          config["posted_date_str.element.project_page.css_selector"],
        ]);
        data.postedDate = extractPostedDate(data.postedDateStr);

        if (data.articleTitle == null) {
          let element = await driver.wait(
            until.elementLocated(By.css(".title__n-lM8")),
            10000
          );
          data.articleTitle = await element.getText();
        }
      } catch (error) {
        console.error("Error extracting project metadata:", error);
      }
    } else if (data.article_type === "publications") {
      try {
        data.articleTitle = await extractTitle(driver, [
          ".publication-card__title .coh-heading",
        ]);
        data.postedDateStr = await extractTitle(driver, [
          config["posted_date_str.element.publication.css_selector"],
        ]);
        data.postedDate = extractPostedDate(data.postedDateStr);

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
                  break;
                }
              }
              if (!modalToClick && modals.length > 0) {
                modalToClick = modals[0];
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
              data.postedDate = extractPostedDate(metadata?.created);
              data.raw_html = data.content;
            } else {
              console.log("err ", metadata);
            }
          });
          exe_file = false;
        }
      } catch (error) {
        console.error("Error extracting publications metadata:", error);
      }
    } else if (url.includes(".medium.com")) {
      try {
        try {
          const closeButton = await driver.findElement(
            By.css('[data-testid="close-button"]')
          );
          await closeButton.click();
          await driver.sleep(2000);
        } catch (error) {
          console.error("Modal not found or could not be closed:", error);
        }

        let lastHeight = await driver.executeScript(
          "return document.body.scrollHeight"
        );
        while (true) {
          await driver.executeScript(
            "window.scrollTo(0, document.body.scrollHeight);"
          );
          await driver.sleep(2000);
          let newHeight = await driver.executeScript(
            "return document.body.scrollHeight"
          );
          if (newHeight === lastHeight) break;
          lastHeight = newHeight;
        }

        data.postedDateStr = await extractTitle(driver, [
          '[data-testid="storyPublishDate"]',
        ]);
        data.postedDate = extractPostedDate(data.postedDateStr);
        data.languageName = null;
        data.articleTitle = await extractTitle(driver, [
          '[data-testid="storyTitle"]',
        ]);
        data.content = await extractContent(driver, [
          "[data-selectable-paragraph]",
        ]);
        data.html_content = data.content;
      } catch (error) {
        console.error("Error extracting Medium post metadata:", error);
      }
    } else if (article_types.some((p) => url.includes(p))) {
      try {
        data.articleTitle = await extractTitle(driver, [
          config["title.element.blog.classname"],
        ]);

        data.postedDateStr = await extractTitle(driver, [
          config["posted_date_str.element.blog.classname"],
        ]);
        data.postedDate = extractPostedDate(data.postedDateStr);
      } catch (error) {
        console.error("Error extracting blog metadata:", error);
      }
    } else {
      try {
        data.articleTitle = await extractTitle(driver, [
          config["title.element.webpage.css_selector"],
          config["title2.element.webpage.css_selector"],
        ]);
        data.postedDateStr = null;
        data.postedDate = null;
      } catch (error) {
        console.error("Error extracting default metadata:", error);
      }
    }

    //USE CHEERIO TO EXTRACT WEBPAGE CONTENT IF CONTENT IS NULL FROM SELENIUM CLASS/ELEMENT SELECTIONS
    if (data.content === null || !data.content.length) {
      const $ = cheerio.load(data.raw_html);
      $(
        "section.featured-stories.recent-news.featured-card-container"
      ).remove();
      $("div.country-switcher-ajax-wrapper").remove();
      $("div.related-publications").remove();
      $("header, footer, script, style, meta, iframe").remove();
      $("body")
        .find("header, footer, script, style, meta, iframe, noscript")
        .replaceWith(" ");
      $("body")
        .find("div.dialog-off-canvas-main-canvas.layout-container")
        .replaceWith(" ");
      $("body")
        .find("div.dialog-off-canvas-main-canvas.mega-wrapper")
        .replaceWith(" ");
      $("body")
        .find("div.dialog-off-canvas-main-canvas.footer")
        .replaceWith(" ");
      $("body").find("a.skip-link").replaceWith(" ");
      $("body footer").replaceWith(" ");
      let content =
        ["blog", "publications"].includes(data.article_type) ||
        $("body article").length > 0
          ? $("body article").text().trim()
          : $("body").text().trim();

      content = content.replace(/Skip to main content/g, " ");
      content = content.replace(/<iframe.*?<\/iframe>/g, "");

      data.html_content = content;
      data.content = content;
    }

    // Check relevance of document content
    if (
      (!checkSearchTerm(data.content).length ||
        !checkSearchTerm(data.html_content).length) &&
      !ignoreRelevanceCheck
    ) {
      return null;
    }

    if (!data?.content?.length > 0) {
      console.log(" No content could be extracted. Url: ", url);
    }

    // Extract document meta
    const [lang, location, meta] = data?.content
      ? await getDocumentMeta(data.content)
      : [null, null, null];
    let iso3_b = url ? await getIso3(url) : null;
    if (!iso3_b && data.url.includes("/acceleratorlabs/")) {
      iso3_b = "NUL"; //Url matches Global network page.
    }
    data.iso3 = iso3_b ?? location?.location?.country;
    data.language = lang?.lang;

    //USE NLP API TO GE ARTICLE DATE IF DATE EXTRACTION FROM DOM IS NULL
    if (data.postedDate == null) {
      let date = await getDate(data.raw_html);
      if (date && extractPostedDate(date)) {
        data.parsed_date = date;
        data.postedDate = date;
      }
    } else if (data.postedDate) {
      data.parsed_date = data.postedDate;
    }

    return data;
  } catch (error) {
    console.error("Error extracting data from URL:", error);
    return null;
  }
};

module.exports = extractDataFromUrl;
