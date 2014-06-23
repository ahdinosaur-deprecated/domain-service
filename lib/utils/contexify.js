var _ = require('lodash');

module.exports = function (Domain, obj) {
  return _.extend(obj, {
    '@context': Domain.context;
  });
};
