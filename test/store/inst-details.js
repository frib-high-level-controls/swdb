var app = require("../../server");
var chai = require("chai");
var expect = require("chai").expect;
chai.use(require("chai-as-promised"));
var be = require("../../lib/db");
var instBe = require("../../lib/instDb.js");
var ObjectId = require('mongodb').ObjectID;

var webdriver = require("../../node_modules/selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("../../node_modules/selenium-webdriver/testing");
var fs = require('fs');
var path = require('path');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
const testInstData = JSON.parse(fs.readFileSync('./test/misc/datafiles/instTestDataCombined.json', 'utf8'));
const testSwData = JSON.parse(fs.readFileSync('./test/misc/datafiles/swTestDataCombined.json', 'utf8'));
const testSwNames = JSON.parse(fs.readFileSync('./test/misc/datafiles/swTestNames.json', 'utf8'));



test.describe("Installations detail screen tests", function() {
  var chromeDriver = new webdriver.Builder()
    .forBrowser("chrome")
    .build();
  chromeDriver.manage().window().setPosition(200,0);

  test.before(function(done) {
    console.log("Starting inst-details");
    this.timeout(5000);
    console.log("Converting ObjectIds...");
    // before we start loading data, convert _ids to ObjectIDs
    for (var i in testSwNames){
      if ("_id" in testSwNames[i]) {
        testSwNames[i]._id = ObjectId(testSwNames[i]._id);
      }
    }
    for (i in testSwData){
      if ("_id" in testSwData[i]) {
        testSwData[i]._id = ObjectId(testSwData[i]._id);
      }
    }
    for (i in testInstData){
      if ("_id" in testInstData[i]) {
        testInstData[i]._id = ObjectId(testInstData[i]._id);
      }
    }
    console.log("Inserting test data...");
    console.log("Dropping installation collections...");
    instBe.instDoc.db.collections.instCollection.drop(
      function(err){
        console.log("Dropping sw collections...");
        be.swDoc.db.collections.swdbCollection.drop(
          function(err){
            console.log("Dropping swNames collections...");
            be.swDoc.db.collections.swNamesProp.drop(
              function(err){
                console.log("inserting testSwNames in sw collection");
                be.swNamesDoc.db.collections.swNamesProp.insert(testSwNames,
                  function(err, records){
                    console.log("inserting testSwData in installations collection");
                    be.swDoc.db.collections.swdbCollection.insert(testSwData,
                      function(err, records){
                        console.log("inserting testInstData in installations collection");
                        instBe.instDoc.db.collections.instCollection.insert(testInstData,
                          function(err, records){
                            done();
                          });
                      });
                  });
              });
          });
      });
  });

  test.after(function(done) {
    // clear the test collection
    console.log("Cleaning up (inst-list)...");
    console.log("Dropping installation collections...");
    instBe.instDoc.db.collections.instCollection.drop(function(err){
      console.log("Dropping swdb collections...");
      be.swDoc.db.collections.swdbCollection.drop(function(err){
      console.log("Dropping swdbNames collections...");
        be.swDoc.db.collections.swNamesProp.drop(function(err){
          chromeDriver.quit();
          done();
        });
      });
    });
  });

  var allCookies = null;

  test.it("should show search page with login button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "(click to login)"),5000);
  });

  test.it("should login", function() {
    // get test authentication
    chromeDriver.get(props.webUrl+"testlogin?username=testuser&password=testuserpasswd");
    chromeDriver.wait(until.elementLocated(By.id("Test auth success")),3000);
  });

  test.it("should show search page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "testuser (click to logout)"),5000);
  });

  test.it("should find a record", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("swdbList_filter")), 8000)
      .findElement(By.tagName("Input"))
      .sendKeys("host2");
    chromeDriver.wait(until.elementLocated(By.linkText("host2")),
      8000);
  });

  test.it("should show the requested installation record title", function() {
    chromeDriver.findElement(By.linkText("host2")).click();
    chromeDriver.wait(until.titleIs("SWDB - Installation Details"), 5000);
  });

  test.it("should show the requested installation record user button", function() {
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "(click to logout)"),5000);
  });

  test.it("should show the requested installation record vvResults field", function() {
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")),5000);
    chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(function(result) {
      expect(result).to.match(/vvResultsLoc2/);
    });

  });
});
