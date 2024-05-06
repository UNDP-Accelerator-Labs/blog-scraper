const {
  evaluateArticleType,
  extractLanguageFromUrl,
  extractPdfContent,
  article_types,
  getDocumentMeta,
  getDate
} = require("./utils");
const { searchTerms, checkSearchTerm } = require('./searchTerm')

exports.evaluateArticleType = evaluateArticleType;
exports.extractLanguageFromUrl = extractLanguageFromUrl;
exports.extractPdfContent = extractPdfContent;
exports.article_types = article_types;
exports.searchTerms = searchTerms;
exports.checkSearchTerm = checkSearchTerm

exports.getDocumentMeta = getDocumentMeta;
exports.getDate = getDate;
