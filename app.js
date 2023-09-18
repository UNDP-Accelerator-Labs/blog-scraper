require('dotenv').config();
const fs = require('fs')
const express = require('express')
const { extractBlogUrl } = require('./controllers/extract-url');

const cron = require('node-cron');
const updateRecordsForDistinctCountries = require('./controllers/updateRecordWithIso3')
const updateDbRecord = require('./controllers/updateBlog')
const updateMissingUrl = require('./controllers/updateMissingCountries')
const updateDocument = require('./controllers/updateDocumentRecord')

const verifyToken = require('./middleware/verifyJwt')
const bodyParser = require('body-parser');

const routes = require('./routes')

const APP_SECRET = process.env.APP_SECRET;
if (!APP_SECRET) {
  throw new Error(`APP_SECRET must be set: '${APP_SECRET}'`);
}
const app = express()
const port = 3000
app.use(bodyParser.json());

// HEALTH-CHECK + INFO
let versionObj = null;

function getVersionString() {
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

app.get('/version', (req, res) => {
  getVersionString().then(vo => res.send(vo)).catch(err => {
    console.log(err);
    res.status(500).send({
      'name': 'error while reading version',
      'commit': 'unknown',
      'app': `${app_id}`,
    })
  });
})


app.post('/initialize', verifyToken, (req, res) => {
  const { startIndex, delimeter } = req.body
  if(typeof startIndex === 'number' 
    && typeof delimeter === 'number'
    && startIndex < delimeter){
    extractBlogUrl({ startIndex, delimeter })
  } else extractBlogUrl()
  
  res.send('The blog extract as started!')
})

app.post('/update-iso3-codes', verifyToken, (req, res) =>{

  updateRecordsForDistinctCountries()
  res.send('ISO3 code update of all records started!')
})

app.post('/update-record', verifyToken, (req, res)=>{
  const { startIndex, delimeter } = req.body
  if(typeof startIndex === 'number' 
    && typeof delimeter === 'number'
    && startIndex < delimeter){
      updateDbRecord({ startIndex, delimeter })
  } else updateDbRecord()

  res.send('Updates to articles records has started!')
})

app.post('/update-missing-countries', verifyToken, (req, res)=>{

  updateMissingUrl()
  res.send('Updates to blogs with missing countries started!')
})

app.post('/update-document-records', verifyToken, (req, res)=>{

  updateDocument()
  res.send('Updates to all records with type document started!')
})

//DEFINE EXTERNAL API ENDPOINTS
app.use('/v2/api', verifyToken, routes )

app.use((req, res, next) => {
  res.status(404).send('<h1>Page not found on the server</h1>');
})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
})

//TO AVOID AZURE WEB SERVICE MEMORY ISSUE,
//THE CRON JOB WILL BE SPLIT WITH THE WEEKEND DAYS
// FROM FRIDAY 7PM EVENING TO 11PM SUNDAY

//THERE ARE IN TOTAL 183 COUNTRY/LANGUAGE PAGE INSTANCES ON THE UNDP WEBSITES
//THE CRON JOBS WILL RUN 7 TIMES OVER THE WEEKEND TO ENSURE THAT EVERY PAGE IS CHECKED

// RUN EVERY FRIDAY FROM 7 PM IN AN INTERVAL OF 7 HOURS
cron.schedule( '0 19 * * 5', () => {
  extractBlogUrl({ startIndex : 0, delimeter: 25 });
});

cron.schedule( '0 2 * * 6', () => {
  extractBlogUrl({ startIndex: 26, delimeter: 51 });
});

cron.schedule( '0 9 * * 6', () => {
  extractBlogUrl({ startIndex: 52, delimeter: 77 });
});

cron.schedule( '0 16 * * 6', () => {
  extractBlogUrl({ startIndex: 78, delimeter: 103 });
});

cron.schedule( '0 23 * * 6', () => {
  extractBlogUrl({ startIndex: 104, delimeter: 129 });
});

cron.schedule( '0 6 * * 7', () => {
  extractBlogUrl({ startIndex: 130, delimeter: 155 });
});

cron.schedule( '0 13 * * 7', () => {
  extractBlogUrl({ startIndex: 156, delimeter: 183 });
});


app.listen(port, () => {
  console.log(`app listening on port ${port}`)
  getVersionString().then(vo => {
    console.log('name', vo.name);
    console.log('commit', vo.commit);
  }).catch(err => console.log(err));
})
