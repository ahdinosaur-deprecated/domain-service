var Proto = require('uberproto');

var top = require('./top');
var child = require('./child');

var childServices = function (app, Domain, path) {
  Domain.options.collection_fields.forEach(function (field) {
    var path = path + Domain.options.name + "/:parentId/" + field;
    app.use(path, child(Domain, field));
  });
};

module.exports = function () {
  return function () {
    var app = this;

    Proto.mixin({
      domain: function (Domain) {
        this.use(
          '/' + Domain.options.name,
          top(Domain)
        );

        childServices(this, Domain, '/');

        return this;
      }
    }, app);
  };
};