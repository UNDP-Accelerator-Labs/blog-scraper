require('dotenv').config();
const { chromeOption, config } = require('../config')
const {Builder, By, Key, until} = require('selenium-webdriver');
const DB = require('../db/index').DB

const { evaluateArticleType, extractLanguageFromUrl, article_types } = require('../utils');
const { saveQuery, saveHrefLinks, updateQuery } = require('./query');
const getPdfMetadataFromUrl = require('./pdf');

const getWordDocumentMetadataFromUrl = require('./docx');

// Start WebDriver
let driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOption)
    .build();

const extractAndSaveData = async (url, id = null, countryName = null ) => {
  // Navigate to the URL
  await driver.get(url);

  let articleTitle = null;
  let postedDate = null;
  let country = null;
  let contentElements = [];
  let content = null;

  let languageName = await extractLanguageFromUrl(url) ||  'en';
  let postedDateStr = null;
  let archorTags = [];
  let hrefObj = []
  

  let article_type = await evaluateArticleType(url);
  let html_content;

  try{
    html_content = await driver.findElement(By.tagName(config['html_content.element.article_page.tagname'])).getText() || null;
  } catch(err){ html_content = null }

  let raw_html = await driver.getPageSource();

  if(article_type == 'document'){
    if(url.includes('.pdf') || url.includes('.PDF')){
      // Extract pdf content and metadata
      const pdfContent = await getPdfMetadataFromUrl(url) || {};
      content = await pdfContent?.text || null;
      postedDate = new Date(pdfContent?.metadata?._metadata['xmp:createdate']) || null;
      postedDateStr = await pdfContent?.metadata?._metadata['xmp:createdate'] || null;
      articleTitle = await pdfContent?.metadata?._metadata['dc:title'] || pdfContent?.text?.substring(0, 100) || null;

      country = countryName;

    }
    else if(url.includes('.docx') // TODO:: Fix bug in word doc extract
    || url.includes('.doc')
    || url.includes('.odt') 
    || url.includes('.rtf') 
    || url.includes('.txt')
    || url.includes('docs.goo') 
    ){
      // Extract docx content and metadata
      // const docxContent = await getWordDocumentMetadataFromUrl(url);
      // content = docxContent?.text || '';
      // postedDate = docxContent?.metadata?.creationDate || new Date();
      // postedDateStr = docxContent?.metadata?.creationDate || '';
      // articleTitle = docxContent?.metadata?.title ||  '';

      return;
    }

  }
  else if ( article_type == 'project'){

    try {
      articleTitle = await driver.findElement(By.css(config["title.element.project_page.css_selector"])).getText() ||
      await driver.findElement(By.css(config["title_2.element.project_page.css_selector"])).getText();
    } catch(err){ 
      articleTitle = null;
    }
    
    try{
      postedDateStr = await driver.findElement(By.css(config['posted_date_str.element.project_page.css_selector'])).getText() || null;
    }
    catch(err){
      postedDateStr = null;
    }

    postedDate = isNaN(new Date(postedDateStr)) ? null : new Date(postedDateStr);

    try{
      contentElements = await driver.findElements(By.css(config['content.element.project_page.css_selector']));
    }
    catch (err){ contentElements = []}

    try{
      archorTags = await driver.findElements(By.css(config['content_url_list.elements.project_page.css_selector']));
    }
    catch (err){ archorTags = []}

    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const hasFeaturedClass = await contentElements[i].getAttribute('class').then(classes => classes.includes('featured-stories'));
      if (!hasFeaturedClass) {
        const text = await contentElements[i].getText();
        content += text + '\n';
      }
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const hasFeaturedClass = await archorTags[i].getAttribute('class').then(classes => classes.includes('featured-stories'));
      if (!hasFeaturedClass) {
        const linktext = await archorTags[i].getText();

        try{
          href = await archorTags[i].getAttribute(config['content_url.element.project_page.attribute']);
        }catch(err){ href = ""}

        hrefObj.push({
          linktext,
          href
        })

      }
    }

  }
  else if (article_type == 'publications'){
    
    try{
      articleTitle = await driver.findElement(By.css(config['itle.element.publication.css_selector'])).getText() || null;
    }
    catch(err){ articleTitle = null }

    try{
      postedDateStr = await driver.findElement(By.css(config['posted_date_str.element.publication.css_selector'])).getText() || null;
    }
    catch(err){ postedDateStr = null }

    postedDate = isNaN(new Date(postedDateStr)) ? null :  new Date(postedDateStr);
    try{
      country = await driver.findElement(By.css(config['country_name.element.publication.css_selector'])).getText() || null;
    }
    catch(err){ country = null }

    try{
      contentElements = await driver.findElements(By.css(config["content.elements.publication.css_selector"]));
    }
    catch (err){
      contentElements = [];
    }

    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const hasFeaturedClass = await contentElements[i].getAttribute('class').then(classes => classes.includes('featured-stories'));
      if (!hasFeaturedClass) {
        const text = await contentElements[i].getText();
        content += text + '\n';
      }
    }
    
  }
  else if (url.includes('.medium.com')){
    try{
      postedDateStr = await driver.findElement(By.css(config["posted_date_str.element.medium_post.css_selector"])).getText() || null;
    }
    catch(err){ postedDateStr = null }
    postedDate = isNaN(new Date(postedDateStr)) ? null :  new Date(postedDateStr);
    languageName = null;

    try{
      articleTitle = await driver.findElement(By.className(config["title.element.medium_post.classname"])).getText() || null;
    }catch(err){ articleTitle = null }

    try{
      country = await driver.findElement(By.css(config["country_name.element.medium_post.css_selector"])).getText() || null;
    }catch(err){ country = null }
    
    try{
      contentElements = await driver.findElements(By.css(config["content.elements.medium_post.css_selector"]));
    }catch(err){ contentElements = [] }

    // // Extract the content
    try{
      archorTags = await driver.findElements(By.css(config["content_url.elements.medium_post.css_selector"]));
    }catch (err){ archorTags= []}

    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const text = await contentElements[i].getText();
      content += text + '\n';
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      let  href;
      try{
         href = await archorTags[i].getAttribute(config['content_url.element.project_page.attribute']);
      }catch(err){ href = ""}

      hrefObj.push({
        linktext,
        href
      })
    }

  }
  else if (article_types.filter(p => url.includes(p)).length > 0) {
    try{
      articleTitle = await driver.findElement(By.className(config["title.element.blog.classname"])).getText() || null;
    }catch(err){ articleTitle = null }

    try{
      postedDateStr = await driver.findElement(By.className(config["posted_date_str.element.blog.classname"])).getText() || null;
    }catch(err){ postedDateStr = null }

    postedDate = isNaN(new Date(postedDateStr)) ? null : new Date(postedDateStr) ;

    try{
      country = await driver.findElement(By.css(config["country_name.element.blog.css_selector"])).getText() || null;
    }catch(err){ country = null }
    
    try{
      contentElements = await driver.findElements(By.css(config["content.elements.blog.css_selector"])) || [];
    }catch(err){ contentElements = [] }
    
    try{
      archorTags = await driver.findElements(By.css(config["content_url.elements.blog.css_selector"])) || [];
    }
    catch (err){ archorTags = []}

    //extract content of a blog
    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const hasFeaturedClass = await contentElements[i].getAttribute('class').then(classes => classes.includes('featured-stories'));
      if (!hasFeaturedClass) {
        const text = await contentElements[i].getText();
        content += text + '\n';
      }
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      let  href;
      try{
         href = await archorTags[i].getAttribute(config['content_url.element.project_page.attribute']);
      }catch(err){ href = ""}

      hrefObj.push({
        linktext,
        href
      })
    }
  }
  else {
     try{
      articleTitle = await driver.findElement(By.css(config["title.element.webpage.css_selector"])).getText() || 
      await driver.findElement(By.css(config["title2.element.webpage.css_selector"])).getText()
      || null; 
     }catch (err){ articleTitle = null;}

     postedDateStr = null;
     postedDate = null;
 
     try{
      country = await driver.findElement(By.css(config["country_name.element.blog.css_selector"])).getText() || null;
    }catch(err){ country = null}
 
    try{
      archorTags = await driver.findElements(By.css('a'));
     }
     catch (err){  archorTags = [] }
 
     content = null;

     //extract href link and text in a blog if it exist
     for (let i = 0; i < archorTags?.length; i++) {
       const linktext = await archorTags[i].getText();
       try{
        href = await archorTags[i].getAttribute(config['content_url.element.project_page.attribute']);
      }catch(err){ href = ""}

       hrefObj.push({
         linktext,
         href
       })
     }
  }

  // Save the data to the database if id = null
  if(id == null || isNaN(id) == true ){
      await DB.blog.oneOrNone(
        saveQuery(url, country, languageName, articleTitle, postedDate, content, article_type, postedDateStr, html_content, raw_html)
      )
      .then(async (data) => {
          //save href links in a blog if it exist
          if(hrefObj.length > 0){
            hrefObj.forEach(obj=> obj.article_id = data.id );
            
            await DB.blog.oneOrNone(
              saveHrefLinks(hrefObj)
            )
            .then((res) => {
              hrefObj = [];
            })
            .catch(err => {
              console.error('Error saving href to table:', err.message);
              hrefObj = [];
            });
          }
      })
      .catch(err=>{
        console.log('Error while saving content to db ', err.message )
      })

  }
  else{
    //update the record in db
    await DB.blog.any(
          updateQuery(id, url, country, languageName, articleTitle, postedDate, content, article_type, postedDateStr, html_content, raw_html) 
        )
        .catch(err => {
          console.error('Error occurred while updating content.');
        });
  }

  // Quit WebDriver
  // driver.quit();
  return;
}

module.exports = extractAndSaveData;