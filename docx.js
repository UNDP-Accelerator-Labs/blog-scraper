const docx = require('docx');
const request = require('request');

function getWordDocumentMetadataFromUrl(url) {
  return new Promise((resolve, reject) => {
    const docxBuffer = [];

    request(url)
      .on('data', (chunk) => {
        docxBuffer.push(chunk);
      })
      .on('end', () => {
        const buffer = Buffer.concat(docxBuffer);

        const doc = new docx.Document(buffer);

        const metadata = {
          title: doc.title,
          author: doc.author,
          creationDate: doc.creationDate,
          lastModifiedBy: doc.lastModifiedBy,
          lastModifiedDate: doc.lastModifiedDate,
          keywords: doc.keywords,
          description: doc.description,
          content: doc.getText(),
        };
        console.log('metadata', metadata)
        resolve(metadata);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

module.exports = getWordDocumentMetadataFromUrl;
