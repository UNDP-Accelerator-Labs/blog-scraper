const fs = require('fs')
let versionObj = null;

exports.getVersionString = () => {
  return new Promise((resolve) => {
    if (versionObj !== null) {
      resolve(versionObj);
      return;
    }
    fs.readFile('version.txt', (err, data) => {
      if (err) {
        versionObj = {
          'name': 'no version available',
          'commit': 'unknown',
        };
      } else {
        const lines = data.toString().split(/[\r\n]+/);
        versionObj = {
          'name': lines[0] || 'no version available',
          'commit': lines[1] || 'unknown',
        };
      }
      resolve(versionObj);
    });
  });
}