// INSPIRED BY https://coderwall.com/p/th6ssq/absolute-paths-require
global.include = (path) => require(`${__dirname}/${path}`);
global.rootpath = __dirname;

require('dotenv').config();
const fs = require('fs')
const express = require('express')
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const crypto = require('crypto');

const { app_suite, app_base_host, app_suite_secret, csp_links } = include('config/')
const { DB } = include('db/')
const port = process.env.PORT || 3000

// const { extractBlogUrl } = require('./controllers/extract-url');
// const updateRecordsForDistinctCountries = require('./controllers/updateRecordWithIso3')
// const updateDbRecord = require('./controllers/updateBlog')
// const updateMissingUrl = require('./controllers/updateMissingCountries')
// const updateDocument = require('./controllers/updateDocumentRecord')
const verifyToken = require('./middleware/verifyJwt')
const routes = require('./routes')

const APP_SECRET = process.env.APP_SECRET;
if (!APP_SECRET) {
  throw new Error(`APP_SECRET must be set: '${APP_SECRET}'`);
}
const app = express()
app.disable('x-powered-by');


app.use(bodyParser.json());
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(32).toString('hex');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': csp_links,
        'script-src': csp_links.concat([
          (req, res) => `'nonce-${res.locals.nonce}'`,
          'sha256-NNiElek2Ktxo4OLn2zGTHHeUR6b91/P618EXWJXzl3s=',
          'strict-dynamic',
        ]),
        'script-src-attr': [
          "'self'",
          '*.sdg-innovation-commons.org',
          'sdg-innovation-commons.org',
        ],
        'style-src': csp_links,
        'connect-src': csp_links,
        'frame-src': [
          "'self'",
          '*.sdg-innovation-commons.org',
          'sdg-innovation-commons.org',
          'https://www.youtube.com/',
          'https://youtube.com/',
          'https://web.microsoftstream.com',
        ],
        'form-action': [
          "'self'",
          '*.sdg-innovation-commons.org',
          'sdg-innovation-commons.org',
        ],
      },
    },
    referrerPolicy: {
      policy: ['strict-origin-when-cross-origin', 'same-origin'],
    },
    xPoweredBy: false,
    strictTransportSecurity: {
      maxAge: 123456,
    },
  }),
);

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'same-origin');
  next();
});

app.set('view engine', 'ejs');
app.set('trust proxy', true); // trust leftmost proxy
app.use(express.static(path.join(__dirname, './public')));
app.use('/scripts', express.static(path.join(__dirname, './node_modules')));
app.use('/config', express.static(path.join(__dirname, './config')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(xss());

const cookie = {
  domain: process.env.NODE_ENV === 'production' ? app_base_host : undefined,
  httpOnly: true, // THIS IS ACTUALLY DEFAULT
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1 * 1000 * 60 * 60 * 24 * 1, // DEFAULT TO 1 DAY. UPDATE TO 1 YEAR FOR TRUSTED DEVICES
  sameSite: 'lax',
};

const sessionMiddleware = session({
  name: `${app_suite}-session`,
  secret: `${app_suite}-${app_suite_secret}-pass`,
  store: new PgSession({ pgPromise: DB.general }),
  resave: false,
  saveUninitialized: false,
  cookie,
});

app.use(sessionMiddleware);
app.use(cookieParser(`${app_suite}-${app_suite_secret}-pass`));

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

app.get('/', routes.home.index)
app.get('/browse', routes.home.browse)

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


// app.post('/initialize', verifyToken, (req, res) => {
//   const { startIndex, delimeter } = req.body
//   if(typeof startIndex === 'number' 
//     && typeof delimeter === 'number'
//     && startIndex < delimeter){
//     extractBlogUrl({ startIndex, delimeter })
//   } else extractBlogUrl()
  
//   res.send('The blog extract as started!')
// })

// app.post('/update-iso3-codes', verifyToken, (req, res) =>{

//   updateRecordsForDistinctCountries()
//   res.send('ISO3 code update of all records started!')
// })

// app.post('/update-record', verifyToken, (req, res)=>{
//   const { startIndex, delimeter } = req.body
//   if(typeof startIndex === 'number' 
//     && typeof delimeter === 'number'
//     && startIndex < delimeter){
//       updateDbRecord({ startIndex, delimeter })
//   } else updateDbRecord()

//   res.send('Updates to articles records has started!')
// })

// app.post('/update-missing-countries', verifyToken, (req, res)=>{

//   updateMissingUrl()
//   res.send('Updates to blogs with missing countries started!')
// })

// app.post('/update-document-records', verifyToken, (req, res)=>{

//   updateDocument()
//   res.send('Updates to all records with type document started!')
// })


//DEFINE EXTERNAL API ENDPOINTS
app.use('/v2/api', verifyToken, routes.api.blog )

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
// cron.schedule( '0 19 * * 5', () => {
//   extractBlogUrl({ startIndex : 0, delimeter: 25 });
// });

// cron.schedule( '0 2 * * 6', () => {
//   extractBlogUrl({ startIndex: 26, delimeter: 51 });
// });

// cron.schedule( '0 9 * * 6', () => {
//   extractBlogUrl({ startIndex: 52, delimeter: 77 });
// });

// cron.schedule( '0 16 * * 6', () => {
//   extractBlogUrl({ startIndex: 78, delimeter: 103 });
// });

// cron.schedule( '0 23 * * 6', () => {
//   extractBlogUrl({ startIndex: 104, delimeter: 129 });
// });

// cron.schedule( '0 6 * * 7', () => {
//   extractBlogUrl({ startIndex: 130, delimeter: 155 });
// });

// cron.schedule( '0 13 * * 7', () => {
//   extractBlogUrl({ startIndex: 156, delimeter: 183 });
// });


app.listen(port, () => {
  console.log(`app listening on port ${port}`)
  getVersionString().then(vo => {
    console.log('name', vo.name);
    console.log('commit', vo.commit);
  }).catch(err => console.log(err));
})
