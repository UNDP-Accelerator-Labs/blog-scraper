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

// if (process.env.NODE_ENV == "production") {
//   app.use(helmet(csp_config));
// }
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.set("trust proxy", true);
app.use("/scripts", express.static(path.join(__dirname, "./node_modules")));
app.use("/config", express.static(path.join(__dirname, "./config")));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
const options = {
  allowedKeys: ["referer"],
  allowedAttributes: {
    referer: ["&"],
  },
};
app.use(xss(options));

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

//BLOG DATA APIs
app.get("/blogs", verifyToken, routes.api.browse_data);
app.get("/articles", routes.api.get_articles);
app.get("/blogs/stats", verifyToken, routes.api.get_blog_stats);

app.post("/get-webpage-content", verifyToken, routes.api.getWebContent);

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
the cron job will split over the week.
*/

cron.schedule("0 0 * * 0", () => {
  extractBlogUrl({ startIndex: 0, delimeter: 25 });
});

cron.schedule("0 12 * * 0", () => {
  extractBlogUrl({ startIndex: 26, delimeter: 51 });
});

cron.schedule("0 0 * * 1", () => {
  extractBlogUrl({ startIndex: 52, delimeter: 77 });
});

cron.schedule("0 0 * * 2", () => {
  extractBlogUrl({ startIndex: 78, delimeter: 103 });
});

cron.schedule("0 0 * * 3", () => {
  extractBlogUrl({ startIndex: 104, delimeter: 129 });
});

cron.schedule("0 0 * * 4", () => {
  extractBlogUrl({ startIndex: 130, delimeter: 155 });
});

cron.schedule("0 0 * * 5", () => {
  extractBlogUrl({ startIndex: 156, delimeter: 182 });
});

// Create the cron job to update acclab medium content weekly
cron.schedule("0 12 * * 5", async () => {
  try {
    routes.cron.scrap_medium_posts();
    console.log("Medium Scrapper started successfully.");
  } catch (error) {
    console.error("Error occurred while running Medium scrapper:", error);
  }
});

cron.schedule("0 0 * * 6", async () => {
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
