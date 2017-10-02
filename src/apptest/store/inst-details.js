let app = require("../../app/server");
let chai = require("../../../node_modules/chai");
let expect = require("../../../node_modules/chai").expect;
chai.use(require("../../../node_modules/chai-as-promised"));
let ObjectId = require('../../../node_modules/mongodb').ObjectID;

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

let webdriver = require("../../../node_modules/selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("../../../node_modules/selenium-webdriver/testing");
let fs = require('fs');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();


test.describe("Installations detail screen tests", function() {
  let chromeDriver = null;
  test.before(function(done) {
    console.log("Starting inst-details");
    this.timeout(5000);
    testTools.loadTestCollectionsStandard(done, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  test.after(function(done) {
    chromeDriver.quit();
    testTools.clearTestCollections(done);
  });

  let allCookies = null;

  test.it("should show search page with login button", function() {
    chromeDriver = new webdriver.Builder()
      .forBrowser("chrome")
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    this.timeout(8000);
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
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "testuser"),5000);
  });

  test.it("should find a record", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("hostSrch")), 8000)
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
      "testuser"),5000);
  });

  test.it("should show the requested installation record host field", function() {
    chromeDriver.wait(until.elementLocated(By.id("host")),5000);
    chromeDriver.findElement(By.id("host")).getAttribute("value").then(function(result) {
      expect(result).to.match(/host2/);
    });
  });

  test.it("should show the requested installation record name field", function() {
    chromeDriver.wait(until.elementLocated(By.id("name")),5000);
    chromeDriver.findElement(By.id("name")).getAttribute("value").then(function(result) {
      expect(result).to.equal("Installation name2");
    });
  });

  test.it("should show the requested installation record software field", function() {
    chromeDriver.wait(until.elementLocated(By.id("software")),5000);
    chromeDriver.findElement(By.id("software")).getAttribute("value").then(function(result) {
      expect(result).to.match(/^[0-9a-fA-F]{24}$/);
    });
  });

  test.it("should show the requested installation record area field", function() {
    chromeDriver.wait(until.elementLocated(By.id("area")),5000);
    chromeDriver.findElement(By.id("area")).getAttribute("value").then(function(result) {
      expect(result).to.match(/LS1/);
    });
  });

  test.it("should show the requested installation record status field", function() {
    chromeDriver.wait(until.elementLocated(By.id("status")),5000);
    chromeDriver.findElement(By.id("status")).getAttribute("value").then(function(result) {
      expect(result).to.match(/DEVEL/);
    });
  });

  test.it("should show the requested installation record status date field", function() {
    chromeDriver.wait(until.elementLocated(By.id("statusDate")),5000);
    chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(function(result) {
      expect(result).to.match(/2016-09-21T07:00:00.000Z/);
    });
  });

  test.it("should show the requested installation record vvResults field", function() {
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")),5000);
    chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(function(result) {
      expect(result).to.match(/vvResultsLoc2/);
    });
  });

  test.it("should show the requested installation record drrs field", function() {
    chromeDriver.wait(until.elementLocated(By.id("drrs")),5000);
    chromeDriver.findElement(By.id("drrs")).getAttribute("value").then(function(result) {
      expect(result).to.match(/^$/);
    });
  });
});
