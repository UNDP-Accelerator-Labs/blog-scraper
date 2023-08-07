require("dotenv").config();

const { APP_SECRET } = process.env;

// Verify Token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['token-authorization'];

  if (token !== APP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

module.exports = verifyToken;