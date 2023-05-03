const fs = require('fs');
const request = require('request');
const pdfParser = require('pdf-parse');
const docxPdf = require('docx-pdf');

function getDocxMetadataFromUrl(url) {
  return new Promise((resolve, reject) => {
    const docxPath = 'temp.docx';
    const pdfPath = 'temp.pdf';

    const writeStream = fs.createWriteStream(docxPath);
    writeStream.on('finish', () => {
      docxPdf(docxPath, pdfPath, (err) => {
        if (err) {
          return reject(err);
        }

        fs.readFile(pdfPath, (err, buffer) => {
          if (err) {
            return reject(err);
          }

          pdfParser(buffer).then((pdf) => {
            const { info, metadata, text } = pdf;
            const json = { info, metadata, text };

            // Delete the downloaded files
            fs.unlink(docxPath, (err) => {
              if (err) {
                console.error(`Error deleting ${docxPath}`, err);
              }
            });
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
    });

    request({ url, encoding: null, timeout: 10000 }).pipe(writeStream);
  });
}

module.exports = getDocxMetadataFromUrl;
