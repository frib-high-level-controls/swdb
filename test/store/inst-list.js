var app = require("../../server");
var chai = require("chai");
var expect = require("chai").expect;
chai.use(require("chai-as-promised"));
var Be = require('../../lib/Db');
let be = new Be.Db();
var instBe = require("../../lib/instDb.js");
var ObjectId = require('mongodb').ObjectID;

var webdriver = require("../../node_modules/selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("../../node_modules/selenium-webdriver/testing");

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

var fs = require('fs');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));


test.describe("Installations record tests", function() {
  var chromeDriver;

  test.before(function(done) {
    console.log("Starting inst-list");
    this.timeout(5000);
    testTools.loadTestCollectionsStandard(done);
  });

  test.after(function(done) {
    // clear the test collection
    chromeDriver.quit();
    testTools.clearTestCollections(done);
  });

  var allCookies = null;

  test.it("should show search page with login button", function() {
    this.timeout(8000);

    chromeDriver = new webdriver.Builder()
      .forBrowser("chrome")
      .build();
    chromeDriver.manage().window().setPosition(200,0);

    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "(click to login)"),5000);
  });

  test.it("should login", function() {
    // get test authentication
    chromeDriver.get(props.webUrl+"testlogin?username=testuser&password=testuserpasswd");
    chromeDriver.wait(until.elementLocated(By.id("Test auth success")),5000);
  });

  test.it("should show search page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "testuser (click to logout)"),5000);
  });

  // find an installation record
  test.it("should find a record", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("swdbList_filter")), 8000)
      .findElement(By.tagName("Input"))
      .sendKeys("host2");
    chromeDriver.wait(until.elementLocated(By.linkText("host2")),
      8000);

  });
});
