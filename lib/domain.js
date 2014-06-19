var Proto = require('uberproto');
var errors = require('feathers').errors.types;
var _ = require('lodash');
var jsonld = require('jsonld');
var Promise = require('bluebird');

var relation = require('./relation');
var utils = require('./utils');

var DomainService = Proto.extend({
  init: function (Domain, path) {
    this.Domain = Promise.promisifyAll(Domain);
    this.path = this.path || this.Domain.options.name;
  },

  setup: function (app) {
    this.lookup = app.lookup.bind(app);
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

  get: function (id, params) {
    return this.Domain.getAsync(id, params || {})
    .bind(this)
    .then(function (model) {
      return utils.ldify(model, this.Domain);
    });
  },

  create: function (data, params) {
    var Domain = this.Domain;

    // setup promises for nested objects
    var objPromise = {};

    // iterate over data key values
    _.each(data, function (value, key) {
      // if value is in foreign collection
      if (_.contains(Domain.options.collection_fields, key)) {
        // and does not have id
        if (!value.id) {
          // create object
          var childName = utils.relationName(Domain, key);
          var Child = Promise.promisifyAll(this.lookup(childName));

          objPromise[key] = Promise
          .map(value, function (item) {
            return Child.createAsync(item, {});
          })
          .map(function(itemObj) {
            return itemObj.id;
          });
        } else {
          // update object
        }
      }
      // else if value is in foreign key
      else if (false) {
      } else {
        objPromise[key] = value;
      }
    }.bind(this));

    // resolve nested objects
    return Promise.props(objPromise)
    .bind(this)
    .then(function (obj) {
      // create Domain model
      var model = Promise.promisifyAll(Domain.create(obj));
      // save model
      return model.saveAsync()
      .bind(this)
      .then(function () {
        // return full model
        return this.get(model.key);
      });
    });
  },

  update: function (id, data, params) {
    var Domain = this.Domain;

    // update model
    return Domain.updateAsync(id, data, params)
    .bind(this)
    // return full model
    .then(function () {
      return this.get(id, params);
    });
  },

  remove: function (id, params, callback) {
    var Domain = this.Domain;

    Domain.delete(id, function (err) {
      if (err) { return callback(new errors.NotFound('Object does not exist')); }
      var body = {msg: id + " deleted"};
      callback(null, body);
    });
  },
});

module.exports = function (Domain) {
    return Proto.create.call(DomainService, Domain);
};

module.exports.Service = DomainService;
