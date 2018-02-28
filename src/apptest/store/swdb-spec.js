var app = require("../../app/server");
var expect = require("chai").expect;
var supertest = require("supertest")(app);
var tools = require("../../app/lib/swdblib");
var Be = require('../../app/lib/Db');
let be = new Be.Db();

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

var expect2 = require("expect");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
var path = require('path');
const exec = require('child_process').exec;

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();
let dbg = require('debug');
const debug = dbg('swdb:swdb-spec-tests');

var Cookies;
//
describe("app", function() {
  before("Prep DB", async function () {
    this.timeout(8000);
    debug("Prep DB");
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after("clear db", async function () {
    debug("Clear DB");
    // clear the test collection
    await testTools.clearTestCollections(debug);
  });

  before("login as test user", function(done){
    this.timeout(8000);
    supertest
    .get("/login")
    .auth(props.test.username, props.test.password)
    .timeout(8000)
    .expect(302)
    .end(function(err,res){
      if (err) done(err);
      else {
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
        debug('test login cookies: ' + JSON.stringify(Cookies));
        done();
      }
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
    this.timeout(5000);
    supertest
    .get("/api/v1/swdb/")
    .expect(200)
    .end(function(err, res){
      if (err) {
        done(err);
      } else {
        expect(res.text).to.match(/\[*\]/);
        done();
      }
    });
  });

  it("Returns FORG user records", function(done) {
    this.timeout(5000);
    supertest
    .get("/api/v1/swdb/forgUsers")
    .expect(200)
    .end(function(err, res){
      if (err) {
        done(err);
      } else {
        try {
          sub = JSON.parse(res.text).filter((element, idx, array) => {
            return element.uid === "ELLISR";
          });
          if (sub.length === 1) {
            done();
          }
          else {
            debug('Got filtered array ' + JSON.stringify(sub));
            done(new Error('Cannot find expected user "ELLISR"'));
          }
        }
        catch (err) { 
          done(err);
        }
      }
    });
  });

  it("Returns FORG group records", function(done) {
    this.timeout(5000);
    supertest
    .get("/api/v1/swdb/forgGroups")
    .expect(200)
    .end(function(err, res){
      if (err) {
        done(err);
      } else {
        try {
          sub = JSON.parse(res.text).filter((element, idx, array) => {
            return element.uid === "IFS:LAB.FRIB.ASD.CONTROLS";
          });
          if (sub.length === 1) {
            done();
          }
          else {
            debug('Got filtered array ' + JSON.stringify(sub));
            done(new Error('Cannot find expected user "IFS:LAB.FRIB.ASD.CONTROLS"'));
          }
        }
        catch (err) { 
          done(err);
        }
      }
    });
  });

  it("Returns FORG area records", function(done) {
    this.timeout(5000);
    supertest
    .get("/api/v1/swdb/forgAreas")
    .expect(200)
    .end(function(err, res){
      if (err) {
        done(err);
      } else {
        try {
          sub = JSON.parse(res.text).filter((element, idx, array) => {
            return element.uid === "ADB:AREA.FRIB.CTRLITIDF";
          });
          if (sub.length === 1) {
            done();
          }
          else {
            debug('Got filtered array ' + JSON.stringify(sub));
            done(new Error('Cannot find expected user "ADB:AREA.FRIB.CTRLITIDF"'));
          }
        }
        catch (err) { 
          done(err);
        }
      }
    });
  });
  
  it("Has the blank history", async function() {
      let cursor = Be.Db.swDoc.db.collections.history.find();
      let count = await cursor.count();
      debug('Found ' + count + ' items');
      expect(count).to.equal(0);
  });

  it("Returns location header posting new record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
      .send({swName: "Header Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "Development", statusDate: "date 1000"})
    .expect(201)
    .end((err, result) => {
      if (err) done(err);
      else {
        if (result.headers.location.match(/^.*\/api\/v1\/swdb\/[0-9a-fA-F]{24}$/g)) {
          debug('Location: ' + result.headers.location);
          done();
        } else {
          done(new Error("Location header is not set" + JSON.stringify(result.headers.location)));
        }
      }
    });
  });

  it("Has the correct number of history entries", async function () {
    let cursor = Be.Db.swDoc.db.collections.history.find();
    try {
      let count = await cursor.count();
      debug('Found ' + count + ' items');
      expect(count).to.equal(1);
    } catch (err) {
      done(err);
    }
  });

  it("Has the swName history entry", async function () {
    let cursor = Be.Db.swDoc.db.collections.history.find();
    try {
      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        expect(doc.paths[0].name = 'swName');
      }
    } catch (err) {
      done(err);
    }
  });

  it("Has the correct swName history entry", async function () {
    let cursor = Be.Db.swDoc.db.collections.history.find();
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      expect(doc.paths[0].value = 'Header Test Record');
    }
  });


  describe('Check location headers', function() {
    var wrapper = {origId:null};
    before("Get ID record id:Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "Header Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id:Header Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("Header Test Record");
          expect(res.body._id).to.match(/.{24}/);
          expect(res.body.__v).to.match(/\d+/);
          done();
        }
      });
    });
  
    it("Returns the correct location header PUT existing record", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Header owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            let re = new RegExp('^.*/api/v1/swdb/' + wrapper.origId + '$');
            if (result.headers.location.match(re)) {
              debug('Location: ' + result.headers.location);
              done();
            } else {
              done(new Error("Location header is not set" + JSON.stringify(result.headers.location)));
            }
          }
        });
    });

    it("Returns the correct location header PATCH existing record", function (done) {
      supertest
        .patch("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Header owner2" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            let re = new RegExp('^.*/api/v1/swdb/' + wrapper.origId + '$');
            if (result.headers.location.match(re)) {
              debug('Location: ' + result.headers.location);
              done();
            } else {
              done(new Error("Location header is not set" + JSON.stringify(result.headers.location)));
            }
          }
        });
    });
  });

  describe('Check history calls', function () {
    var wrapper = { origId: null };
    before("Before test post and get id", function (done) {
      supertest
        .post("/api/v1/swdb/")
        .send({ swName: "Hist1 Test Record", owner: "Test Owner", engineer: "Test Engineer", previous: "badbeefbadbeefbadbeefbad", levelOfCare: "LOW", status: "Development", statusDate: "0" })
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .expect(201)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.headers.location);
            const urlParts = result.headers.location.split('/');
            wrapper.origId = urlParts[urlParts.length - 1];
            done();
          }
        });
    });
    before("Before modify test record (history2)", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Hist2 owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            done();
          }
        });
    });
    before("Before modify test record (history 3)", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Hist3 owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            done();
          }
        });
    });
    before("Before modify test record (history 4)", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Hist4 owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            done();
          }
        });
    });
    before("Before modify test record (history 5)", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Hist5 owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            done();
          }
        });
    });
    before("Before modify test record (history 6)", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Hist6 owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            done();
          }
        });
    });
    before("Before modify test record (history 7)", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .set("Accept", "application/json")
        .set('Cookie', [Cookies])
        .send({ owner: "Hist7 owner" })
        .expect(200)
        .end((err, result) => {
          if (err) done(err);
          else {
            done();
          }
        });
    });

    it("The API default history entry is correct", function (done) {
      supertest
        .get("/api/v1/swdb/hist/" + wrapper.origId)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            debug("Err history (api test): " + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug("got history (api test): " + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(5);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter(x => x.name === "owner");
            // check that history item has the expected value
            expect(arr[0].value).to.equal("Hist7 owner");
            done();
          }
        });
    });
    it("The API history (limit 1, skip1) entry is correct", function (done) {
      supertest
        .get("/api/v1/swdb/hist/" + wrapper.origId + "?limit=1&skip=1")
        .expect(200)
        .end(function (err, res) {
          if (err) {
            debug("Err history (api test): " + JSON.stringify(err, null, 2));
            done(err);
          } else {
            debug("got history (api test): " + JSON.stringify(res, null, 2));
            let arr = res.body;
            expect(arr.length).to.equal(1);
            arr = res.body[0];
            // Get the newest paths entry entry where name is "owner"
            arr = res.body[0].paths.filter(x => x.name === "owner");
            // check that history item has the expected value
            expect(arr[0].value).to.equal("Hist6 owner");
            done();
          }
        });
    });
  });

  it("Post a new record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
      .send({swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "Development", statusDate: "date 1000"})
    .expect(201)
    .end((end, result) => {
      debug('Location: ' + result.headers.location);
      done();
    });
  });

  it("Errors posting a duplicate new record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000",levelOfCare: "LOW", status: "Development", statusDate: "1/1/1970"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        if ((result.text.match(/^E11000 duplicate key error*/g)) && (result.status === 500)) {
          debug('Got ""E11000 duplicate key error"');
          done();
        } else {
          done(new Error('no error found'));
        }
      }
    });
  });

  it("Post a new record Test Record2", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "Test Record2", owner: "Owner 1002", engineer: "Engineer 1002",levelOfCare: "LOW", status: "Development", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id:Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id:Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("Test Record");
          expect(res.body._id).to.match(/.{24}/);
          expect(res.body.__v).to.match(/\d+/);
          done();
        }
      });
    });
  });

  it("Post a new record Desc Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "Desc Test Record", owner: "Owner 1002", engineer: "Engineer 1002",levelOfCare: "LOW", status: "Development", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for Desc Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: Desc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "Desc Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: Desc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("Desc Test Record");
          expect(res.body._id).to.match(/.{24}/);
          expect(res.body.__v).to.match(/\d+/);
          done();
        }
      });
    });
  });

  it("Post a new record Engineer Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "Engineer Test Record", owner: "Owner 1002", engineer: "Any Engineer",  levelOfCare: "LOW", status: "Development", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for Engineer Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: Engineer Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "Engineer Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: Engineer Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("Engineer Test Record");
          expect(res.body.engineer).to.equal("Any Engineer");
          expect(res.body._id).to.match(/.{24}/);
          expect(res.body.__v).to.match(/\d+/);
          done();
        }
      });
    });
  });

  it("Post a new record versionControlLoc Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "versionControlLoc Test Record", owner: "versioControlLoc Test Owner", engineer: "Test Engineer", versionControlLoc: "http://www.somehost/some-path/some-file", levelOfCare: "LOW", status: "Development", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for versionControlLoc Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: versionControlLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "versionControlLoc Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: versionControlLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("versionControlLoc Test Record");
          expect(res.body.versionControlLoc).to.equal("http://www.somehost/some-path/some-file");
          done();
        }
      });
    });
  });

  it("Post a new record designDescDocLoc Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "designDescDocLoc Test Record", owner: "designDescDocLoc Test Owner", engineer: "Test Engineer", designDescDocLoc: "http://www.somehost/some-path/some-file", levelOfCare: "LOW", status: "Development", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for designDescDocLoc Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: designDescDocLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "designDescDocLoc Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: designDescDocLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("designDescDocLoc Test Record");
          expect(res.body.designDescDocLoc).to.equal("http://www.somehost/some-path/some-file");
          done();
        }
      });
    });
  });

  it("Post a new record descDocLoc Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "descDocLoc Test Record", owner: "descDocLoc Test Owner", engineer: "Test Engineer", descDocLoc: "http://www.somehost/some-path/some-file", levelOfCare: "LOW", status: "Development", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for descDocLoc Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: descDocLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "descDocLoc Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: descDocLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("descDocLoc Test Record");
          expect(res.body.descDocLoc).to.equal("http://www.somehost/some-path/some-file");
          done();
        }
      });
    });
  });

  it("Post a new record recertDate Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "recertDate Test Record", owner: "recertDate Test Owner", engineer: "Test Engineer", recertDate: "April 20, 2016", levelOfCare: "LOW", status: "Development", statusDate: "0"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for recertDate Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: recertDate Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "recertDate Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: recertDate Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("recertDate Test Record");
          expect(res.body.recertDate).to.equal("2016-04-20T07:00:00.000Z");
          done();
        }
      });
    });
  });

  it("Post a new record vvProcLoc Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({
      swName: "vvProcLoc Test Record",
      owner: "vvProcLoc Test Owner",
      engineer: "Test Engineer",
      vvProcLoc: ["http://www.somehost/some-path/some-file", "http://www.somehost/some-path/some-file2"],
      levelOfCare: "LOW",
      status: "Development",
      statusDate: "0"
    })
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for vvProcLoc Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: vvProcLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "vvProcLoc Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: vvProcLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          debug('res: ' + JSON.stringify(res.body));
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("vvProcLoc Test Record");
          expect(JSON.stringify(res.body.vvProcLoc))
            .to.equal('["http://www.somehost/some-path/some-file","http://www.somehost/some-path/some-file2"]');
          done();
        }
      });
    });
  });

  it("Post a new record vvResultsLoc Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({
      swName: "vvResultsLoc Test Record",
      owner: "vvResultsLoc Test Owner",
      engineer: "Test Engineer",
      vvResultsLoc: [ "http://www.somehost/some-path/some-file3", "http://www.somehost/some-path/some-file4" ],
      levelOfCare: "LOW",
      status: "Development",
      statusDate: "0"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      }
      else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for vvResultsLoc Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: vvResultsLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "vvResultsLoc Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: vvResultsLoc Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("vvResultsLoc Test Record");
          expect(JSON.stringify(res.body.vvResultsLoc))
            .to.equal('["http://www.somehost/some-path/some-file3","http://www.somehost/some-path/some-file4"]');
          done();
        }
      });
    });
  });

  it("Post a new record branch Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "branch Test Record", owner: "branch Test Owner", engineer: "Test Engineer", branch: "New branch", levelOfCare: "LOW", status: "Development", statusDate: "0"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for branch Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID record id: branch Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "branch Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: branch Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("branch Test Record");
          expect(res.body.branch).to.equal("New branch");
          done();
        }
      });
    });
  });

  it("Post a new record versionControl Test Record", function(done) {
    supertest
      .post("/api/v1/swdb/")
    .send({swName: "versionControl Test Record", owner: "versionControl Test Owner", engineer: "Test Engineer", versionControl: "Git", levelOfCare: "LOW", status: "Development", statusDate: "0"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for versionControl Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID versionControl id: branch Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "versionControl Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: versionControl Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("versionControl Test Record");
          expect(res.body.versionControl).to.equal("Git");
          done();
        }
      });
    });
  });

  it("Post a new record previous Test Record", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .send({swName: "previous Test Record", owner: "previous Test Owner", engineer: "Test Engineer", previous: "badbeefbadbeefbadbeefbad", levelOfCare: "LOW", status: "Development", statusDate: "0"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end((err, result) => {
      if (err) {
        done(err);
      } else {
        debug('Location: ' + result.headers.location);
        done();
      }
    });
  });

  describe('get id for previous Test Record', function() {
    var wrapper = {origId:null};
    before("Get ID previous id: branch Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "previous Test Record") wrapper.origId = res[i]._id;
          }
          done();
        }
      });
    });

    it("Returns test record id: previous Test Record", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("previous Test Record");
          expect(res.body.previous).to.equal("badbeefbadbeefbadbeefbad");
          done();
        }
      });
    });
  });


  describe('get id for Test Record2', function() {
    var wrapper = {origId:null};
    before("Get ID record id:Test Record2", function(done) {
      supertest
      .get("/api/v1/swdb/")
      .expect(200)
      .end(function(err,res){
        if (err) {
          done(err);
        } else {
          res = JSON.parse(res.text);
          for (var i = 0, iLen = res.length; i < iLen; i++) {
            if (res[i].swName == "Test Record2") {
              wrapper.origId = res[i]._id;
            }
          }
          done();
        }
      });
    });

    it("Can update a record via PUT swName id:Test Record3", function (done) {
      supertest
        .put("/api/v1/swdb/" + wrapper.origId)
        .send({ swName: "Test Record3" })
        .set('Cookie', [Cookies])
        .expect(200)
        .end((err, result) => {
          if (err) {
            done(err);
          } else {
            debug('Location: ' + result.headers.location);
            done();
          }
        });
    });

    it("Returns test record 1d:Test Record3", function(done) {
      supertest
      .get("/api/v1/swdb/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        if (err) {
          done(err);
        } else {
          expect(res.body).to.have.property("_id");
          expect(res.body.swName).to.equal("Test Record3");
          done();
        }
      });
    });

    // This table lists test requests to make and the expected
    // responses.
    // {req:{msg:,url:,type:,err{status:}}
    //  res:{msg:,url:,type:,err{status:}}
    //  }
    var testUpdateParams = [
      {"type": "PUT", "req": {"msg": {"swName": "Test Record4"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET", "res": {"msg": {"swName": "Test Record4"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"owner": "New test owner 1002"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"owner": "New test owner 1002"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"engineer": "New Engineer"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"engineer": "New Engineer"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"levelOfCare": "MEDIUM"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"levelOfCare": "MEDIUM"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"levelOfCare": "ERRONEOUS_VALUE"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "GET","res": {"msg": {"levelOfCare": "MEDIUM"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"levelOfCare": "SAFETY"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"levelOfCare": "SAFETY"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"status": "Ready for install"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"status": "Ready for install"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"status": "ERRONEOUS_VALUE"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "GET","res": {"msg": {"status": "Ready for install"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"statusDate": "7/7/1977"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"statusDate": "1977-07-07"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"version": "NEW test version"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"version": "NEW test version"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"branch": "NEW Branch"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"branch": "NEW Branch"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"branch": "NEW Branch name that is much too long"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"platforms": "NEW test platform"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"platforms": "NEW test platform"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"designDescDocLoc": "http://www.somehost/some-path/some-file"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"designDescDocLoc": "http://www.somehost/some-path/some-file"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"designDescDocLoc": "badhostname/some_path/some-file"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"descDocLoc": "http://www.somehost/some-path/some-file"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"descDocLoc": "http://www.somehost/some-path/some-file"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"descDocLoc": "badurl"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"vvProcLoc": ["http://www.somehost/some-path/some-file"]},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"vvProcLoc": ["http://www.somehost/some-path/some-file"]},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"vvProcLoc": "http:some-malformed-url"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"vvResultsLoc": ["http://www.somehost/some-path/some-file3"]},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"vvResultsLoc": ["http://www.somehost/some-path/some-file3"]},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"vvResultsLoc": "http:some-malformed-url"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"versionControl": "Git"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"versionControl": "Git"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"versionControl": "Erroneous RCS"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"versionControlLoc": "http://www.somehost/some-path/some-file"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"versionControlLoc": "http://www.somehost/some-path/some-file"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"recertFreq": "NEW test recert frequency"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"recertFreq": "NEW test recert frequency"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"recertStatus": "NEW test recert status"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"recertStatus": "NEW test recert status"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"recertDate": "April 21, 2017"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"recertDate": "2017-04-21T07:00:00.000Z"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"recertDate": "Not a date"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"previous": "badbeefbadbeefbadbeefbad"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"previous": "badbeefbadbeefbadbeefbad"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"previous": "bad reference is way to long for this"},"url": "/api/v1/swdb/", "err": {"status": 400}}},
      {"type": "PUT","req": {"msg": {"comment": "NEW test comment"},"url": "/api/v1/swdb/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"comment": "NEW test comment"},"url": "/api/v1/swdb/",  "err": {"status": 200}}},
      // test new record basic only required items
      {"type":"POST", "req": {"msg": {"swName": "NEW-test-name-1", "status": "Ready for test", "statusDate": "1/1/1997", "owner": "test owner", "levelOfCare": "MEDIUM"}, "url": "/api/v1/swdb/",
      "err": {"status": 201, "msgHas": ''}}},
      // test new swName is required, min, max
      {"type":"POST", "req": {"msg": {"owner": "test owner"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"swName","msg":"Software name is required."}'}}},
      // test nwe owner required, min, max
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"owner","msg":"Owner is required."}'}}},
      // test levelOfCare required, enumerated
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner":"NEW OWNER"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"levelOfCare","msg":"Level of care is required."}'}}},
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner":"NEW OWNER", "levelOfCare": "LOW"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status is required."}'}}},
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner":"NEW OWNER", "levelOfCare": "LOW","status":"Development"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"statusDate","msg":"Status date is required."}'}}},
      // test new status enumerated
      {"type":"POST", "req": {"msg": {"status": "not-enumerated"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status must be one of Development,Ready for test,Ready for install,Retired","value":"not-enumerated"}'}}},
      // "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status must be one of DEVEL,RDY_INSTALL,RDY_INT_TEST,RDY_BEAM,RETIRED","value":"not-enumerated"}'}}},
      // test new statusDate with non-date
      {"type":"POST", "req": {"msg": {"swName":"testing","owner":"test owner","levelOfCare":"LOW","status":"Development","statusDate": "non-date"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"statusDate","msg":"Status date must be a date.","value":"non-date"}'}}},
      // test new version min, max
      {"type":"POST", "req": {"msg": {"version": ""}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"version","msg":"Version must be 1-30 characters."'}}},
      {"type":"POST", "req": {"msg": {"version": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"version","msg":"Version must be 1-30 characters."'}}},
      // test new platforms min, max
      {"type":"POST", "req": {"msg": {"platforms": "NEW"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"Platforms must be 4-30 characters."'}}},
      {"type":"POST", "req": {"msg": {"platforms": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"Platforms must be 4-30 characters."'}}},
      // test new versionControl min, max
      {"type":"POST", "req": {"msg": {"versionControl": "Erroneous RCS"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"versionControl","msg":"Revision control must be one of Git,AssetCentre,Filesystem,Debian,Other"'}}},
      // test new recertFreq min, max
      {"type":"POST", "req": {"msg": {"recertFreq": "N"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recertification frequency must be 4-30 characters."'}}},
      {"type":"POST", "req": {"msg": {"recertFreq": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recertification frequency must be 4-30 characters."'}}},
      // test new recertStatus min, max
      // {"type":"POST", "req": {"msg": {"recertStatus": "N"}, "url": "/api/v1/swdb/",
      // "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 4-30 characters."'}}},
      {"type":"POST", "req": {"msg": {"recertStatus": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 0-30 characters."'}}},

      // test update owner min, max
      {"type":"PUT", "req": {"msg": {"swName": "NEW Test name", "owner": "N"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"owner","msg":"Owner must be 2-80 characters."'}}},
      {"type":"PUT", "req": {"msg": {"swName": "NEW Test name","owner": "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"owner","msg":"Owner must be 2-80 characters."'}}},
      // test update levelOfCare enumerated
      {"type":"PUT", "req": {"msg": {"levelOfCare": "not-enumerated"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"levelOfCare","msg":"Level of care must be one of NONE,LOW,MEDIUM,HIGH,SAFETY","value":"not-enumerated"}'}}},
      // test update status enumerated
      {"type":"PUT", "req": {"msg": {"status": "not-enumerated"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status must be one of Development,Ready for test,Ready for install,Retired","value":"not-enumerated"}'}}},
      // "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status must be one of DEVEL,RDY_INSTALL,RDY_INT_TEST,RDY_BEAM,RETIRED","value":"not-enumerated"}'}}},
      // test update statusDate with non-date
      {"type":"PUT", "req": {"msg": {"statusDate": "non-date"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '{"param":"statusDate","msg":"Status date must be a date.","value":"non-date"}'}}},
      // test update version min, max
      {"type":"PUT", "req": {"msg": {"version": ""}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"version","msg":"Version must be 1-30 characters."'}}},
      {"type":"PUT", "req": {"msg": {"version": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"version","msg":"Version must be 1-30 characters."'}}},
      // test update platforms min, max
      {"type":"PUT", "req": {"msg": {"platforms": "NEW"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"Platforms must be 4-30 characters."'}}},
      {"type":"PUT", "req": {"msg": {"platforms": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"Platforms must be 4-30 characters."'}}},
      // test update versionControl min, max
      {"type":"PUT", "req": {"msg": {"versionControl": "Erroneous RCS"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"versionControl","msg":"Revision control must be one of Git,AssetCentre,Filesystem,Debian,Other"'}}},
      // test update recertFreq min, max
      {"type":"PUT", "req": {"msg": {"recertFreq": "N"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recertification frequency must be 4-30 characters."'}}},
      {"type":"PUT", "req": {"msg": {"recertFreq": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recertification frequency must be 4-30 characters."'}}},
      // test update recertStatus min, max
      // {"type":"PUT", "req": {"msg": {"recertStatus": "N"}, "url": "/api/v1/swdb/",
      // "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 4-30 characters."'}}},
      {"type":"PUT", "req": {"msg": {"recertStatus": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 0-30 characters."'}}},
      // test update comment
      {"type":"PUT", "req": {"msg": {"comment": ["NE"]}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"comment","msg":"Comment must be a string"'}}},
      {"type":"PUT", "req": {"msg": {"comment": "NE"}, "url": "/api/v1/swdb/",
      "err": {"status": 200}}},
      {"type":"PUT", "req": {"msg": {"comment": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 200}}},

      // test update desc
      {"type":"PUT", "req": {"msg": {"desc": ["NE"]}, "url": "/api/v1/swdb/",
      "err": {"status": 400, "msgHas": '"param":"desc","msg":"Description must be a string"'}}},
      {"type":"PUT", "req": {"msg": {"desc": "NE"}, "url": "/api/v1/swdb/",
      "err": {"status": 200}}},
      {"type":"PUT", "req": {"msg": {"desc": "0123456789012345678901234567890"}, "url": "/api/v1/swdb/",
      "err": {"status": 200}}},
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
            if (err) {
              done(err);
            } else {
              if (value.req.err.status) {
                expect(res.status).to.equal(value.req.err.status);
              }
              if (value.req.err.msgHas) {
                expect2(res.text).toMatch(value.req.err.msgHas);
              }

              debug('Location: ' + res.headers.location);
              done();
            }
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
            if (err) {
              done(err);
            } else {
              if (value.req.err.status) {
                expect(res.status).to.equal(value.req.err.status);
              }
              if (value.req.err.msgHas) {
                expect2(res.text).toMatch(value.req.err.msgHas);
              }
              debug('Location: ' + res.headers.location);
              done();
            }
          });
        });
      }

      // handle GET
      if (value.type === "GET") {
        it(value.res.err.status+" "+JSON.stringify(value.res.msg), function(done) {
          supertest
          .get(value.res.url+wrapper.origId)
          .end(function(err, res) {
            if (err) {
              done(err);
            } else {
              if (value.res.err.status) {
                expect(res.status).to.equal(value.res.err.status);
              }
              for (var prop in value.res.msg) {
                expect(res.body).to.have.property(prop);
                // This is to allow sloppy matching on whole objects.
                // See the npm "expect" module for more
                expect2(res.body[prop]).toMatch(value.res.msg[prop]);
              }
              done();
            }
          });
        });
      }
    });
    it("Errors on update a nonexistent record via POST swName id:badbeef", function(done) {
      supertest
      .post("/api/v1/swdb/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test Record4"})
      .expect(404)
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.text).to.match(/Cannot POST \/api\/v1\/swdb\/badbeef/);
          debug('Location: ' + res.headers.location);
          done();
        }
      });
    });
    it("Errors on update a nonexistent record via PUT swName id:badbeef", function(done) {
      supertest
      .put("/api/v1/swdb/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test Record4"})
      .expect(500)
      .expect('Record not found')
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + res.headers.location);
          done();
        }
      });
    });
    it("Errors on update a nonexistent record via PATCH swName id:badbeef", function(done) {
      supertest
      .patch("/api/v1/swdb/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test Record4"})
      .expect(500)
      .expect('Record not found')
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          debug('Location: ' + res.headers.location);
          done();
        }
      });
    });
  });
});
