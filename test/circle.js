var expect = require('chai').expect;
var request = require('supertest');
var bluebird = require('bluebird');
var feathers = require('feathers');
var level = require('level-test')();
var _ = require('lodash');
require('longjohn');

describe("#CircleService", function () {
  var app, db;
  var Person, Circle;

  before(function () {
    db = level('testdb', { encoding: 'json' });

    Person = require('open-app-person-domain')({
      db: db,
      name: "people",
    });

    Circle = require('open-app-circle-domain')({
      db: db,
      name: "circles",
    });

    app = feathers()
      .configure(feathers.rest())
      .configure(require('../')())
      .use(require('body-parser')())
      .domain(Person)
      .domain(Circle)
    ;

    request = request(app);
  });

  it("should create Circle", function (done) {

    var people = [{
      name: "Athos",
    }, {
      name: "Aramis",
    }, {
      name: "Porthos",
    }];

    var circle = {
      name: "The Three Musketeers",
      description: "all for one, one for all",
      member: people,
    };

    request
    .post("/circles")
    .send(circle)
    .expect("Content-Type", /json/)
    .expect(201)
    .end(function (err, res) {
      expect(err).to.not.exist;

      var aCircle = res.body;

      expect(aCircle["@context"]).to.deep.equal(Circle.context);
      expect(aCircle).to.have.property("id");
      expect(aCircle).to.have.property("type", "schema:Organization");

      expect(_.pluck(aCircle.member, 'name'))
        .to.include.members(_.pluck(people, 'name'));

      var id = aCircle.id;

      delete aCircle['@context'];
      delete aCircle.id;
      delete aCircle.type;
      delete aCircle.members;

      expect(aCircle).to.deep.equal(circle);

      var newMember = {
        name: "d'Artagnan",
      };

      request
      .post("/circles/" + id + "/members")
      .send(newMember)
      .expect("Content-Type", /json/)
      .expect(201)
      .end(function (err, res) {
        expect(err).to.not.exist;

        var bCircle = res.body;

        expect(_.pluck(bCircle.member, 'name'))
          .to.include.members(_.pluck(people.concat([newMember]), 'name'));

        done();
      });
    });
  });

  after(function (done) {
    db.close(done);
  });
});
