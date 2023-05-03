const fs = require('fs');
const request = require('request');
const pdfParser = require('pdf-parse');

function getPdfMetadataFromUrl(url) {
  return new Promise((resolve, reject) => {
    const pdfPath = 'temp.pdf';

    const writeStream = fs.createWriteStream(pdfPath);
    writeStream.on('finish', () => {
      fs.readFile(pdfPath, (err, buffer) => {
        if (err) {
          return reject(err);
        }

        pdfParser(buffer).then((pdf) => {
          const { info, metadata, text } = pdf;
          const json = { info, metadata, text };

          // Delete the downloaded PDF file
          fs.unlink(pdfPath, (err) => {
            if (err) {
              console.error(`Error deleting ${pdfPath}`, err);
            }
          });

          resolve(json);
        }).catch((err) => {
          reject(err);
        });
      });
    });

    request({ url, encoding: null, timeout: 10000 }).pipe(writeStream);
  });
}

module.exports = getPdfMetadataFromUrl;
