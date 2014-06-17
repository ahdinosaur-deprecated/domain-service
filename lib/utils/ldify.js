var hasType = require('./hasType');

module.exports = function (doc, type, context) {
  doc = hasType(doc, type);
  doc['@context'] = context;
  return doc;
};
