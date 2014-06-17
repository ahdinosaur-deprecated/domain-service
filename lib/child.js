var Proto = require('uberproto');
var errors = require('feathers').errors.types;
var _ = require('lodash');
var jsonld = require('jsonld');

var utils = require('./utils');

var ChildService = Proto.extend({
  init: function (Domain, field) {
    this.Domain = Domain;
    this.field = field;
  },

  setup: function () {
    this.lookup = app.lookup;
  },

  find: function (params, callback) {

  },

  get: function (id, params, callback) {
    var Domain = this.Domain;
    var field = this.field;
    var parentId = params.parentId;

    Domain.get(parentId, { depth: 1 }, function (err, model) {
      if (err) { return callback(err); }

      var index = _.indexOf(_.pluck(model[field], 'key'), id)
      if (index === -1) {
        return callback(new errors.NotFound(
          Domain.name+".get("+parentId+")."+field+".get("+id+") not found"
        ));
      }

      var child = model[field][index];
      var result = utils.ldify(child, Domain);
      callback(null, result);
    });
  },

  create: function (data, params, callback) {
    var Domain = this.Domain;
    var field = this.field;
    var parentId = params.parentId;

    Domain.get(parentId, { depth: 5 }, function (err, model) {

      console.log(model.toJSON())
      model[field] = model[field].concat([data]);
      console.log(model[field])

      model.save(function (err) {
        if (err) { return callback(err); }

        var result = utils.ldify(model[field], Domain);
        callback(null, result);
      });
    });
  },

  update: function (id, data, params, callback) {

  },

  remove: function (id, params, callback) {

  },
});

module.exports = function (Domain, field) {
  return Proto.create.call(ChildService, Domain, field);
};

module.exports.Service = ChildService;
