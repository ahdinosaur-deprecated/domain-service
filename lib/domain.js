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

  find: function (params) {
    params = params || {};
    return this.Domain.allAsync(params)
    .bind(this)
    .then(function (models) {
      return Promise.map(models, function (model) {
        return _.extend(model, {
          "@context": this.Domain.context,
        });
      }.bind(this));
    })
    ;
  },

  get: function (id, params) {
    params = params || {};
    return this.Domain.getAsync(id, params)
    .bind(this)
    .then(function (model) {
      return _.extend(model.toJSON(), {
        "@context": this.Domain.context,
      });
    })
    ;
  },

  create: function (data, params) {
    params = params || {};
    var Domain = this.Domain;

    // get promise object for possible nested objects
    var objPromise = utils.promiseObject(Domain, this.lookup, data);

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
        return this.get(model.key, params);
      })
      ;
    })
    ;
  },

  update: function (id, data, params) {
    params = params || {};
    var Domain = this.Domain;
    
    // get promise object for possible nested objects
    var objPromise = utils.promiseObject(Domain, this.lookup, data);

    // resolve promise object
    return Promise.props(objPromise)
    .bind(this)
    .then(function (updates) {
      // update Domain model
      return Domain.updateAsync(id, updates, params);
    })
    .then(function () {
      // return full model
      return this.get(id, params);
    })
    ;
  },

  remove: function (id, params, callback) {
    params = params || {};

    // delete model by id
    return this.Domain.deleteAsync(id, params)
    .bind(this)
    // if model is not found, return not NotFound error
    .catch(function (err) {
      // TODO not all errors mean not found
      if (err) { return new errors.NotFound(id + ' does not exist'); }
    })
    // if successful, return nothing
    .then(function () {
      return null;
    })
    ;
  },
});

module.exports = function (Domain) {
    return Proto.create.call(DomainService, Domain);
};

module.exports.Service = DomainService;
