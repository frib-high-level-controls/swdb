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
const debug = dbg('swdb:swdb-list-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();

test.describe("Installations record tests", function() {
  var chromeDriver;
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
    chromeDriver.get(props.webUrl + "#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()),5000);
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

  test.it("should show SW name columns names in proper order", function() {
    let xpath = '//*[@id="swdbList"]/thead/tr[1]/th[1]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Software name");
  });

  test.it("should show Status column names in proper order", function() {
    xpath = '//*[@id="swdbList"]/thead/tr[1]/th[2]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Branch");
  });

  test.it("should show Version column names in proper order", function() {
    xpath = '//*[@id="swdbList"]/thead/tr[1]/th[3]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Version");
  });

  test.it("should show Owner column names in proper order", function() {
    xpath = '//*[@id="swdbList"]/thead/tr[1]/th[4]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Owner");
  });

  test.it("should show Engineer column names in proper order", function() {
    xpath = '//*[@id="swdbList"]/thead/tr[1]/th[5]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Engineer");
  });

  test.it("should show Status column names in proper order", function() {
    xpath = '//*[@id="swdbList"]/thead/tr[1]/th[6]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Status");
  });

  test.it("should show Status date column names in proper order", function() {
    xpath = '//*[@id="swdbList"]/thead/tr[1]/th[7]';
    chromeDriver.wait(until.elementLocated(By.xpath(xpath)), 8000);
    var field = chromeDriver.findElement(By.xpath(xpath));
    return expect(Promise.resolve(field.getText())).to.eventually.equal("Status date");
  });

  test.it("should show a known record", function() {
    this.timeout(8000);
    //chromeDriver.wait(until.elementLocated(By.linkText("BEAST")), 8000);
    //
    ////*[@id="swdbList"]/tbody/tr[4]/td[1]/a
    //
    chromeDriver.wait(until.elementLocated(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]')), 8000);
    var link = chromeDriver.findElement(By.xpath('//a[@href="#/details/5947589458a6aa0face9a554"]'));
    return expect(Promise.resolve(link.getText())).to.eventually.equal("BEAST");
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
