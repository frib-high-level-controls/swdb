var app = require("../../app/server");
var chai = require("chai");
var expect = require("chai").expect;
var supertest = require("supertest")(app);
chai.use(require("chai-as-promised"));
var Be = require('../../app/lib/Db');
let be = new Be.Db();
var instBe = require("../../app/lib/instDb.js");

let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

var webdriver = require("selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("selenium-webdriver/testing");
var fs = require('fs');
var path = require('path');
let dbg = require('debug');
const debug = dbg('swdb:inst-update-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();

test.describe("Installations update screen tests", function() {
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

  test.it('should show search page with username on logout button', function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + '#/inst/list');
    chromeDriver.wait(until.elementLocated(By.id('usrBtn')), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id('usrBtn')),
      props.test.username.toUpperCase()), 5000);
  });

  test.it("should show update page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/inst/new");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()),5000);
  });


  test.it("should show the requested installation record title", function() {
    chromeDriver.wait(until.titleIs("SWDB - New Installation"), 5000);
  });

  test.it("Set the host", function() {
    chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
    var input = chromeDriver.findElement(By.id("host"));
    input.sendKeys("testHost1");
  });

  test.it("Set the area", function() {
    this.timeout(10000);
    // set area
    // add controls room, operator area, nscl control room
    // then delete the controls room
    chromeDriver.wait(until.elementLocated(By.id("add.area")), 3000);
    input = chromeDriver.findElement(By.id("add.area"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("area.0")), 3000);
    input0 = chromeDriver.findElement(By.id("area.0"));
    input0.click();

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.0"]/input[1]')), 3000);
    input0b = chromeDriver.findElement(By.xpath('//*[@id="area.0"]/input[1]'));
    input0b.sendKeys("controls\n");

    chromeDriver.wait(until.elementTextContains(input0,
      "ADB:AREA.FRIB.CTRLITIDF"), 5000);

    chromeDriver.wait(until.elementLocated(By.id("add.area")), 3000);
    input = chromeDriver.findElement(By.id("add.area"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("area.1")), 3000);
    input1 = chromeDriver.findElement(By.id("area.1"));
    input1.click();

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.1"]/input[1]')), 3000);
    input1b = chromeDriver.findElement(By.xpath('//*[@id="area.1"]/input[1]'));
    input1b.sendKeys("operator\n");

    chromeDriver.wait(until.elementTextContains(input1,
      "ADB:AREA.NSCL.OPASSY"), 5000);

    chromeDriver.wait(until.elementLocated(By.id("add.area")), 3000);
    input = chromeDriver.findElement(By.id("add.area"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("area.2")), 3000);
    input2 = chromeDriver.findElement(By.id("area.2"));
    input2.click();

    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="area.2"]/input[1]')), 3000);
    input2b = chromeDriver.findElement(By.xpath('//*[@id="area.2"]/input[1]'));
    input2b.sendKeys("control room\n");

    chromeDriver.wait(until.elementTextContains(input2,
      "ADB:AREA.NSCL.CONTROLRM"), 5000);

    chromeDriver.wait(until.elementLocated(By.id("rm.area.0")), 3000);
    input = chromeDriver.findElement(By.id("rm.area.0"));
    input.click();
  });

  test.it("Set the status", function() {
    // set status
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    input = chromeDriver.findElement(By.id("status"));
    input.click();
    input.sendKeys("RDY_BEAM");

    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
  });

  test.it("Set the status date", function() {
    this.timeout(10000);
    // set status date
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
    input.click();
  });

  test.it("Set the software", function() {
    this.timeout(15000);
    // set software
    chromeDriver.wait(until.elementLocated(By.id("software")), 3000);
    searchInput = chromeDriver.findElement(By.id("software"));
    searchInput.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="software"]/input[1]')));
    searchInput = chromeDriver.findElement(By.xpath('//*[@id="software"]/input[1]'));
    searchInput.sendKeys("BEAST");
    //*[@id="ui-select-choices-row-1-2"]/span
    //*[@id="ui-select-choices-row-0-2"]/span/div/span
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-3"]/span')));
    input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-3"]/span'));
    input.click();
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('software')),
       "BEAST/b5/0.2"),3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('software')),
       "BEAST/b5/0.2"),3000);
    // chromeDriver.pause(2000);
  });

  test.it("Set the name", function() {
    // set name
    chromeDriver.wait(until.elementLocated(By.id("name")), 3000);
    input = chromeDriver.findElement(By.id("name"));
    input.click();
    input.sendKeys("Test name");
  });

  test.it("should show the details record", function () {
    this.timeout(8000);
    // chromeDriver.pause(2000);
    chromeDriver.findElement(By.id("submitBtn")).click();
    chromeDriver.wait(until.titleIs("SWDB - Installation Details"), 5000);
  });

  test.it("should show the correct installtion host in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
    chromeDriver.findElement(By.id("host")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("testHost1");
      });
  });

  test.it("should go to update record", function () {
    chromeDriver.wait(until.elementLocated(By.id("updateBtn")), 3000);
    chromeDriver.findElement(By.id("updateBtn")).click();
    chromeDriver.wait(until.titleIs("SWDB - Update Installation"), 5000);
  });

  test.it("should update host", function () {
    chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
    var input = chromeDriver.findElement(By.id("host"));
    input.clear();
    input.sendKeys("testHost2");
    chromeDriver.findElement(By.id("submitBtn")).click();
  });

  test.it("should show the details record", function () {
    this.timeout(8000);
    chromeDriver.wait(until.titleIs("SWDB - Installation Details"), 5000);
  });

  test.it("should show the correct installtion host in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("host")), 3000);
    chromeDriver.findElement(By.id("host")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("testHost2");
      });
  });

  test.it("should show the correct installtion name in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("name")), 3000);
    chromeDriver.findElement(By.id("name")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test name");
      });
  });

  test.it("should show the correct installtion software in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("software")), 3000);
    chromeDriver.findElement(By.id("software")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("5947589458a6aa0face9a555");
      });
  });

  test.it("should show the correct installtion area in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("area")), 3000);
    chromeDriver.findElement(By.id("area")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("ADB:AREA.NSCL.OPASSY,ADB:AREA.NSCL.CONTROLRM");
      });
  });

  test.it("should show the correct installtion DRR in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("drrs")), 3000);
    chromeDriver.findElement(By.id("drrs")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct installtion status in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    chromeDriver.findElement(By.id("status")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("RDY_BEAM");
      });
  });
  // need date test
  // test.it("should show the correct installtion status date in details", function () {
  //   this.timeout(8000);
  //   chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
  //   chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

  test.it("should show the correct installtion V&V results in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")), 3000);
    chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show changes in the history table of details", function () {
    this.timeout(20000);
    //*[@id="histTable"]/tbody/tr[2]/td[2] shold be "New Test Description2"
    chromeDriver.wait(until.elementLocated(By.id("hist.0")), 3000);
    input = chromeDriver.findElement(By.id("hist.0"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id('histPathName.0.0')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('histPathName.0.0')),
       "host"),3000);
    chromeDriver.wait(until.elementLocated(By.id('histPathValue.0.0')), 3000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(
      By.id('histPathValue.0.0')),
       "testHost2"),3000);
  });
});
