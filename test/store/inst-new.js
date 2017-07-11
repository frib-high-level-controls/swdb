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
const testSwNames = JSON.parse(fs.readFileSync('./test/misc/datafiles/swTestNames.json', 'utf8'));
const testSwData = JSON.parse(fs.readFileSync('./test/misc/datafiles/swTestDataCombined.json', 'utf8'));


test.describe("Installations add screen tests", function() {
  var chromeDriver = new webdriver.Builder()
    .forBrowser("chrome")
    .build();
  chromeDriver.manage().window().setPosition(200,0);

  test.before(function(done) {
    this.timeout(5000);
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
    // clear the test collection
    console.log("Starting inst-new...");
    //chromeDriver.manage().window().setPosition(200,0);
    console.log("Dropping installation collections...");
    console.log("Resetting swNames test data...");
    be.swDoc.db.collections.swNamesProp.drop(function(err){
      console.log("inserting testSwNames in swNamesProp collection");
      be.swNamesDoc.db.collections.swNamesProp.insert(testSwNames,
        function(err, records){
        });
    });
    console.log("Resetting swdb test data...");
    be.swDoc.db.collections.swdbCollection.drop(function(err){
      console.log("inserting swData in swdb collection:");
      be.swDoc.db.collections.swdbCollection.insert(testSwData,
        function(err, records){
        });
    });
    console.log("inserting testInstData in installations collection");
    instBe.instDoc.db.collections.instCollection.insert(testInstData,
      function(err, records){
        done();
      });
  });
  test.after(function(done) {
    // clear the test collection
    console.log("Cleaning up (inst-new)...");
    console.log("Dropping swNames test data...");
    be.swDoc.db.collections.swNamesProp.drop(function(err){});
    chromeDriver.quit();
    console.log("Dropping db test data...");
    be.swDoc.db.collections.swdbCollection.drop(function(err){});
    console.log("Dropping installation collections...");
    instBe.instDoc.db.collections.instCollection.drop(function(err){
      done();
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
