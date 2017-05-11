var app = require("../../server");
var chai = require("chai");
var expect = require("chai").expect;
chai.use(require("chai-as-promised"));
var be = require("../../lib/db");
var instBe = require("../../lib/instDb.js");

var webdriver = require("../../node_modules/selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("../../node_modules/selenium-webdriver/testing");
var fs = require('fs');
var path = require('path');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
const testInstData = JSON.parse(fs.readFileSync('./test/misc/testInstData.json', 'utf8'));



test.describe("Installations record tests", function() {
  var chromeDriver = new webdriver.Builder()
      .forBrowser("chrome")
      .build();
    chromeDriver.manage().window().setPosition(200,0);

  test.before(function(done) {
    console.log("Starting inst-list...");
    console.log("Dropping installation collections...");
    console.log("Inserting test data...");
    instBe.instDoc.db.collections.instCollection.drop(function(err){
      console.log("inserting testInstData in installations collection:"+JSON.stringify(testInstData,null,2));
      instBe.instDoc.db.collections.instCollection.insert(testInstData,
        function(err, records){
          done();
        });
    });
  });

  test.after(function(done) {
      // clear the test collection
      console.log("Cleaning up (inst-list)...");
      console.log("Dropping installation collections...");
      chromeDriver.quit();
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
