const request = require('request');
const pdfParser = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const rootDirectory = __dirname;

async function getPdfMetadataFromUrl(url) {
  try {
    return new Promise((resolve, reject) => {
      try{
        request({ url, encoding: null }, (error, response, buffer) => {
          if (error) {
            return reject(error);
          }
    
          pdfParser(buffer).then((pdf) => {
            //Delete pdf files in local memory to avoid running out of memory
            fs.readdir(rootDirectory, (err, files) => {
              if (err) {
                console.error('Error reading directory:', err);
                return;
              }
            
              files.forEach((file) => {
                const filePath = path.join(rootDirectory, file);
            
                // Check if the file has .pdf extension
                if (path.extname(filePath) === '.pdf') {
                  fs.unlink(filePath, (err) => {
                    if (err) {
                      console.error(`Error deleting file ${file}:`, err);
                    } else {
                      console.log(`Deleted file: ${file}`);
                    }
                  });
                }
              });
            });

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