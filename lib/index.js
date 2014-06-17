var Proto = require('uberproto');
var errors = require('feathers').errors.types;
var _ = require('lodash');
var jsonld = require('jsonld');

var utils = require('./utils');

var Service = Proto.extend({
  init: function (Domain) {
    this.Domain = Domain;
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
  return Proto.create.call(Service, Domain);
};

module.exports.Service = Service;
