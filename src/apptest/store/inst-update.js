var app = require("../../app/server");
var chai = require("../../../node_modules/chai");
var expect = require("../../../node_modules/chai").expect;
chai.use(require("../../../node_modules/chai-as-promised"));
var Be = require('../../app/lib/Db');
let be = new Be.Db();
var instBe = require("../../app/lib/instDb.js");

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



test.describe("Installations update screen tests", function() {
  var chromeDriver;

  test.before(function(done) {
    console.log("Starting inst-update");
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
    chromeDriver.wait(until.elementLocated(By.id("Test auth success")),3000);
  });

  test.it("should show search page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/new");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "testuser (click to logout)"),5000);
  });


  test.it("should show the requested installation record title", function() {
    chromeDriver.wait(until.titleIs("SWDB - New Installation"), 5000);
  });

  test.it("Add new record", function() {
    this.timeout(10000);
    chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
    var input = chromeDriver.findElement(By.id("host"));
    input.sendKeys("testHost1");

    // set area
    chromeDriver.wait(until.elementLocated(By.id("area")), 3000);
    input = chromeDriver.findElement(By.id("area"));
    input.click();
    input.sendKeys("Global");

    // set slots
    chromeDriver.wait(until.elementLocated(By.id("slots")), 3000);
    searchInput = chromeDriver.findElement(By.id("slots"));
    searchInput.sendKeys("FE_LEBT");
    // find the second item in that list and add it to the selected list
    chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-")]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-1"=substring(@id, string-length(@id)-string-length("option-1")+1)]/a'));
    input.click();

    //chromeDriver.wait(until.elementLocated(By.id("add.area")), 3000);
    //input = chromeDriver.findElement(By.id("add.area"));
    //input.click();
    //chromeDriver.wait(until.elementLocated(By.id("area.0")), 3000);
    //input = chromeDriver.findElement(By.id("area.0"));
    //input.sendKeys("testArea1");

    //chromeDriver.wait(until.elementLocated(By.id("add.slots")), 3000);
    //input = chromeDriver.findElement(By.id("add.slots"));
    //input.click();
    //chromeDriver.wait(until.elementLocated(By.id("slots.0")), 3000);
    //input = chromeDriver.findElement(By.id("slots.0"));
    //input.sendKeys("testSlot1");

    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    input = chromeDriver.findElement(By.id("status"));
    input.click();
    input.sendKeys("RDY_BEAM");

    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
  });

  //test.it("Host required", function() {
  //this.timeout(8000);
  //chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
  //var input = chromeDriver.findElement(By.id("host"));
  //input.sendKeys("1");
  //input.clear();
  //var inputSts = chromeDriver.findElement(By.id("hostInputSts"));
  //chromeDriver.wait(until.elementTextIs(inputSts, "Host is required"),5000);
  //input.clear();
  //});
  //test.it("Host min for field ", function() {
  //this.timeout(8000);
  //chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
  //var input = chromeDriver.findElement(By.id("host"));
  //input.sendKeys("1");
  //var inputSts = chromeDriver.findElement(By.id("hostInputSts"));
  //chromeDriver.wait(until.elementTextIs(inputSts, "Host must exceed 2 characters"),5000);
  //input.clear();
  //input.sendKeys("11");
  //chromeDriver.wait(until.elementTextIs(inputSts, ""),5000);
  //input.clear();
  //});
  //test.it("Host max for field ", function() {
  //this.timeout(8000);
  //chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
  //var input = chromeDriver.findElement(By.id("host"));
  //input.sendKeys("0123456789012345678901234567891");
  //var inputSts = chromeDriver.findElement(By.id("hostInputSts"));
  //chromeDriver.wait(until.elementTextIs(inputSts, "Host must not exceed 30 characters"),5000);
  //input.clear();
  //input.sendKeys("012345678901234567890123456789");
  //chromeDriver.wait(until.elementTextIs(inputSts, ""),5000);
  //input.clear();
  //});
});
