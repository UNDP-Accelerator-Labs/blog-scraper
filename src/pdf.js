const request = require('request');
const pdfParser = require('pdf-parse');

function getPdfMetadataFromUrl(url) {
  return new Promise((resolve, reject) => {
    request({ url, encoding: null }, (error, response, buffer) => {
      if (error) {
        return reject(error);
      }

      pdfParser(buffer).then((pdf) => {
        const { info, metadata, text } = pdf;
        const json = { info, metadata, text };
        resolve(json);
      }).catch((err) => {
        reject(err);
      });
    });
  });
}

module.exports = getPdfMetadataFromUrl;