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
  var saveCircle;

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

    saveCircle = function (circle) {
      var dbCircle;
      circle = _.clone(circle);
      return Promise.map(circle.member, function (member) {
        var dbPerson = Person.create(member);
        dbPerson = Promise.promisifyAll(dbPerson);
        return dbPerson.saveAsync()
        .then(function () {
          return dbPerson;
        });
      })
      .then(function (members) {
        var memberIds = _.pluck(members, 'id');
        circle.member = memberIds;
        dbCircle = Circle.create(circle);
        dbCircle = Promise.promisifyAll(dbCircle);
        return dbCircle.saveAsync();
      })
      .then(function () {
        return dbCircle;
      });
    };

    checkCircle = function (circle, baseCircle, context, depth, callback) {
      var depth = depth || 1;

      if (context) {
        expect(circle['@context']).to.deep.equal(Circle.context)
      }

      expect(circle).to.have.property("id");
      expect(circle).to.have.property("type", "Circle");
      delete circle['@context'];
      delete circle.id;
      delete circle.type;

      if (depth === 1) {
        callback(null, circle)
      } else {
        checkMembers(circle.member, baseCircle.member)
        .then(function () {
          expect(circle).to.deep.equal(baseCircle);
        })
          .nodeify(callback)
      };
    };

    checkMembers = function (members, baseMembers, callback) {
      Promise.map(members, function (member) {
        expect(member).to.have.property('id');
        expect(member).to.have.property('type', "Person");
        delete member['id'];
        delete member['type'];
        return member;
      })
      .then(function () {
        expect(members).to.have.length(baseMembers.length);
        expect(members).to.deep.include.members(baseMembers);
        callback(null, members);
      });
    };

    checkMembers = Promise.promisify(checkMembers);
    checkCircle = Promise.promisify(checkCircle);

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
      return checkCircle(aCircle, threeMusketeers, context, 2)
    });
  });

  it("should add a new member to a circle", function () {
    var dArtagnan, newMembers;
    var dbCircle;
    var circleId;

    // save a group in the db
    return saveCircle(threeMusketeers)
    .then(function (circle) {
      circleId = circle.key;
      // create new member
      dArtagnan = {
        name: "d'Artagnan",
      };

      newMembers = people.concat([dArtagnan]);
      // post new circle member with API
      return request
      .post("/circles/" + urlencode(circleId) + "/member")
      .send(dArtagnan)
      .expect("Content-Type", /json/)
      .expect(201)
    })
    .then(function (res) {
      // check response body
      var newMember = res.body;
      // expect(newMember).to.have.property('id')
      // expect(newMember).to.have.property('name', dArtagnan.name)

      //check db with a fresh get
      Circle.getAsync(circleId)
      .then(function (circle) {
        var circle = circle.toJSON();
        checkMembers(circle.member, newMembers)
      });
    });
  });

  it("should remove a member from a circle", function () {
    var circleId, memberId;

    // save a circle in the db
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
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
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
      // get all circles with API
      return request
      .get("/circles")
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {

      //res.body is an array
      var circles = res.body['@graph'];

      var aCircle = circles[0];
      console.log('circles', circles)
      expect(circles).to.have.length(1);
      return checkCircle(aCircle, threeMusketeers, null, 1);
    });
  });


    it("should get a circle", function () {
    // put a circle in the db
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
      var id = dbCircle.key;
      // get circle from API
      return request
      .get("/circles/" + id)
      .expect("Content-Type", /json/)
      .expect(200)
    })
    .then(function (res) {
      var aCircle = res.body;
      return checkCircle(aCircle, threeMusketeers, context, 2);
    });
  });

  it("should update a circle", function () {

    var newData = {
      name: "The Four Musketeers?"
    };

    // put a circle in the db
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
      var id = dbCircle.key;
      // update circle with API
      return request
      .put("/circles/" + id)
      .send(newData)
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {
      var aCircle = res.body;

      return checkCircle(aCircle, threeMusketeers, context, 1)
        .then(function (updatedCircle) {
          expect(updatedCircle).to.have.property('name', newData.name);
        });
    });
  });

  it("should delete a circle", function () {
    var id;

    // put a circle in the db
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
      id = dbCircle.key;
      // delete circle with id
      return request
      .delete("/circles/" + id)
      .expect("Content-Type", /json/)
      .expect(204);
    })
    .then(function (res) {
      // get deleted circle
      var get = Circle.getAsync(id);
      // TODO fix
      //expect(get).to.be.rejectedWith(errors.NotFound);
    });
  });


  it("should find circles that contain a person", function () {
    var circleId;

    // put a circle in the db
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
      circleId = dbCircle.key;
      var personId = dbCircle.member[0].key;

      // get circles with person as member with API
      return request
      .get("/circles?member=" + urlencode(personId))
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {
      var circles = res.body['@graph'];
      var aCircle = circles[0];
      expect(circles).to.be.instanceOf(Array)
      expect(circles).to.have.length(1);
      expect(aCircle).to.have.property('id').that.equals(circleId);
    });
  });

  it("should read members of a circle", function () {

    // put a circle in the db
    return saveCircle(threeMusketeers)
    .then(function (dbCircle) {
      var circleId = dbCircle.key;
      // get members of circle with API
      return request
      .get("/circles/" + urlencode(circleId) + "/member")
      .expect("Content-Type", /json/)
      .expect(200);
    })
    .then(function (res) {
      var members = res.body['@graph'];
      return checkMembers(members, threeMusketeers.member);
    });
  });


  // it("should support sorting", function () {






  // })

  afterEach(function () {
    return Promise.all([
      Person.wipeAsync(),
      Circle.wipeAsync(),
    ])
  });

  after(function (done) {
    db.close(done);
  });
});
