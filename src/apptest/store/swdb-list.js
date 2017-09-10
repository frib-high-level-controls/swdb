var app = require("../../app/server");
var chai = require("chai");
var expect = require("chai").expect;
chai.use(require("../../../node_modules/chai-as-promised"));
var Be = require('../../app/lib/Db');
let be = new Be.Db();
var instBe = require("../../app/lib/instDb.js");
var ObjectId = require('../../../node_modules/mongodb').ObjectID;

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

var webdriver = require("../../../node_modules/selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("../../../node_modules/selenium-webdriver/testing");
var fs = require('fs');
var path = require('path');
const circJSON = require('../../../node_modules/circular-json');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();

test.describe("Installations record tests", function() {
  var chromeDriver;

  test.before(function(done) {
    console.log("Starting swdb-list");
    this.timeout(5000);
    testTools.loadTestCollectionsStandard(done, props.test.swTestDataFile, props.test.instTestDataFile);
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

    chromeDriver.get(props.webUrl+"#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "Log in"),5000);
  });

  test.it("should login", function() {
    // get test authentication
    chromeDriver.get(props.webUrl+"testlogin?username=testuser&password=testuserpasswd");
    chromeDriver.wait(until.elementLocated(By.id("Test auth success")),5000);
  });

  test.it("should show search page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "testuser"),5000);
  });

  test.it("should show title", function() {
    chromeDriver.wait(until.titleIs("SWDB - List"), 5000);
  });

  test.it("should show 'Add software' button", function() {
    chromeDriver.wait(until.elementLocated(By.id("addBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("addBtn")),
      "Add software"),5000);
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

  test.it("should show a known record", function() {
    this.timeout(8000);
    //chromeDriver.wait(until.elementLocated(By.linkText("BEAST")), 8000);
    //
    ////*[@id="swdbList"]/tbody/tr[4]/td[1]/a
    //
    chromeDriver.wait(until.elementLocated(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]')), 8000);
    var link = chromeDriver.findElement(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]'));
    expect(Promise.resolve(link.getText())).to.eventually.equal("BEAST");
  });

  // find a software record
  test.it("should find a sw record", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/list");
    chromeDriver.wait(until.elementLocated(By.id("swNameSrch")), 8000)
      .sendKeys("beast");
    chromeDriver.wait(until.elementLocated(By.id("versionSrch")), 8000)
      .sendKeys("0.2");
    chromeDriver.wait(until.elementLocated(By.id("branchSrch")), 8000)
      .sendKeys("b4");
    chromeDriver.wait(until.elementLocated(By.linkText("BEAST")),
      8000);
    var link = chromeDriver.findElement(By.linkText("BEAST"));
    link.getAttribute("href").then(function(result){
      expect(result).to.equal(props.webUrl+"#/details/5947589458a6aa0face9a554");
    });
  });
});
