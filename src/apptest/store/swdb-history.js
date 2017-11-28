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

// clear the test collection before and after tests suite
before(function (done) {
  console.log("Starting swdb-history");
  this.timeout(5000);
  testTools.testCollectionsStatus(debug);
  testTools.loadTestCollectionsStandard(done, props.test.swTestDataFile, props.test.instTestDataFile);
});

after(function (done) {
  // clear the test collection
  testTools.clearTestCollections(done);
});

var Cookies;
//
describe("app", function () {
  before("login as test user", function (done) {
    supertest
      .get("/testlogin?username=testuser&password=testuserpasswd")
      .expect(200)
      .end(function (err, res) {
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
        done();
      });
  });

  it("Has the blank history", async function (done) {
    let cursor = Be.Db.swDoc.db.collections.history.find();
    if (cursor) {
      try {
        let count = await cursor.count();
        debug('Found ' + count + ' items');
        expect(count).to.equal(0);
        done()
      } catch (err) {
        done(err);
      }
    } else {
      debug('Installation collection is empty');
      done()
    }
  });

  it("Post a new record with correct history", function(done) {
    supertest
    .post("/api/v1/swdb/")
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
      .send({swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: "date 1000"})
    .expect(201)
    .end(async (err, result) => {
      /**
      * Get the resulting header location field and parse out the id. Then search the 
      * history for that as an rid field. Sort that list by date and take the latest. 
      * Take the original object data as canonical, compare each field to the history,
      * removing each found field from canonCheckList. If empty when done, all is well.
      *
      * @params err Description Error object.
      * @params result Desription The express result.
      */

      debug('Location: ' + result.headers.location);
      // get record id from the returned location and find records that match
      let id = result.headers.location.split(/\//).pop();
      debug('Got id ' + id);
      // testTools.dumpCollection(debug, Be.Db.swDoc.db.collections.history);
      let canonObj =
        {swName: "Test Record", owner: "Owner 1000", engineer: "Engineer 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: new Date("date 1000").toDateString};
      let canonCheckList = canonObj;
      let cursor = Be.Db.swDoc.db.collections.history.find({rid: ObjectId(id)});
      try {
        let count = await cursor.count();
        // debug('Count is ' + count);
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
          debug('Got history ' + doc._id + ' with  rid ' + id + JSON.stringify(doc));
          // debug('Found record ' + JSON.stringify(doc));
          for (let canonKey in canonObj) {
            // we should find an paths array object where name: "swName" and value: value
            for (let item of doc.paths) {
              // debug('searching element ' + JSON.stringify(item) + " for " + canonKey);
              if (item["name"] === canonKey){
                // debug('Found name = ' + canonKey);
                if (item["value"] === canonObj[canonKey]) {
                  debug('Found name = ' + canonKey + " AND value = " + canonObj[canonKey]);
                  delete canonCheckList[canonKey];
                }
              }
            }
          }
          if (Object.keys(canonCheckList).length === 0 && canonCheckList.constructor === Object) {
            debug('Cannot find ' + JSON.stringify(canonCheckList) + ' in history');
          } else {
            debug('history entry is good');
            done();
          }
        }
      } catch (err) {
        debug(err);
      }

    });
    testTools.testCollectionsStatus(debug);
  });


});