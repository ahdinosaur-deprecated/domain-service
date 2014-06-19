var hasType = require('./hasType');

module.exports = function (model, Domain) {
  // model to JSON document
  var doc = model.toJSON();

  // ensure doc has Domain type
  doc = hasType(doc, Domain.type);

  // ensure doc has Domain context
  doc['@context'] = Domain.context;

  return doc;
};
