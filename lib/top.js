var Proto = require('uberproto');
var errors = require('feathers').errors.types;
var _ = require('lodash');
var jsonld = require('jsonld');

var child = require('./child');
var utils = require('./utils');

var DomainService = Proto.extend({
  init: function (Domain) {
    this.Domain = Domain;
  },

  setup: function (app) {
    this.lookup = app.lookup;
  },

  find: function (params, callback) {

  },

  get: function (id, params, callback) {
    var Domain = this.Domain;
    Domain.get(id, function (err, model) {
      if (err) { return callback(err); }

      var result = utils.ldify(model, Domain);
      callback(null, result);
    });
  },

  create: function (data, params, callback) {
    var Domain = this.Domain;

    // iterate over each kv pair in data
    _.each(data, function (value, key) {
      // if value is object
      if (_.isObject(value)) {
        // and does not have id
        if (!value.id) {
          // we need to create it too
          //console.log(Domain);
        }
      }
    });

    var model = Domain.create(data);

    model.save(function (err) {
      if (err) { return callback(err); }

      var result = utils.ldify(model, Domain);
      callback(null, result);
    });
  },

  update: function (id, data, params, callback) {

  },

  remove: function (id, params, callback) {

  },
});

module.exports = function (Domain) {
    return Proto.create.call(DomainService, Domain);
};

module.exports.Service = DomainService;
