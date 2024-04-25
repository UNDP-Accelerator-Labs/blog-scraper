// INSPIRED BY https://coderwall.com/p/th6ssq/absolute-paths-require
global.include = (path) => require(`${__dirname}/${path}`);
global.rootpath = __dirname;

require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const crypto = require("crypto");

const { app_suite, app_base_host, app_suite_secret, csp_config } =
  include("config/");
const { DB } = include("db/");
const { getVersionString } = include("middleware");
const port = process.env.PORT || 3000;

const { extractBlogUrl } = require("./controllers/blog/scrapper/extract-url");
const updateDbRecord = require("./controllers/blog/scrapper/updateBlog");
const acclab_publications = require("./controllers/blog/scrapper/acclabs");
const verifyToken = include("/middleware/verifyJwt");
const routes = include("routes/");
const app = express();

app.disable("x-powered-by");
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(32).toString("hex");
  next();
});
app.use(helmet(csp_config));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "same-origin");
  next();
});

app.set("trust proxy", true);
app.use("/scripts", express.static(path.join(__dirname, "./node_modules")));
app.use("/config", express.static(path.join(__dirname, "./config")));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(xss());

const cookie = {
  domain: process.env.NODE_ENV === "production" ? app_base_host : undefined,
  httpOnly: true, // THIS IS ACTUALLY DEFAULT
  secure: process.env.NODE_ENV === "production",
  maxAge: 1 * 1000 * 60 * 60 * 24 * 1, // DEFAULT TO 1 DAY. UPDATE TO 1 YEAR FOR TRUSTED DEVICES
  sameSite: "lax",
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

app.get("/version", (req, res) => {
  getVersionString()
    .then((vo) => res.send(vo))
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        name: "error while reading version",
        commit: "unknown",
        app: `${app_id}`,
      });
    });
});

//DEFINE EXTERNAL API ENDPOINTS
app.get("/blogs/:page_content_limit/:page", verifyToken, routes.api.blog);
app.get("/blogs/cleanup", verifyToken, routes.api.cleanup);
app.get("/blogs/medium", verifyToken, routes.cron.medium_posts);
app.get("/toolkit/scrap", verifyToken, routes.api.toolkit);
app.post("/get-webpage-content", verifyToken, routes.api.getWebContent);


//DEFINE SROUTES TO INITIATE SCRAPPER
app.post("/initialize", verifyToken, (req, res) => {
  const { startIndex, delimeter } = req.body;
  if (
    typeof startIndex === "number" &&
    typeof delimeter === "number" &&
    startIndex < delimeter
  ) {
    extractBlogUrl({ startIndex, delimeter });
  } else extractBlogUrl();

  res.send("The blog extract as started!");
});


app.post("/update-record", verifyToken, (req, res) => {
  const { startIndex, delimeter } = req.body;
  if (
    typeof startIndex === "number" &&
    typeof delimeter === "number" &&
    startIndex < delimeter
  ) {
    updateDbRecord({ startIndex, delimeter });
  } else updateDbRecord();

  res.send("Updates to articles records has started!");
});


app.post("/acclab-content", verifyToken, (req, res) => {
    acclab_publications();
  res.send("Acclab publications scrapping has started!");
});

//DEFINE ERROR HANDLING ENDPOINTS
app.use((req, res, next) => {
  res.status(404).send("<h1>Page not found on the server</h1>");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

/* 
To prevent memory issues on Azure web service, 
the cron job will split over weekends, 
running from Friday 7 PM to Sunday 11 PM.
With 183 country/language page instances on UNDP websites, 
the cron job runs 7 times over the weekend 
to ensure every page is checked.
It runs every Friday from 7 PM at 7-hour intervals.
*/

cron.schedule("0 19 * * 5", () => {
  extractBlogUrl({ startIndex: 0, delimeter: 25 });
});

cron.schedule("0 2 * * 6", () => {
  extractBlogUrl({ startIndex: 26, delimeter: 51 });
});

cron.schedule("0 9 * * 6", () => {
  extractBlogUrl({ startIndex: 52, delimeter: 77 });
});

cron.schedule("0 16 * * 6", () => {
  extractBlogUrl({ startIndex: 78, delimeter: 103 });
});

cron.schedule("0 23 * * 6", () => {
  extractBlogUrl({ startIndex: 104, delimeter: 129 });
});

cron.schedule("0 6 * * 7", () => {
  extractBlogUrl({ startIndex: 130, delimeter: 155 });
});

cron.schedule("0 13 * * 7", () => {
  extractBlogUrl({ startIndex: 156, delimeter: 183 });
});



// Create the cron job to update toolkit content twice a month
cron.schedule("0 0 1,15 * *", async () => {
  console.log("Running scrapper...");
  try {
    routes.cron.scrapper();
    console.log("Scrapper started successfully.");
  } catch (error) {
    console.error("Error occurred while running scrapper:", error);
  }
});

// Create the cron job to update acclab medium content weekly
cron.schedule("0 * * * 4", async () => {
  try {
    routes.cron.medium_posts();
    console.log("Medium Scrapper started successfully.");
  } catch (error) {
    console.error("Error occurred while running Medium scrapper:", error);
  }
});

cron.schedule("0 * * * 5", async () => {
  try {
    acclab_publications();
    console.log("Official webpage Scrapper started successfully.");
  } catch (error) {
    console.error("Error occurred while running Medium scrapper:", error);
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
  getVersionString()
    .then((vo) => {
      console.log("name", vo.name);
      console.log("commit", vo.commit);
    })
    .catch((err) => console.log(err));
});
