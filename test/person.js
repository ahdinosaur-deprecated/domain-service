var expect = require('chai').expect;
var request = require('supertest');
var bluebird = require('bluebird');
var feathers = require('feathers');
var level = require('level-test')();
var _ = require('lodash');
require('longjohn');

describe("#PersonService", function () {
  var app, db;
  var Person;

  before(function () {
    db = level('testdb', { encoding: 'json' });

    Person = require('open-app-person-domain')({
      db: db,
      name: "people",
    });

    app = feathers()
      .configure(feathers.rest())
      .configure(require('../')())
      .use(require('body-parser')())
      .domain(Person)
    ;

    request = request(app);
  });

  it("should create Person", function (done) {
    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    request
    .post("/people")
    .send(person)
    .expect("Content-Type", /json/)
    .expect(201)
    .end(function (err, res) {
      expect(err).to.not.exist;

      var aPerson = res.body;

      expect(aPerson["@context"]).to.deep.equal(Person.context);
      expect(aPerson).to.have.property("id");
      expect(aPerson).to.have.property("type", "schema:Person");

      console.log('aPerson', aPerson);

      delete aPerson['@context'];
      delete aPerson.id;
      delete aPerson.type;

      expect(aPerson).to.deep.equal(person);

      done();
    });
  });


  after(function (done) {
    db.close(done);
  });


});
