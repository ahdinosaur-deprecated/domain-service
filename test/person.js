var expect = require('chai').expect;

var feathers = require('feathers');
var level = require('level');
var db = level('testdb');

var PersonDomain;
var Person;

describe("#PersonService", function () {
  before(function () {
    var service = require('../')
    PersonDomain = require('open-app-person-domain')({
      db: db,
      name: "person",
    });
    Person = service(PersonDomain);
  });

  it("should create Person", function (done) {
    var person = {
      name: "Bob Loblaw",
      email: "bobloblawslawblog.com",
    };
    Person.create(person, {}, function (err, aPerson) {
      expect(err).to.not.exist;

      expect(aPerson["@context"]).to.deep.equal(PersonDomain.context);
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

  it("should get a Person", function (done) {




    done()
  })



});
