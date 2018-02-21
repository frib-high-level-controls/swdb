var app = require("../../app/server");
var chai = require("chai");
var expect = require("chai").expect;
var supertest = require("supertest")(app);
chai.use(require("chai-as-promised"));
var Be = require('../../app/lib/Db');
let be = new Be.Db();
var instBe = require("../../app/lib/instDb.js");
var ObjectId = require('mongodb').ObjectID;

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

var webdriver = require("selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("selenium-webdriver/testing");
var fs = require('fs');
var path = require('path');
let dbg = require('debug');
const debug = dbg('swdb:swdb-details-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();

test.describe("Preload db record tests", function() {
  var chromeDriver;

  before("Prep DB", async function () {
    debug("Prep DB");
    await testTools.clearTestCollections(debug);
    // testTools.testCollectionsStatus(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
    // done();
  });

  after("clear db", async function () {
    debug("Clear DB");
    // clear the test collection.
    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
    // done();
  });

  var allCookies = null;

  test.it("should show search page with login button", function() {
    this.timeout(8000);

    chromeDriver = new webdriver.Builder()
      .forBrowser("chrome")
      .build();
    chromeDriver.manage().window().setPosition(200,0);

    chromeDriver.get(props.webUrl+"#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "Log in"),5000);
  });

  test.it("login as test user", function(done){
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
        debug('test login cookies: ' + Cookies);
        let parts = Cookies.split('=');
        debug('setting driver cookie ' + parts[0] + ' ' + parts[1]);
        chromeDriver.manage().addCookie({name:parts[0], value:parts[1]});
        done();
      }
    });
  });

  test.it("should show search page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()),5000);
  });

  test.it("should show 'Add software' button", function() {
    chromeDriver.wait(until.elementLocated(By.id("addBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("addBtn")),
      "Add software"),5000);
  });

  test.it("should show a known record", function() {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]')), 8000);
    var link = chromeDriver.findElement(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]'));
    expect(Promise.resolve(link.getText())).to.eventually.equal("BEAST");
    link.click();
  });

  test.it("should show details record title", function() {
    chromeDriver.wait(until.titleIs("SWDB - Details"), 5000);
  });

  test.it("should show 'Back' button", function() {
    chromeDriver.wait(until.elementLocated(By.id("cancelBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("cancelBtn")),
      "Back to search"),5000);
  });

  test.it("should show 'Update' button", function() {
    chromeDriver.wait(until.elementLocated(By.id("updateBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("updateBtn")),
      "Update this document"),5000);
  });

  test.it("should show 'Software' tab", function() {
    chromeDriver.wait(until.elementLocated(By.id("swTab")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("swTab")),
      "Software"),5000);
  });

  test.it("should show 'Installations' tab", function() {
    chromeDriver.wait(until.elementLocated(By.id("instTab")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("instTab")),
      "Installations"),5000);
  });

  test.it("should show the correct software name in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("swName")), 3000);
    chromeDriver.findElement(By.id("swName")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("BEAST");
      });
  });

  test.it("should show the correct software branch in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    chromeDriver.findElement(By.id("branch")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("b4");
      });
  });

  test.it("should show the correct software version in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    chromeDriver.findElement(By.id("version")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("0.2");
      });
  });

  test.it("should show the correct description in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("desc")), 3000);
    chromeDriver.findElement(By.id("desc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct description doc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("descDocLoc")), 3000);
    chromeDriver.findElement(By.id("descDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct design description doc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("designDescDocLoc")), 3000);
    chromeDriver.findElement(By.id("designDescDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct owner in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("owner")), 3000);
    chromeDriver.findElement(By.id("owner")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Berryman");
      });
  });

  test.it("should show the correct engineer in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    chromeDriver.findElement(By.id("engineer")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct levelOfCare in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("levelOfCare")), 3000);
    chromeDriver.findElement(By.id("levelOfCare")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("MEDIUM");
      });
  });

  test.it("should show the correct status in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    chromeDriver.findElement(By.id("status")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("DEVEL");
      });
  });

  test.it("should show the correct statusDate in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
    chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("1970-07-07T07:00:00.000Z");
      });
  });

  test.it("should show the correct platforms in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("platforms")), 3000);
    chromeDriver.findElement(By.id("platforms")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct vvProcLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("vvProcLoc")), 3000);
    chromeDriver.findElement(By.id("vvProcLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct vvResultsLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")), 3000);
    chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct versionControl in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControl")), 3000);
    chromeDriver.findElement(By.id("versionControl")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct versionControlLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControlLoc")), 3000);
    chromeDriver.findElement(By.id("versionControlLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct recertFreq in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("recertFreq")), 3000);
    chromeDriver.findElement(By.id("recertFreq")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct recertDate in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("recertDate")), 3000);
    chromeDriver.findElement(By.id("recertDate")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });
});
