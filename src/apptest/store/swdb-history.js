var server = require("../../app/server");
let app;
const ObjectId = require('mongodb').ObjectID;
var expect = require("chai").expect;
var Supertest = require("supertest");
let supertest;
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

var Cookies;
//
describe("History tests suite", function () {
  before("Prep DB", async function () {
    app = await server.start();
    supertest = Supertest(app);
    debug("Prep DB");
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after("clear db", async function () {
    debug("Clear DB");
    // clear the test collection
    await testTools.clearTestCollections(debug);
    await server.stop();
  });

  // describe("Login and perform history tests", function () {
  var wrapper = { origId: null };

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
      .post("/api/v1/swdb")
      .set("Accept", "application/json")
      .set('Cookie', [Cookies])
      .send({ swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: "date 1000" })
      .end(async (err, result) => {
        // get record id from the returned location and find records that match
        let id = result.headers.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        let canonObj =
          { swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: new Date("date 1000") };
        let response = null;
        try {
          expect(await testTools.checkHistory(debug, canonObj, id)).to.equal("History record matches");
          done();
        } catch (err) {
          done(err);
        }
      });
  });

  it("Update a software record with correct history", function (done) {
    supertest
      .put("/api/v1/swdb/" + wrapper.origId)
      .set("Accept", "application/json")
      .set('Cookie', [Cookies])
      .send( { owner: "New test owner" } )
      .end(async (err, result) => {
        // get record id from the returned location and find records that match
        let id = result.headers.location.split(/\//).pop();
        wrapper.origId = id;
        debug('Got id ' + id);
        let canonObj =
          { owner: "New test owner" };
        let response = null;
        try {
          expect(await testTools.checkHistory(debug, canonObj, id)).to.equal("History record matches");
          done();
        } catch (err) {
          done(err);
        }
      });
  });
});