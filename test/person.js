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

      delete aPerson['@context'];
      delete aPerson.id;
      delete aPerson.type;

      expect(aPerson).to.deep.equal(person);

      done();
    });
  });


  it("should get all Persons", function (done) {

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    var stooge = Person.create(person);

    stooge.save(function (err) {
      request
      .get("/people")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;
        var people = res.body;
        console.log('people', people)
        expect(people).to.have.length(1);
        done();
      });
    });

  });

  it("should get a person", function (done) {

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    var stooge = Person.create(person);

    stooge.save(function (err) {
      request
      .get("/people/" + "people!0000000001")
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;
        var thePerson = res.body;

        expect(thePerson["@context"]).to.deep.equal(Person.context);
        expect(thePerson).to.have.property("id");
        expect(thePerson).to.have.property("type", "schema:Person");      
       
        delete thePerson['@context'];
        delete thePerson.id;
        delete thePerson.type;

        expect(thePerson).to.deep.equal(person);

        done();
      });
    });


  })

  it("should update a person", function (done) {

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };

    var newData = {
      name: "Bob Loblaw",
      email: "bobsnewemail@email.com",
    };

    var stooge = Person.create(person);

    stooge.save(function (err) {
      request
      .put("/people/" + "people!0000000001")
      .send(newData)
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;

        var updatedPerson = res.body;

        expect(updatedPerson["@context"]).to.deep.equal(Person.context);
        expect(updatedPerson).to.have.property("id");
        expect(updatedPerson).to.have.property("type", "schema:Person");      
       
        delete updatedPerson['@context'];
        delete updatedPerson.id;
        delete updatedPerson.type;

        expect(updatedPerson).to.deep.equal(newData);

        done();
      });
    });
  });


  it("should delete a person", function (done) {

    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    }; 

    var stooge = Person.create(person);

    stooge.save(function (err) {
      request
      .delete("/people/" + "people!0000000001")
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;
        var body = res.body;

        expect(body).to.deep.equal({msg: "people!0000000001 deleted"})

        done();
     });
    })



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
