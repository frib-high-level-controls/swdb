var app = require("../../app/server");
var expect = require("../../../node_modules/chai").expect;
var supertest = require("../../../node_modules/supertest")(app);
var tools = require("../../app/lib/swdblib");
var Be = require('../../app/lib/Db');
let be = new Be.Db();
var instBe = require("../../app/lib/instDb");
var expect2 = require("../../../node_modules/expect");
var XMLHttpRequest = require("../../../node_modules/xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();


var webdriver = require("../../../node_modules/selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("../../../node_modules/selenium-webdriver/testing");
var path = require('path');
const exec = require('child_process').exec;

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

var Cookies;
//
describe("app", function() {
  var chromeDriver;
  before("setup", function(done){
    console.log("Starting inst-spec");
    this.timeout(5000);
    testTools.loadTestCollectionsStandard(done);
    });
  after(function(done) {
    // clear the test collection
    testTools.clearTestCollections(done);
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
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err, res){
        expect(res.text).to.match(/\[*\]/);
        done();
      });
  });
  it("Returns all installation records", function(done) {
    supertest
      .get("/api/v1/inst/")
      .expect(200)
      .end(function(err, res){
        expect(res.text).to.match(/\[*\]/);
        done();
      });
  });
  it("Post a new installation record", function(done) {
    supertest
      .post("/api/v1/inst/")
      .set("Accept", "application/json")
      .set('Cookie', [Cookies])
      .send({host: "Test host", area: "Global", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
      .expect(201)
      .end(done);
  });
  it("Errors posting a bad status installation", function(done) {
    supertest
      .post("/api/v1/inst/")
      .send({host: "test host", area: "Global", status: "BADENUM", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
      .set("Accept", "application/json")
      .set('Cookie', [Cookies])
      .expect(400)
      .end(function(err, res){
        expect(res.text).to.match(/Status must be one of DEVEL,MAINT,RDY_INSTALL,RDY_INT_TEST,RDY_BEAM,DEPRECATED,STANDBY/);
        done();
      });
  });
  it("Errors posting a duplicate installation record", function(done) {
    supertest
      .post("/api/v1/inst/")
      .send({host: "Test host", area: "Global", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
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
      .post("/api/v1/inst/")
      .send({host: "Test host2", area: "Global", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbad"})
      .set("Accept", "application/json")
      .set('Cookie', [Cookies])
      .expect(201)
      .end(done);
  });
  it("Post a new record installation with different sw ref", function(done) {
    supertest
      .post("/api/v1/inst/")
      .send({host: "Test host", area: "Global", status: "DEVEL", statusDate: "date 1000", software: "badbeefbadbeefbadbeefbaa"})
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
        .get("/api/v1/inst/")
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
        .get("/api/v1/inst/"+wrapper.origId)
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
        .put("/api/v1/inst/"+wrapper.origId)
        .send({host: "Test host3"})
        .set('Cookie', [Cookies])
        .expect(200)
        .end(done);
    });
    it("Returns test record 1d:Test host3", function(done) {
      supertest
        .get("/api/v1/inst/"+wrapper.origId)
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
      {"type": "PUT", "req": {"msg": {"host": "Test host4"},"url": "/api/v1/inst/", "err": {"status": 200}}},
      {"type": "GET", "res": {"msg": {"host": "Test host4"},"url": "/api/v1/inst/",  "err": {"status": 200}}}
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
        .post("/api/v1/inst/badbeef")
        .set('Cookie', [Cookies])
        .send({swName: "Test Record5"})
        .expect(404)
        .expect('Cannot POST /api/v1/inst/badbeef\n')
        .end(done);
    });
    it("Errors on update a nonexistent record via PUT id:badbeef", function(done) {
      supertest
        .put("/api/v1/inst/badbeef")
        .set('Cookie', [Cookies])
        .send({swName: "Test Record5"})
        .expect(500)
        .expect('Record not found')
        .end(done);
    });
    it("Errors on update a nonexistent record via PATCH id:badbeef", function(done) {
      supertest
        .patch("/api/v1/inst/badbeef")
        .set('Cookie', [Cookies])
        .send({swName: "Test Record5"})
        .expect(500)
        .expect('Record not found')
        .end(done);
    });
  });
});