let app = require("../../app/server");
let chai = require("chai");
let expect = require("chai").expect;
var supertest = require("supertest")(app);
chai.use(require("chai-as-promised"));
let ObjectId = require('mongodb').ObjectID;

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

let webdriver = require("selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("selenium-webdriver/testing");
let fs = require('fs');
let dbg = require('debug');
const debug = dbg('swdb:inst-details-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();


test.describe("Installations detail screen tests", function() {
  let allCookies = null;
  before("Prep DB", async function () {
    debug("Prep DB");
    await testTools.clearTestCollections(debug);
    await testTools.loadTestCollectionsStandard(debug, props.test.swTestDataFile, props.test.instTestDataFile);
  });

  after("clear db", async function () {
    debug("Clear DB");
    // clear the test collection.
    chromeDriver.quit();
    await testTools.clearTestCollections(debug);
  });

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
    chromeDriver.get(props.webUrl+"#/inst/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()),5000);
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
      props.test.username.toUpperCase()),5000);
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
      expect(result).to.match(/Ready for install/);
    });
  });

  test.it("should show the requested installation record status date field", function() {
    chromeDriver.wait(until.elementLocated(By.id("statusDate")),5000);
    chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(function(result) {
      expect(result).to.match(/9\/21\/2016/);
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
