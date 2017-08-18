var app = require("../../app/server");
var chai = require("../../../node_modules/chai");
var expect = require("../../../node_modules/chai").expect;
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

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();

test.describe("Preload db record tests", function() {
  var chromeDriver;

  test.before(function(done) {
    console.log("Starting swdb-details");
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

  test.it("should show 'About' button", function() {
    chromeDriver.wait(until.elementLocated(By.id("abtBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("abtBtn")),
      "About"),5000);
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

  //// find an software record
  //test.it("should find a sw record", function() {
    //this.timeout(8000);
    //chromeDriver.get(props.webUrl+"#/list");
    //chromeDriver.wait(until.elementLocated(By.id("swdbList_filter")), 8000)
      //.findElement(By.tagName("Input"))
      //.sendKeys("beast 0.2 b4");
    //chromeDriver.wait(until.elementLocated(By.linkText("BEAST")),
      //8000);
    //var link = chromeDriver.findElement(By.linkText("BEAST"));
    //expect(Promise.resolve(link.getAttribute("href"))).to.eventually.equal("http://swdb-dev:4005/#/details/5947589458a6aa0face9a554");
  //});
});
