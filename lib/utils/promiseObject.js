var Promise = require('bluebird');
var _ = require('lodash');

// input is an object of a Domain with possible nested objects
// output is a object with Promises for nested objects
module.exports = function (Domain, lookup, data) {

  // setup object to store properties
  // and promises for nested objects
  var objPromise = {};

  _.each(data, function (value, key) {
    // if value is in foreign collection
    if (_.contains(Domain.options.collection_fields, key)) {
      // if value is string
      if (typeof value === 'string') {
        // it is id so return untouched
        return value;
      }
      // if value is does not have id
      else if (!value.id) {
        // create object
        var childName = utils.relationName(Domain, key);
        var Child = Promise.promisifyAll(lookup(childName));

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
  });

  return objPromise;
}
