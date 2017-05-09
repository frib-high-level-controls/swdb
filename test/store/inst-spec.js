var app = require("../../server");
var expect = require("chai").expect;
var supertest = require("supertest")(app);
var tools = require("../../lib/swdblib");
var be = require("../../lib/db");
var instBe = require("../../lib/instDb");
var expect2 = require("expect");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
var path = require('path');
const exec = require('child_process').exec;
const testSwNames = JSON.parse(fs.readFileSync('./test/misc/testSwNames.json', 'utf8'));

var testLogin = function(request, done) {
  console.log('Login start');
  supertest
  .get("/login?username=testuser&password=testuserpasswd")
  .send(testAcct)
  .expect(200)
  .end(function(err,res){
    console.log('Login complete');
    agent.saveCookies(res);
    done();
  });
};

// clear the test collection before and after tests suite
before(function(done) {
  // clear the test collection
  this.timeout(5000);
  console.log("Dropping collections...");
  instBe.instDoc.db.collections.instCollection.drop();
  be.swDoc.db.collections.swdbCollection.drop(function(err){
    be.swDoc.db.collections.swNamesProp.drop(function(err){
      console.log("inserting testSwNames in swNamesProp collection:"+JSON.stringify(testSwNames,null,2));
      be.swNamesDoc.db.collections.swNamesProp.insert(testSwNames,
          function(err, records){
        done();
      });
    });
  });
});

after(function(done) {
  // clear the test collection
  console.log("Dropping collections...");
  be.swDoc.db.collections.swdbCollection.drop();
  be.swDoc.db.collections.swNamesProp.drop();
  instBe.instDoc.db.collections.instCollection.drop();
  done();
});

