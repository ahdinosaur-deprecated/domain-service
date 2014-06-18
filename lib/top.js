var Proto = require('uberproto');
var errors = require('feathers').errors.types;
var _ = require('lodash');
var jsonld = require('jsonld');
var Promise = require('bluebird');

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
    var Domain = this.Domain;
    Domain.all(function (err, objects) {
      if (err) { return callback(err); }
      Promise.map(objects, function (object) {
        return utils.ldify(object, Domain);
      })
      .nodeify(callback)
    })
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
    var Domain = this.Domain;

    Domain.update(id, data, {}, function (err, updatedObject) {
      if (err) { return callback(err); }
      var result = utils.ldify(updatedObject, Domain);
      callback(null, result);  
    })

  },

  remove: function (id, params, callback) {
    var Domain = this.Domain;

    console.log('this app', this.app)

    Domain.delete(id, function (err) {
      if (err) { return callback(new errors.NotFound('Object does not exist')); }
      var body = {msg: id + " deleted"};
      callback(null, body);
    })


  },

  // error: function (error, callback) {


  // }

});

module.exports = function (Domain) {
    return Proto.create.call(DomainService, Domain);
};

module.exports.Service = DomainService;
