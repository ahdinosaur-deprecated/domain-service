var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var supertest = require('supertest-as-promised');
var Promise = require('bluebird');
var express = require('express');
var liveDbMongo = require('livedb-mongo');
var _ = require('lodash');
//require('longjohn');

var aramis = {
  name: "Aramis",
  email: "aramis@3muskeeters.com"
};

var athos = {
  name: "Athos",
  email: "athos@3muskeeters.com"
};

var porthos = {
  name: "Porthos",
  email: "porthos$3muskeeters.com"
};


describe("simple test", function () {
  var liveDb, request;

  var mongoUrl = 'mongodb://localhost:27017/database?auto_reconnect';

  before(function () {
    liveDb = liveDbMongo(mongoUrl, { safe: true });
    var app = require('../')({ path: "people", db: liveDb });
    request = supertest(app);
  })

  describe("#people", function () {

    beforeEach(function () {
      var createCollection =
        Promise.promisify(liveDb.mongo.createCollection).bind(liveDb.mongo)
      ;

      return Promise.all([
        createCollection('people'),
        createCollection('people_ops'),
      ])
    });

    it("should find no people", function () {
      return request
      .get("/people")
      .set("Accept", "application/json")
      .expect("Content-Type", /application\/json/)
      .expect(200)
      .then(function (res) {
        var people = res.body;
        expect(people).to.deep.equal([]);
      })
      ;
    });

    it("should CRUD thing", function () {
      var id;

      return request
      .post("/people")
      .send(athos)
      .set("Accept", "application/json")
      .expect("Content-Type", /application\/json/)
      .expect(201)
      .then(function (res) {
        var person = res.body;
        id = person.id;
        delete person.id;
        expect(person).to.deep.equal(athos);
      })
      .then(function () {
        return request
        .get("/people/" + id)
        .set("Accept", "application/json")
        .expect("Content-Type", /application\/json/)
        .expect(200)
      })
      .then(function (res) {
        var person = res.body;
        id = person.id;
        delete person.id;
        expect(person).to.deep.equal(athos);
      })
      ;
    });

    afterEach(function (done) {
      var dropCollection =
        Promise.promisify(liveDb.mongo.dropCollection)
        .bind(liveDb.mongo)
      ;

      return Promise.all([
        dropCollection('people'),
        dropCollection('people_ops'),
      ]);
    });
  });
});
