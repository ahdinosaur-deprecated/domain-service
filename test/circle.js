var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var request = require('supertest-as-promised');
var Promise = require('bluebird');
var feathers = require('feathers');
var level = require('level-test')();
var _ = require('lodash');
var urlencode = require('urlencode');
require('longjohn');

describe("#CircleService", function () {
  var app, db;
  var Person, Circle;
  var people, threeMusketeers;

  before(function () {
    db = level('testdb', { encoding: 'json' });

    Person = require('open-app-person-domain')({
      db: db,
      name: "people",
    });
    Person = Promise.promisifyAll(Person);

    Circle = require('open-app-circle-domain')({
      db: db,
      name: "circles",
    });
    Circle = Promise.promisifyAll(Circle);

    people = [{
        name: "Athos",
      }, {
        name: "Aramis",
      }, {
        name: "Porthos",
      }];

    threeMusketeers = {
        name: "The Three Musketeers",
        description: "all for one, one for all",
        member: people,
    };    

    app = feathers()
      .configure(feathers.rest())
      .configure(require('../')())
      .use(require('body-parser')())
      .domain(Person)
      .domain(Circle)
      .setup()
    ;

    request = request(app);
  });

  it("should create Circle", function () {

    return request
    .post("/circles")
    .send(threeMusketeers)
    .expect("Content-Type", /json/)
    .expect(201)
    .then(function (res) {
      var aCircle = res.body;

      expect(aCircle["@context"]).to.deep.equal(Circle.context);
      expect(aCircle).to.have.property("id");
      expect(aCircle).to.have.property("name").that.equals(threeMusketeers.name);
      expect(aCircle).to.have.property("type", "Circle");

      expect(_.pluck(aCircle.member, 'name'))
        .to.include.members(_.pluck(people, 'name'));

      delete aCircle['@context'];
      delete aCircle.id;
      delete aCircle.type;

      return Promise.map(aCircle.member, function (member) {
        expect(member).to.have.property('id');
        delete member['id'];
        return member; 
      })
      .then(function (members) {
        expect(members).to.have.length.that.equals(people.length);
        expect(members).to.deep.include.members(people);
      });
    });
  });

  it("should add a new member to a circle", function () {

    // save a group in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      var id = dbCircle.key;
      // create new member
      var newMember = {
        name: "d'Artagnan",
      };
      var newMembers = people.concat([newMember]);

      // post new circle member with API
      return request
      .post("/circles/" + urlencode(id) + "/member")
      .send(newMember)
      .expect("Content-Type", /json/)
      .expect(201)
    })
    .then(function (res) {
      // check response body
      var aCircle = res.body;
      expect(_.pluck(aCircle.member, 'name'))
        .to.include.members(_.pluck(newMembers, 'name'));

      // check db
      expect(_.pluck(dbCircle.member, 'name'))
        .to.include.members(_.pluck(newMembers, 'name'));
    });
  });


  it("should remove a member from a circle", function () {
    var circleId, memberId;

    // save a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      // store circle info
      circleId = dbCircle.key;
      memberId = dbCircle.member[0].key;
      // delete circle member with API
      return request
      .delete("/circles/" + urlencode(circleId) + "/members/" + urlencode(memberId))
      .expect("Content-Type", /json/)
      .expect(204);
    })
    .then(function (res) {
      expect(res.body).to.not.exist;
      // get circle from db
      return Circle.getAsync(circleId)
    })
    .then(function (aCircle) {
      // check that circle does not include deleted member
      var members = aCircle.member;
      expect(_.pluck(members, 'id').to.not.include(memberId));
    });
  });


  it("should read all circles", function () {

    // save a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      // get all circles with API
      return request
      .get("/circles")
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {
      var circles = res.body;
      var aCircle = circles[0];

      expect(circles).length.to.equal(1)

      expect(aCircle["@context"]).to.deep.equal(Circle.context);
      expect(aCircle).to.have.property("id");
      expect(aCircle).to.have.property("type", "Circle");

      delete aCircle['@context'];
      delete aCircle.id;
      delete aCircle.type;

      // TODO this check won't pass
      return Promise.map(aCircle.member, function (member) {
        expect(member).to.have.property('id');
        delete member['id'];
        return member
      })
      .then(function () {
        expect(aCircle).to.deep.equal(threeMusketeers);
      });
    });
  });


    it("should get a circle", function () {

    // put a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      var id = dbCircle.key;
      // get circle from API
      return request
      .get("/circles/" + id)
      .expect("Content-Type", /json/)
      .expect(200)
    })
    .then(function (res) {
      var aCircle = res.body;

      expect(aCircle["@context"]).to.deep.equal(Circle.context);
      expect(aCircle).to.have.property("id");
      expect(aCircle).to.have.property("type", "Circle");

      delete aCircle['@context'];
      delete aCircle.id;
      delete aCircle.type;

      // TODO this check won't pass
      return Promise.map(aCircle.member, function (member) {
        expect(member).to.have.property('id');
        delete member['id'];
        return member
      })
      .then(function () {
        expect(aCircle).to.deep.equal(threeMusketeers);
      });
    });
  });

  it("should update a circle", function () {

    var newData = {
      name: "The Four Musketeers?"
    };

    // put a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      var id = dbCircle.key;
      // update circle with API
      return request
      .put("/circles/" + id)
      .send(newData)
      .expect("Content-Type", /json/)
      .expect(201);
    })
    .then(function (res) {
      var updatedCircle = res.body;

      expect(updatedCircle["@context"]).to.deep.equal(Circle.context);
      expect(updatedCircle).to.have.property("id");
      expect(updatedCircle).to.have.property("type", "Circle");

      delete updatedCircle['@context'];
      delete updatedCircle.id;
      delete updatedCircle.type;

      expect(updatedCircle).to.have.property('name').that.equals(newData.name);
    });
  });

    it("should delete a circle", function () {

    // put a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      var id = dbCircle.key;
      // delete circle with id
      return request
      .delete("/circles/" + id)
      .expect("Content-Type", /json/)
      .expect(204);
    })
    .then(function (res) {
      // get deleted circle
      var get = Circle.getAsync(id);
      expect(get).to.be.rejectedWith(errors.NotFound);
    });
  });


  it("should find circles that contain a person", function () {
    var circleId;

    // put a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      circleId = dbCircle.key;
      var personId = dbCircle.member[0].key;

      // get circles with person as member with API
      return request
      .get("/circles?member=" + urlencode(personId))
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {
      var circles = res.body;
      var aCircle = circles[0];
      expect(circles).to.have.length(1);
      expect(aCircle).to.have.property('id').that.equals(circleId);
    });
  });

  it("should read members of a circle", function () {

    // put a circle in the db
    var dbCircle = Promise.promisifyAll(Circle.create(threeMusketeers));
    return dbCircle.saveAsync()
    .then(function () {
      var circleId = dbCircle.key;
      // get members of circle with API
      return request
      .get("/circles/" + urlencode(circleId) + "/member")
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {
      var members = res.body;

      expect(members).to.have.length(3);

      Promise.map(members, function (member) {
        expect(member).to.have.property('id');
        delete member['id'];
        return member
      })
      .then(function () {
        expect(members).to.deep.equal(people);
      });
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
