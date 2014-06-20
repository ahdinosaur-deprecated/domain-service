var Proto = require('uberproto');
var errors = require('feathers').errors.types;
var _ = require('lodash');
var jsonld = require('jsonld');
var Promise = require('bluebird');

var utils = require('./utils');

var RelatedService = Proto.extend({
  init: function (relatedPath, parentPath, relation) {
    this.relatedPath= relatedPath;
    this.parentPath = parentPath;
    this.relation = relation;
  },

  setup: function (app) {
    this.lookup = app.lookup.bind(app);
    this.Related = Promise.promisifyAll(this.lookup(this.relatedPath));
    this.Parent = Promise.promisifyAll(this.lookup(this.parentPath));
  },

  find: function (params, callback) {
  },

  get: function (id, params, callback) {
    var Parent = this.Parent;
    var Related = this.Related;
    var relation = this.relation;

    var parentParam = utils.paramHash(this.parentPath, this.relation);
    var parentId = params[parentParam];

    Parent.get(parentId, { depth: 1 }, function (err, parent) {
      if (err) { return callback(err); }
      
      var index = _.indexOf(_.pluck(parent[relation], 'key'), id)
      if (index === -1) {
        return callback(new errors.NotFound(
          "Parent.get("+parentId+").get("+relation+").get("+id+") not found"
        ));
      }

      var related = parent[relation][index];
      var result = utils.ldify(related, Domain);
      callback(null, result);
    });
  },

  create: function (data, params) {
    var Parent = this.Parent;
    var Related = this.Related;
    var relation = this.relation;

    var parentParam = utils.paramHash(this.parentPath, this.relation);
    var parentId = params[parentParam];

    // create related
    return Related.createAsync(data, {}).then(function (related) {
      // get parent
      return Parent.getAsync(parentId, { depth: 1 }).then(function (parent) {
        // add related to parent
        var updates = {}
        updates[relation] = _.pluck(parent[relation], 'id').concat([related.id]);
        // update parent
        return Parent.updateAsync(parent.id, updates, {});
      });
    });
  },

  update: function (id, data, params, callback) {

  },

  remove: function (id, params, callback) {

  },
});

module.exports = function () {
  return Proto.create.apply(RelatedService, arguments);
};

module.exports.Service = RelatedService;
