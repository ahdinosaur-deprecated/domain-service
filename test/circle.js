var expect = require('chai').expect;
var request = require('supertest');
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

    Circle = require('open-app-circle-domain')({
      db: db,
      name: "circles",
    });

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

  it("should create Circle", function (done) {

    request
    .post("/circles")
    .send(threeMusketeers)
    .expect("Content-Type", /json/)
    .expect(201)
    .end(function (err, res) {
      expect(err).to.not.exist;

      var aCircle = res.body;

      expect(aCircle["@context"]).to.deep.equal(Circle.context);
      expect(aCircle).to.have.property("id");
      expect(aCircle).to.have.property("type", "schema:Organization");
      expect(aCircle).to.have.property("name").that.equals(threeMusketeers.name);

      delete aCircle['@context'];
      delete aCircle.id;
      delete aCircle.type;

      Promise.map(aCircle.member, function (member) {
        expect(member).to.have.property('id');
        delete member['id'];
        return member; 
      })
      .then(function (members) {
        expect(members).to.have.length.that.equals(people.length);
        expect(members).to.deep.include.members(people);
      })
      .then(function () {
        done();        
      });
    });


  });

  it("should add a new member to a circle", function (done) {

    dbCircle = Circle.create(threeMusketeers);

    //put a group in the db
    dbCircle.save(function (err) {

      var id = dbCircle.key;

      var newMember = {
        name: "d'Artagnan",
      };

      var newMembers = people.concat([newMember]);

      //test api
      request
      .post("/circles/" + urlencode(id) + "/member")
      .send(newMember)
      .expect("Content-Type", /json/)
      .expect(201)
      .end(function (err, res) {
        expect(err).to.not.exist;

        //test response body
        var aCircle = res.body;

        expect(_.pluck(aCircle.member, 'name'))
          .to.include.members(_.pluck(newMembers, 'name'));

        //test db
        expect(_.pluck(dbCircle.member, 'name'))
          .to.include.members(_.pluck(newMembers, 'name'));

        done();  

      });
    });
  });


  it("should remove a member from a circle", function (done) {

    dbCircle = Circle.create(threeMusketeers)

    //put a group in the db
    dbCircle.save(function (err) {

      var circleId = dbCircle.key;
      var memberId = dbCircle.member[0].key;

      //test api
      request
      .delete("/circles/" + urlencode(circleId) + "/members/" + urlencode(memberId))
      .expect("Content-Type", /json/)
      .expect(204)
      .end(function (err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.not.exist;

        Circle.get(circleId, function (err, aCircle) {

          var members = aCircle.member;

          expect(_.pluck(members, 'id').to.not.include(memberId));

          done();
        });
      });
    });
  });


  it("should read all circles", function (done) {

    // put a group in the db, ready for testing
    dbCircle =  Circle.create(threeMusketeers);

    dbCircle.save(function (err) {

      //test api
      request
      .get("/circles")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;  

        var circles = res.body;
        var aCircle = circles[0];

        expect(circles).length.to.equal(1)

        expect(aCircle["@context"]).to.deep.equal(Circle.context);
        expect(aCircle).to.have.property("id");
        expect(aCircle).to.have.property("type", "schema:Organization");

        delete aCircle['@context'];
        delete aCircle.id;
        delete aCircle.type;

        Promise.map(aCircle.member, function (member) {
          delete member['id'];
          return member
        })
        .then(function () {
          expect(aCircle).to.deep.equal(threeMusketeers);
          done();
        });
      });
    });
  });


    it("should get a circle", function (done) {

    // put a group in the db, ready for testing
    dbCircle =  Circle.create(threeMusketeers);

    dbCircle.save(function (err) {

      var id = dbCircle.key;

      //test api
      request
      .get("/circles/" + id)
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;  

        var aCircle = res.body;

        expect(aCircle["@context"]).to.deep.equal(Circle.context);
        expect(aCircle).to.have.property("id");
        expect(aCircle).to.have.property("type", "schema:Organization");

        delete aCircle['@context'];
        delete aCircle.id;
        delete aCircle.type;

        Promise.map(aCircle.member, function (member) {
          delete member['id'];
          return member
        })
        .then(function () {
          expect(aCircle).to.deep.equal(threeMusketeers);
          done();
        });

      });
    });
  });

  it("should update a circle", function (done) {

    var newData = {
      name: "The Four Musketeers?"
    };

      // put a group in the db, ready for testing
    dbCircle =  Circle.create(threeMusketeers);

    dbCircle.save(function (err) {

      var id = dbCircle.key;

      //test api
      request
      .put("/circles/" + id)
      .send(newData)
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        expect(err).to.not.exist;  

        var updatedCircle = res.body;

        expect(updatedCircle["@context"]).to.deep.equal(Circle.context);
        expect(updatedCircle).to.have.property("id");
        expect(updatedCircle).to.have.property("type", "schema:Organization");

        delete updatedCircle['@context'];
        delete updatedCircle.id;
        delete updatedCircle.type;

        expect(updatedCircle).to.have.property('name').that.equals(newData.name);

        done();

      });
    });
  });

    it("should delete a circle", function (done) {

    // put a group in the db, ready for testing
    dbCircle =  Circle.create(threeMusketeers);

    dbCircle.save(function (err) {

      var id = dbCircle.key;

      //test api
      request
      .delete("/circles/" + id)
      .expect("Content-Type", /json/)
      .expect(204)
      .end(function (err, res) {
        expect(err).to.not.exist;  

        Circle.get(id, function (err, model) {
          //TODO expected error message
          expect(err).to.exist;
          done();
        });

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
