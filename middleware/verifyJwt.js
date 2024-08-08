require("dotenv").config();
const jwt = require("jsonwebtoken");

const { APP_SECRET } = process.env;

// Verify Token middleware
const verifyToken = (req, res, next) => {
  const token =
    req.body?.token || req.query?.token || req.headers["token-authorization"];

  const { referer, host } = req.headers || {};
  const mainHost = removeSubdomain(host);
  const reqHost = req.get("host");
  const isLocalhost =
    `${reqHost}`.startsWith("localhost:") || `${reqHost}` === "localhost";

  if (token == APP_SECRET) {
    return next();
  } else {
    let tobj;
    try {
      tobj = jwt.verify(
        token,
        APP_SECRET,
        isLocalhost ? {} : { audience: "user:known", issuer: mainHost }
      );
    } catch (_) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { uuid, rights, ip, acceptedorigins } = tobj;
    if (uuid) return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
};

module.exports = verifyToken;

const removeSubdomain = (hostname) => {
  const host = `${hostname}`;
  if (host.endsWith("azurewebsites.net")) {
    return host;
  }
  return host.split(".").slice(-2).join(".");
};
