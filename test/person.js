var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var request = require('supertest-as-promised');
var Promise = require('bluebird');
var express = require('express');
var liveDbMongo = require('livedb-mongo');
var _ = require('lodash');
require('longjohn');

describe("#PersonService", function () {
  var app, db;
  var Person;
  var bob, athos, aramis, porthos;

  before(function () {
    var mongoUrl = 'mongodb://localhost:27017/database?auto_reconnect';
    var db = liveDbMongo(mongoUrl, { safe: true });

    bob = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    aramis = {
      name: "Aramis",
      email: "aramis@3muskeeters.com"
    };

    athos = {
      name: "Athos",
      email: "athos@3muskeeters.com"
    };

    porthos = {
      name: "Porthos",
      email: "porthos$3muskeeters.com"
    };

    app = express()
      .use(require('body-parser'))
      .use(require('../')({ db: db }))
    ;

    request = request(app);
  });

  it("should create Person", function () {

    return request
    .post("/people")
    .send(bob)
    .expect("Content-Type", /json/)
    .expect(201)
    .then(function (res) {
      var aPerson = res.body;

      expect(aPerson["@context"]).to.deep.equal(Person.context);
      expect(aPerson).to.have.property("id");
      expect(aPerson).to.have.property("type", "Person");

      delete aPerson['@context'];
      delete aPerson.id;
      delete aPerson.type;

      expect(aPerson).to.deep.equal(bob);
    });
  });

  it("should get all Persons", function () {

    var stooge = Promise.promisifyAll(Person.create(bob));

    return stooge.saveAsync()
    .then(function () {
      return request
      .get("/people")
      .expect("Content-Type", /json/)
      .expect(200)
    })
    .then(function (res) {
      var people = res.body;
      expect(people).to.have.length(1);
    });
  });

  it("should get a person", function () {

    var stooge = Promise.promisifyAll(Person.create(bob));

    stooge.saveAsync()
    .then(function () {
      return request
      .get("/people/" + stooge.key)
      .expect(200);
    })
    .then(function (res) {
      var thePerson = res.body;

      expect(thePerson["@context"]).to.deep.equal(Person.context);
      expect(thePerson).to.have.property("id");
      expect(thePerson).to.have.property("type", "Person");      
     
      delete thePerson['@context'];
      delete thePerson.id;
      delete thePerson.type;

      expect(thePerson).to.deep.equal(bob);
    });
  });

  it("should update a person", function () {

    var newData = {
      name: "Bob Loblaw",
      email: "bobsnewemail@email.com",
    };

    var stooge = Promise.promisifyAll(Person.create(bob));

    return stooge.saveAsync()
    .then(function () {
      return request
      .put("/people/" + stooge.key)
      .send(newData)
      .expect(200);
    })
    .then(function (res) {
      var updatedPerson = res.body;

      expect(updatedPerson["@context"]).to.deep.equal(Person.context);
      expect(updatedPerson).to.have.property("id");
      expect(updatedPerson).to.have.property("type", "Person");      
     
      delete updatedPerson['@context'];
      delete updatedPerson.id;
      delete updatedPerson.type;

      expect(updatedPerson).to.deep.equal(newData);
    });
  });

  it("should delete a person", function () {

    var stooge = Promise.promisifyAll(Person.create(bob));
    return stooge.saveAsync()
    .then(function () {
      // delete bob with API
      return request
      .delete("/people/" + stooge.key)
      .expect(204)
    })
    .then(function (res) {
      // get deleted bob
      var get = Person.getAsync(stooge.key);
      // TODO fix
      //expect(get).to.be.rejectedWith(errors.NotFound);
    });
  });

  it("should batch create people", function () {






  })

  afterEach(function (done) {
    db.createKeyStream()
      .on('data', function (k) {
        db.del(k) 
      })
      .on('close', function () {
        done();
      });
  });

  after(function (done) {
    db.close(done);
  });
});
