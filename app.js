require('dotenv').config();
const fs = require('fs')
const express = require('express')
const { extractBlogUrl } = require('./controllers/extract-url');

const cron = require('node-cron');
const updateRecordsForDistinctCountries = require('./controllers/updateRecordWithIso3')
const updateNullBlogs = require('./controllers/updateBlog')
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
  extractBlogUrl()
  res.send('The blog extract as started!')
})

app.post('/update-iso3-codes', verifyToken, (req, res) =>{

  updateRecordsForDistinctCountries()
  res.send('ISO3 code update of all records started!')
})

app.post('/update-null-blogs', verifyToken, (req, res)=>{
  console.log('update-null-blogs')
  updateNullBlogs()

  res.send('Updates to blogs with null records started!')
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

//RUN A CRON JOB 12AM EVERY SUNDAY TO EXECUTE THE SCRAPPER
cron.schedule('0 0 * * 0', () => {
  // Execute web extract function using child_process
  extractBlogUrl()
});
  
app.listen(port, () => {
  console.log(`app listening on port ${port}`)
  getVersionString().then(vo => {
    console.log('name', vo.name);
    console.log('commit', vo.commit);
  }).catch(err => console.log(err));
})
