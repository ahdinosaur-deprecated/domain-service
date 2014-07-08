var express = require('express');
var racer = require('racer');

var toModelPath = function (path, params) {
  // strip slashes
  path = path.replace(/^\/|\/$/g, '');
  // split path into items
  var items = path.split('/');
  // replace join items with .
  path = items.join('.');
  return path;
};

var getModel = function (req, path, callback) {
  var model = req.getModel().at(path);
  model.subscribe([], function (err) {
    callback(err, model);
  });
};

module.exports = function (options) {
  var app = express();
  var store = racer.createStore(options);
  var path = options.path;

  app.use(require('body-parser')());
  app.use(store.modelMiddleware())
  
  // prepare input
  var prepare = function (req, res, next) {
    var modelPath = toModelPath(req.path);
    console.log("modelPath", modelPath);
    getModel(req, modelPath, function (err, model) {
      if (err) { return next(err); }
      req.model = model;
      next();
    });
  };

  app.use(prepare);

  // find
  app.get("/"+path, function (req, res, next) {
    res.data = req.model.get() || [];
    next();
  });

  // create
  app.post("/"+path, function (req, res, next) {
    var id = req.model.add(req.body);
    res.data = req.model.get(id);
    res.status(201);
    next();
  });

  // read
  app.get("/"+path+'/:id', function (req, res, next) {
    console.log("read", req.model);
    res.data = req.model.get();
    next();
  });

  // update
  app.put("/"+path+'/:id', function (req, res, next) {
    res.data = req.model.set(req.body);
    next();
  });

  // delete
  app.delete("/"+path+'/:id', function (req, res, next) {
    req.model.del()
    res.data = null;
    next();
  });

  // format output
  app.use(options.format || function (req, res, next) {
    //console.log("output", res.data);
    if (typeof res.data === 'undefined') {
      res.status(405);
    }
    res.format({
      'application/json': function () {
        res.json(res.data);
      },
    });
  });

  return app;
};
