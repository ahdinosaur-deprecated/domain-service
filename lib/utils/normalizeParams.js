module.exports = function (params) {
  // set defaults
  params ||= params || {};
  params.query = params.query || {};

  // coerce strings to numbers
  if (params.query.depth) {
    params.query.depth = Math.parseInt(params.query.depth);
  }

  return params;
}
