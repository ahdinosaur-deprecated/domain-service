var expect = require('chai').expect;
var bluebird = require('bluebird');
var feathers = require('feathers');
var level = require('level-test')();
var _ = require('lodash');

var db;

var CircleDomain;
var Circle;

describe("#CircleService", function () {
  before(function () {
    db = level('testdb', { encoding: 'json' });
    var service = require('../')
    require('open-app-person-domain')({
      db: db,
      name: "person",
    });
    CircleDomain = require('open-app-circle-domain')({
      db: db,
      name: "circle",
    });
    Circle = service(CircleDomain);
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
    Circle.create(circle, {}, function (err, aCircle) {
      expect(err).to.not.exist;

      expect(aCircle["@context"]).to.deep.equal(CircleDomain.context);
      expect(aCircle).to.have.property("id");
      expect(aCircle).to.have.property("type", "schema:Organization");

      expect(_.pluck(aCircle.member, 'name'))
        .to.include.members(_.pluck(people, 'name'));

      delete aCircle['@context'];
      delete aCircle.id;
      delete aCircle.type;
      delete aCircle.members;

      expect(aCircle).to.deep.equal(circle);

      var newMember = {
        name: "d'Artagnan",
      };
      Circle.members.create(newMember, {}, function (err, bCircle) {
        expect(err).to.not.exist;

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
