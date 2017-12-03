var app = require("../../app/server");
const ObjectId = require('mongodb').ObjectID;
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
// const circJSON = require('circular-json');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();
let dbg = require('debug');
const debug = dbg('swdb:swdb-history-tests');

var testLogin = function (request, done) {
  //console.log('Login start');
  supertest
    .get("/login?username=testuser&password=testuserpasswd")
    .send(testAcct)
    .expect(200)
    .end(function (err, res) {
      //console.log('Login complete');
      agent.saveCookies(res);
      done();
    });
};

// // clear the test collection before and after tests suite
// before(function (done) {
//   console.log("Starting swdb-history");
//   this.timeout(5000);
//   testTools.clearTestCollections();
//   testTools.testCollectionsStatus(debug);
//   testTools.loadTestCollectionsStandard(done, props.test.swTestDataFile, props.test.instTestDataFile);
// });

// after(function (done) {
//   // clear the test collection
//   testTools.clearTestCollections(done);
// });

var Cookies;
//
describe("History tests suite", function () {
  before("Prep DB", async function () {
    debug("Prep DB");
    await testTools.clearTestCollections(debug);
    // testTools.testCollectionsStatus(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
    // done();
  });

  after("clear db", async function () {
    debug("Clear DB");
    // clear the test collection
    await testTools.clearTestCollections(debug);
    // done();
  });

  // describe("Login and perform history tests", function () {
  var wrapper = { origId: null };

  before("login as test user", function (done) {
    debug("Logging in as test user");
    this.timeout(5000);
    // var wrapper = { origId: null };
    supertest
      .get("/testlogin?username=testuser&password=testuserpasswd")
      .expect(200)
      .end(function (err, res) {
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
        done();
      });
  });

  it("Has the blank history", async function () {
    let cursor = Be.Db.swDoc.db.collections.history.find();
    if (cursor) {
      let count = await cursor.count();
      debug('Found ' + count + ' items');
      expect(count).to.equal(0);
    } else {
      debug('Installation history collection is empty');
      expect(count = 0).to.equal(0);
    }
  });

  it("Post a new record with correct history", function (done) {
    supertest
      .post("/api/v1/swdb/")
      .set("Accept", "application/json")
      .set('Cookie', [Cookies])
      .send({ swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: "date 1000" })
      // .expect(201)
      .end(async (err, result) => {
        // debug('Location: ' + result.headers.location);
        // get record id from the returned location and find records that match
        let id = result.headers.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        // testTools.dumpCollection(debug, Be.Db.swDoc.db.collections.history);
        let canonObj =
          { swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: new Date("date 1000").toString() };
        let response = null;
        try {
          expect(await testTools.checkHistory(debug, canonObj, id)).to.equal("History record matches");
          done();
        } catch (err) {
          done(err);
        }
      });
    // testTools.testCollectionsStatus(debug);
  });

});