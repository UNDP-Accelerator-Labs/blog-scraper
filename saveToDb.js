require('dotenv').config();
const { chromeOption } = require('./config')
const {Builder, By, Key, until} = require('selenium-webdriver');
const DB = require('./db/index').DB

const { evaluateArticleType, extractLanguageFromUrl, article_types } = require('./utils');
const { saveQuery, saveHrefLinks, updateQuery } = require('./query');
const getPdfMetadataFromUrl = require('./pdf');

const getWordDocumentMetadataFromUrl = require('./docx');

// Start WebDriver
let driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOption)
    .build();

// sample word doc 
// let docurl = 'https://popp.undp.org/_layouts/15/WopiFrame.aspx?sourcedoc=/UNDP_POPP_DOCUMENT_LIBRARY/Public/HR_Non-Staff_International%20Personnel%20Services%20Agreement_IPSA.docx&action=default'
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
  let html_content = await driver.findElement(By.tagName('body')).getText() || null;

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
    else if(url.includes('.docx') 
    || url.includes('.doc')
    || url.includes('.odt') 
    || url.includes('.rtf') 
    || url.includes('.txt')
    || url.includes('docs.goo') 
    ){
      console.log('word doc')
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
      articleTitle = await driver.findElement(By.css('.coh-inline-element.title-heading')).getText() ||
      await driver.findElement(By.css('.coh-heading.color-white')).getText()
      || null;
    } catch(err){ 
      articleTitle = null;
    }
    
    try{
      postedDateStr = await driver.findElement(By.css('.coh-inline-element.column.publication-card__title h6')).getText() || null;
    }
    catch(err){
      postedDateStr = null;
    }

    postedDate = isNaN(new Date(postedDateStr)) ? null : new Date(postedDateStr);

    // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.grid-container p'));
      archorTags = await driver.findElements(By.css('.grid-container a'));
    }
    catch (err){
        console.log('error', err)
    }

    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const text = await contentElements[i].getText();
      content += text + '\n';
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      const href = await archorTags[i].getAttribute('href');
      hrefObj.push({
        linktext,
        href
      })
    }

  }
  else if (article_type == 'publications'){
    
    articleTitle = await driver.findElement(By.css('.coh-inline-element.column')).getText() || null;
    postedDateStr = await driver.findElement(By.css('.coh-inline-element.column.publication-card__title h6')).getText() || null;
    postedDate = isNaN(new Date(postedDateStr)) ? null :  new Date(postedDateStr);
    //Extract country
    country = await driver.findElement(By.css('.site-title a')).getText() || null;

    // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.coh-container.coh-wysiwyg p'));
    }
    catch (err){
        console.log('error', err)
    }

    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const text = await contentElements[i].getText();
      content += text + '\n';
    }
    
  }
  else if (url.includes('.medium.com')){
    postedDateStr = await driver.findElement(By.css('.pw-published-date')).getText() || null;
    postedDate = isNaN(new Date(postedDateStr)) ? null :  new Date(postedDateStr);
    languageName = null;

    // // Extract the article title
    articleTitle = await driver.findElement(By.className('pw-post-title')).getText() || null;

    // //Extract country
    country = await driver.findElement(By.css('.bk a')).getText() || null;

    // // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.gq.gr.gs.gt.gu p'));
      archorTags = await driver.findElements(By.css('.gq.gr.gs.gt.gu a'));
    }
    catch (err){
        console.log('error', err)
    }

    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const text = await contentElements[i].getText();
      content += text + '\n';
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      const href = await archorTags[i].getAttribute('href');
      hrefObj.push({
        linktext,
        href
      })
    }

  }
  else if (article_types.filter(p => url.includes(p)).length > 0) {
    // Extract the article title
    articleTitle = await driver.findElement(By.className('article-title')).getText() || null;

    // Extract the posted date
    postedDateStr = await driver.findElement(By.className('posted-date')).getText() || null;;
    postedDate = isNaN(new Date(postedDateStr)) ? null : new Date(postedDateStr) ;

    //Extract country
    country = await driver.findElement(By.css('.site-title a')).getText() || null;

    // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.coh-inline-element.m-content.coh-wysiwyg p'));
      archorTags = await driver.findElements(By.css('.coh-inline-element.m-content.coh-wysiwyg a'));
    }
    catch (err){
        console.log('error', err)
    }

    //extract content of a blog
    content = '';
    for (let i = 0; i < contentElements.length; i++) {
      const text = await contentElements[i].getText();
      content += text + '\n';
    }

    //extract href link and text in a blog if it exist
    for (let i = 0; i < archorTags?.length; i++) {
      const linktext = await archorTags[i].getText();
      const href = await archorTags[i].getAttribute('href');
      hrefObj.push({
        linktext,
        href
      })
    }
  }
  else {
     // Extract the article title 
     try{
      articleTitle = await driver.findElement(By.css('.coh-heading.heading.h2.coh-style-undp-heading-h2')).getText() || 
      await driver.findElement(By.css('.coh-inline-element.content-box')).getText()
      || null; 
     }
      catch (err){
          console.log('error', err)
      }

     // Extract the posted date
     postedDateStr = null;
     postedDate = null;
 
     //Extract country
     country = await driver.findElement(By.css('.site-title a')).getText() || null;
 
     // Extract the content
     try{
      archorTags = await driver.findElements(By.css('a'));
     }
     catch (err){
         console.log('error', err)
     }
 
     content = '';

     //extract href link and text in a blog if it exist
     for (let i = 0; i < archorTags?.length; i++) {
       const linktext = await archorTags[i].getText();
       const href = await archorTags[i].getAttribute('href');
       hrefObj.push({
         linktext,
         href
       })
     }
  }

  if(content.length <= 0){
    content = null;
  }

  // Save the data to the database if id = null
  if(id == null || isNaN(id) == true ){
    try{
      await DB.blog.none(saveQuery(url, country, languageName, articleTitle, postedDate, content, article_type, postedDateStr, html_content, raw_html))
      .then(async (data) => {
          console.log('saving article content to db')

          //save href links in a blog if it exist
          if(hrefObj.length > 0){
            await hrefObj.forEach(obj=> obj.article_id = data[0].id );
            
            await DB.blog.none(
              saveHrefLinks(hrefObj)
            )
            .then((res) => {
              console.log('successfully saved href links in blogs');
              hrefObj = [];
            })
            .catch(err => {
              console.error('Error saving href to table:', err);
              hrefObj = [];
            });
          }
      })
      .catch(err=>{
        console.log('Error while saving to db ', err)
      })

    }
    catch(err){
      console.log("Error occurred while saving data to database", err, url)
    };
  }
  else{
    //update the record in db
    try{
      await DB.blog.any(
          updateQuery(id, url, country, languageName, articleTitle, postedDate, content, article_type, postedDateStr, html_content, raw_html) 
          )
          .then(async (data)=>{
            console.log('updating article content to db');
          })
          .catch(err => {
            console.error('Error saving blog content to table:', err);
          });
          
    }
    catch(err){
      console.log("Error occurred while updating database record", err, url)
    };
  }

  // Quit WebDriver
  driver.quit();
  return;
}

module.exports = extractAndSaveData;