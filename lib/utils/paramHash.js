module.exports = function (parentPath, relation) {
  return (parentPath + relation).replace('/', '');
}