var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var request = require('supertest-as-promised');
var Promise = require('bluebird');
var feathers = require('feathers');
var errors = feathers.errors.types;
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
    });
    Person = Promise.promisifyAll(Person);

    app = feathers()
      .configure(feathers.rest())
      .configure(require('../')())
      .use(require('body-parser')())
      .domain(Person)
      .setup()
    ;

    request = request(app);
  });

  it("should create Person", function () {
    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    return request
    .post("/people")
    .send(person)
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

      expect(aPerson).to.deep.equal(person);
    });
  });

  it("should get all Persons", function () {

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    var stooge = Promise.promisifyAll(Person.create(person));

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

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    var stooge = Promise.promisifyAll(Person.create(person));

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

      expect(thePerson).to.deep.equal(person);
    });
  });

  it("should update a person", function () {

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    var newData = {
      name: "Bob Loblaw",
      email: "bobsnewemail@email.com",
    };

    var stooge = Promise.promisifyAll(Person.create(person));

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

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    }; 

    var stooge = Promise.promisifyAll(Person.create(person));
    return stooge.saveAsync()
    .then(function () {
      // delete person with API
      return request
      .delete("/people/" + stooge.key)
      .expect(204)
    })
    .then(function (res) {
      // get deleted person
      var get = Person.getAsync(stooge.key);
      expect(get).to.be.rejectedWith(errors.NotFound);
    });
  });

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
