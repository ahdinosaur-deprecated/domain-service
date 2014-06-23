var Proto = require('uberproto');

var utils = require('./utils');
var domain = require('./domain');
var relation = require('./relation');

var relations = function (Domain, parentPath, count) {

  Domain.options.collection_fields.forEach(function (field) {

    var relatedPath = Domain.definition[field].foreignCollection;
    var path = utils.relationPath(parentPath, field);

    this.use(path, relation(relatedPath, parentPath, field));
  }.bind(this));
};

module.exports = function () {
  return function () {
    var app = this;

    Proto.mixin({
      domain: function (Domain) {
        var name = Domain.options.name;

        // routes are greedy matches, so
        // add relation routes first.
        relations.bind(this)(Domain, name, 0);

        this.use(
          name,
          domain(Domain)
        );

        return this;
      }
    }, app);
  };
};