var Cookies;
//
describe("app", function() {
  before("login as test user", function(done){
    supertest
    .get("/testlogin?username=testuser&password=testuserpasswd")
    .expect(200)
    .end(function(err,res){
      Cookies = res.headers['set-cookie'].pop().split(';')[0];
      console.log('Login complete. Cookie: '+Cookies);
      done();
    });
  });

  // web facing tests
  //
  it("Respond with welcome", function(done) {
    supertest
    .get("/")
    .expect(200)
    .end(function(err, res){
      expect(res.res.text).to.match(/SWDB \(Prototype Interface\)/);
      done(err);
    });
  });
  it("Returns all sw records", function(done) {
    supertest
    .get("/swdbserv/v1")
    .expect(200)
    .end(function(err, res){
      expect(res.text).to.match(/\[*\]/);
      done();
    });
  });
  it("Returns all installation records", function(done) {
    supertest
    .get("/instserv/v1")
    .expect(200)
    .end(function(err, res){
      expect(res.text).to.match(/\[*\]/);
      done();
    });
  });
  it("Post a new installation record", function(done) {
    supertest
    .post("/instserv/v1/")
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .send({host: "Test host", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
    .expect(201)
    .end(done);
  });
  it("Errors posting a bad installation", function(done) {
    supertest
    .post("/instserv/v1/")
    .send({host: "test host", status: "BADENUM", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(400)
    .end(function(err, res){
      expect(res.text).to.match(/`BADENUM` is not a valid enum value for path `status`/);
      done();
    });
  });
  it("Errors posting a duplicate installation record", function(done) {
    supertest
    .post("/instserv/v1/")
    .send({host: "Test host", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(500)
    .expect('There was a duplicate key error')
    .end(function(err,res) {
      done();
    });
  });
  it("Post a new record installation on a different host", function(done) {
    supertest
    .post("/instserv/v1/")
    .send({host: "Test host2", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end(done);
  });
  it("Post a new record installation with different sw ref", function(done) {
    supertest
    .post("/instserv/v1/")
    .send({host: "Test host", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbaa"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end(done);
  });
  describe('get id for installation Test host test sw ref', function() {
    var wrapper = {origId:null};
    before("Get ID record id:Test host test sw ref", function(done) {
      //var origId = tools.getIdFromSwName("test1000");
      supertest
      .get("/instserv/v1")
      .expect(200)
      .end(function(err,res){
        res=JSON.parse(res.text);
        for (var i=0, iLen=res.length; i<iLen; i++){
          if (res[i].host=="Test host" &&
            res[i].software=="badbeefbadbeefbadbeefbad") wrapper.origId=res[i]._id;
        }
        done();
      });
    });

    it("Returns test installation record id:Test host test sw ref", function(done) {
      supertest
      .get("/instserv/v1/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        expect(res.body).to.have.property("_id");
        expect(res.body.host).to.equal("Test host");
        expect(res.body._id).to.match(/.{24}/);
        expect(res.body.__v).to.match(/\d+/);
        done();
      });
    });
    it("Can update a record via PUT host id:Test host3", function(done) {
      supertest
      .put("/instserv/v1/"+wrapper.origId)
      .send({host: "Test host3"})
    .set('Cookie', [Cookies])
      .expect(200)
      .end(done);
    });
    it("Returns test record 1d:Test host3", function(done) {
      supertest
      .get("/instserv/v1/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        expect(res.body).to.have.property("_id");
        //expect(res.body._id).to.equal(wrapper.origId);
        expect(res.body.host).to.equal("Test host3");
        done();
      });
    });



    // This table lists test requests to make and the expected
    // responses.
    // {req:{msg:,url:,type:,err{status:}}
    //  res:{msg:,url:,type:,err{status:}}
    //  }
    var testUpdateParams = [
      {"type": "PUT", "req": {"msg": {"host": "Test host4"},"url": "/instserv/v1/", "err": {"status": 200}}},
      {"type": "GET", "res": {"msg": {"host": "Test host4"},"url": "/instserv/v1/",  "err": {"status": 200}}}
    ];

    // go through the table and check the given parameters
    testUpdateParams.forEach(function(value,i) {
      //handle PUT
      if (value.type === "PUT") {
        it(value.req.err.status+" "+value.type+" msg: "+
        JSON.stringify(JSON.stringify(value.req.msg)), function(done) {
          supertest
          .put(value.req.url+wrapper.origId)
          .send(value.req.msg)
          .set('Cookie', [Cookies])
          .end(function(err,res){
            if (value.req.err.status){
              expect(res.status).to.equal(value.req.err.status);
            }
            if (value.req.err.msgHas) {
              expect2(res.text).toMatch(value.req.err.msgHas);
            }

            done();
          });
        });
      }
      if (value.type === "POST") {
        it(value.req.err.status+" "+value.type+" "+JSON.stringify(JSON.stringify(value.req.msg)), function(done) {
          supertest
          .post(value.req.url)
          .send(value.req.msg)
          .set('Cookie', [Cookies])
          .end(function(err,res){
            if (value.req.err.status){
              expect(res.status).to.equal(value.req.err.status);
            }
            if (value.req.err.msgHas) {
              expect2(res.text).toMatch(value.req.err.msgHas);
            }
            done();
          });
        });
      }

      // handle GET
      if (value.type === "GET") {
        it(value.res.err.status+" "+JSON.stringify(value.res.msg), function(done) {
          supertest
          .get(value.res.url+wrapper.origId)
          .end(function(err, res) {
            if (value.res.err.status){
              expect(res.status).to.equal(value.res.err.status);
            }
            for (var prop in value.res.msg) {
              expect(res.body).to.have.property(prop);
              // This is to allow sloppy matching on whole objects.
              // See the npm "expect" module for more
              expect2(res.body[prop]).toMatch(value.res.msg[prop]);
            }
            done();
          });
        });
      }
    });
    it("Errors on update a nonexistent record via POST id id:badbeef", function(done) {
      supertest
      .post("/instserv/v1/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test Record5"})
      .expect(404)
      .expect('Cannot POST /instserv/v1/badbeef\n')
      .end(done);
    });
    it("Errors on update a nonexistent record via PUT id:badbeef", function(done) {
      supertest
      .put("/instserv/v1/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test Record5"})
      .expect(500)
      .expect('Record not found')
      .end(done);
    });
    it("Errors on update a nonexistent record via PATCH id:badbeef", function(done) {
      supertest
      .patch("/instserv/v1/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test Record5"})
      .expect(500)
      .expect('Record not found')
      .end(done);
    });
  });
});
