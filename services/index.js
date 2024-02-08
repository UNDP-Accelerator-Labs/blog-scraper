const {
  evaluateArticleType,
  extractLanguageFromUrl,
  extractPdfContent,
  article_types,
} = require("./utils");
const { searchTerms } = require('./searchTerm')

exports.evaluateArticleType = evaluateArticleType;
exports.extractLanguageFromUrl = extractLanguageFromUrl;
exports.extractPdfContent = extractPdfContent;
exports.article_types = article_types;
exports.searchTerms = searchTerms;
