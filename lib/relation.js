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

  find: function (params) {
    params = utils.normalizeParams(params);
    params.query.depth += 1

    var parentParam = utils.paramHash(this.parentPath, this.relation);
    var parentId = params[parentParam];

    this.Parent.get(parentId, params)
    .bind(this)
    .then(function (parent) {
      return utils.contextify(
        this.Related.Domain,
        parent[this.relation]
      )
    });
    ;
  },

  get: function (id, params) {
    params = utils.normalizeParams(params);
    params.query.depth += 1

    var parentParam = utils.paramHash(this.parentPath, this.relation);
    var parentId = params[parentParam];

    this.Parent.get(parentId, params)
    .bind(this)
    .then(function (parent) {
      var index = _.indexOf(_.pluck(parent[this.relation], 'key'), id)
      if (index === -1) {
        return callback(new errors.NotFound(
          "Parent.get("+parentId+").get("+relation+").get("+id+") not found"
        ));
      }

      var related = parent[this.relation][index];
      return utils.contextify(this.Related, related);
    })
    ;
  },

  create: function (data, params) {
    var Parent = this.Parent;
    var Related = this.Related;
    var relation = this.relation;

    var parentParam = utils.paramHash(this.parentPath, this.relation);
    var parentId = params[parentParam];

    // create related
    return this.Related.createAsync(data, {})
    .bind(this)
    .then(function (related) {
      // get parent
      return this.Parent.getAsync(parentId, { depth: 1 })
      .bind(this)
      .then(function (parent) {
        // add related to parent
        var updates = {}
        updates[relation] = _.pluck(parent[relation], 'id').concat([related.id]);
        // update parent
        return Parent.updateAsync(parent.id, updates, {});
      })
      ;
    })
    ;
  },

  update: function (id, data, params) {
    return this.Related.update(id, data, params);
  },

  remove: function (id, params) {
    // get parent
    return Parent.getAsync(parentId, { depth: 1 })
    .bind(this)
    .then(function (parent) {
      // add related to parent
      //
      // get index of item within parent
      var index = _.indexOf(_.pluck(parent[this.relation], 'key'), id)
      // if item not in parent, error
      if (index === -1) {
        return new errors.NotFound(
          this.relation+".get("+parentId+")."+relation+".get("+id+") not found"
        );
      }
      // update item in parent
      var updates = {}
      updates[relation] = _.pluck(parent[relation], 'id').splice(index, 1);
      return Parent.updateAsync(parent.id, updates, {});
    })
    ;
  },
});

module.exports = function () {
  return Proto.create.apply(RelatedService, arguments);
};

module.exports.Service = RelatedService;
