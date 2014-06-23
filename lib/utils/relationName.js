module.exports = function (Domain, field) {
  return Domain.definition[field].foreignCollection;
}