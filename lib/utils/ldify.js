var hasType = require('./hasType');

module.exports = function (model, Domain) {
  // model to JSON document
  var doc = model.toJSON();

  // set doc id from model keyname
  doc.id = model.key;

  // ensure doc has Domain type
  doc = hasType(doc, Domain.type);

  // ensure doc has Domain context
  doc['@context'] = Domain.context;

  return doc;
};
