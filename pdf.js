const request = require('request');
const pdfParser = require('pdf-parse');

async function getPdfMetadataFromUrl(url) {
  try {
    return new Promise((resolve, reject) => {
      try{
        request({ url, encoding: null }, (error, response, buffer) => {
          if (error) {
            return reject(error);
          }
    
          pdfParser(buffer).then((pdf) => {
            const { info, metadata, text } = pdf;
            const json = { info, metadata, text };
            // console.log('json ', json)
            resolve(pdf);
          }).catch((err) => {
            return reject(err);
          });
        });
      }
      catch(err){
        console.log("Error fetching pdf file ", err)
        return {}
      }
    })
  }
  catch(err){
    console.log("Error reading pdf file ", err)
    return {}
  }
}

module.exports = getPdfMetadataFromUrl;