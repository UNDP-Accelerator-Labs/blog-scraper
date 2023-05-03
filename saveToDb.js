require('dotenv').config();
const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const pool =  require('./db');
const { evaluateArticleType, extractLanguageFromUrl, extractPdfContent } = require('./utils');
const { saveQuery, saveAsArrayQuery } = require('./query');
const getPdfMetadataFromUrl = require('./pdf');
const getWordDocumentMetadataFromUrl = require('./docx');

// const { 
  const production = true;
// } = process.env;

// Set up the Chrome options
const options = new chrome.Options();
// // if(production == 'true' ){
  options.addArguments('--headless'); // Run Chrome in headless mode (without a UI)
  options.addArguments('--window-size=1920,1080'); // Set the window size
  options.add_argument('--no-sandbox')
  options.add_argument('--disable-dev-shm-usage')
// }
// else{
//   options.addArguments('--start-maximized'); // Maximize the window
//   options.addArguments('--disable-gpu'); // Disable the GPU
//   options.addArguments('--disable-dev-shm-usage'); // Disable shared memory usage
//   options.addArguments('--no-sandbox'); // Disable the sandbox
// }

// Set up the WebDriver
const driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();

// sample word doc url = 'https://popp.undp.org/_layouts/15/WopiFrame.aspx?sourcedoc=/UNDP_POPP_DOCUMENT_LIBRARY/Public/HR_Non-Staff_International%20Personnel%20Services%20Agreement_IPSA.docx&action=default'
const extractAndSaveData = async (url) => {
  // Navigate to the URL
  await driver.get(url);

  let articleTitle = '';
  let postedDate = '';
  let country = '';
  let contentElements = [];
  let content = '';
  let languageName = await extractLanguageFromUrl(url) ||  'en';
  let postedDateStr = ''

  

  let article_type = await evaluateArticleType(url);

  if(article_type == 'document'){
    
    if(url.includes('.pdf')){
      // Extract pdf content and metadata
      const pdfContent = await getPdfMetadataFromUrl(url);
      content = pdfContent?.text || '';
      postedDate = pdfContent?.metadata?._metadata['xmp:createdate'] || new Date();
      postedDateStr = pdfContent?.metadata?._metadata['xmp:createdate'] || '';
      articleTitle = pdfContent?.metadata?._metadata['dc:title'] || pdfContent?.text?.substring(0, 100) || '';

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
      articleTitle = await driver.findElement(By.css('.coh-inline-element.title-heading')).getText();
    } catch(err){ 
      articleTitle = ''
    }
    
    try{
      postedDateStr = await driver.findElement(By.css('.coh-inline-element.column.publication-card__title h6')).getText() ;
    }
    catch(err){
      postedDateStr = ''
    }

    postedDate = isNaN(new Date(postedDateStr)) ? new Date() : new Date(postedDateStr);

    // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.grid-container p'));
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
  else if (article_type == 'publications'){
    
    articleTitle = await driver.findElement(By.css('.coh-inline-element.column')).getText();
    postedDateStr = await driver.findElement(By.css('.coh-inline-element.column.publication-card__title h6')).getText();
    postedDate = isNaN(new Date(postedDateStr)) ? new Date() :  new Date(postedDateStr);
    //Extract country
    country = await driver.findElement(By.css('.site-title a')).getText();

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
    postedDateStr = await driver.findElement(By.css('.pw-published-date')).getText();
    postedDate = isNaN(new Date(postedDateStr)) ? new Date() :  new Date(postedDateStr);
    languageName = '';

    // // Extract the article title
    articleTitle = await driver.findElement(By.className('pw-post-title')).getText();

    // //Extract country
    country = await driver.findElement(By.css('.bk a')).getText();

    // // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.gq.gr.gs.gt.gu p'));
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
  else {
    // Extract the article title
    articleTitle = await driver.findElement(By.className('article-title')).getText();

    // Extract the posted date
    postedDateStr = await driver.findElement(By.className('posted-date')).getText();
    postedDate = isNaN(new Date(postedDateStr)) ? new Date() : new Date(postedDateStr) ;

    //Extract country
    country = await driver.findElement(By.css('.site-title a')).getText();

    // Extract the content
    try{
      contentElements = await driver.findElements(By.css('.coh-inline-element.m-content.coh-wysiwyg p'));
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

  // Save the data to the database
  try{
    console.log('saving to db')
    await pool.query(
        saveQuery(url, country, languageName, articleTitle, postedDate, content, article_type, postedDateStr) 
        );
  }
  catch(err){
    console.log("Error occurred while saving data to database", err, url)
  };

  return;
}


// extractAndSaveData()

module.exports = extractAndSaveData;