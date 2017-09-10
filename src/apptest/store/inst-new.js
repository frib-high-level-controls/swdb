var app = require("../../app/server");
var chai = require("../../../node_modules/chai");
var expect = require("../../../node_modules/chai").expect;
chai.use(require("../../../node_modules/chai-as-promised"));
var ObjectId = require('../../../node_modules/mongodb').ObjectID;
let rc = require("../../../node_modules/rc");
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


test.describe("Installations add screen tests", function() {
  var chromeDriver;

  test.before(function(done) {
    console.log("Starting inst-new");
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

    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "Log in"),5000);
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
      "testuser"),5000);
  });


  test.it("should show the requested installation record title", function() {
    chromeDriver.wait(until.titleIs("SWDB - New Installation"), 5000);
  });

  test.it("Add new record", function() {
    this.timeout(12000);
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

    // now search again and add the third item to the selected list
    searchInput.clear();
    searchInput.sendKeys("FE_LEBT");
    chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-")]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-2"=substring(@id, string-length(@id)-string-length("option-2")+1)]/a'));
    input.click();

    // find one of the selected items and cancel it
    chromeDriver.wait(until.elementLocated(By.xpath('/html/body/div[2]/section/div[2]/form/div[4]/div[1]/div[1]/span')), 3000);
    input = chromeDriver.findElement(By.xpath('/html/body/div[2]/section/div[2]/form/div[4]/div[1]/div[1]/span'));
    chromeDriver.wait(until.elementTextIs(input, "FE_LEBT:BD_D0824"),5000);

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="rmSelSlotBtn"]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="rmSelSlotBtn"]'));
    input.click();

    // locate the other selected item to make sure we got it
    chromeDriver.wait(until.elementLocated(By.xpath('/html/body/div[2]/section/div[2]/form/div[4]/div[1]/div/span')), 3000);
    input = chromeDriver.findElement(By.xpath('/html/body/div[2]/section/div[2]/form/div[4]/div[1]/div/span'));
    chromeDriver.wait(until.elementTextIs(input, "FE_LEBT:AP_D0807"),5000);

    // set the status
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    input = chromeDriver.findElement(By.id("status"));
    input.click();
    input.sendKeys("RDY_BEAM");

    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);

    // set software
    chromeDriver.wait(until.elementLocated(By.id("software")), 3000);
    searchInput = chromeDriver.findElement(By.id("software"));
    searchInput.sendKeys("BEAST");
    chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-") and "option-4"=substring(@id, string-length(@id)-string-length("option-4")+1)]/a')));
    input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-4"=substring(@id, string-length(@id)-string-length("option-2")+1)]/a'));
    input.click();
  });
});
