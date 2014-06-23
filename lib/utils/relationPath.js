var paramHash = require('./paramHash');

module.exports = function (parentPath, relation) {
  var param = paramHash(parentPath, relation);
  return parentPath + "/:"+param+'/'+relation;
}