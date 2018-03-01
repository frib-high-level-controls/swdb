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
const debug = dbg('swdb:swdb-new-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();


test.describe("Software update screen tests", function () {
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

  test.it("should show search page with login button", function () {
    this.timeout(15000);

    chromeDriver = new webdriver.Builder()
      .forBrowser("chrome")
      .build();
    chromeDriver.manage().window().setPosition(200, 0);

    chromeDriver.get(props.webUrl + "#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      "Log in"), 5000);
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

  test.it("should show search page with username on logout button", function () {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + "#/new");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")), 5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()), 5000);
  });


  test.it("should show the requested record title", function () {
    chromeDriver.wait(until.titleIs("SWDB - New"), 5000);
  });

  test.it("Add new record", function () {
    this.timeout(35000);
    chromeDriver.wait(until.elementLocated(By.id('swName')), 3000);
    var input = chromeDriver.findElement(By.id('swName')).sendKeys("Test Record3");

    // set version
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    input = chromeDriver.findElement(By.id("version"));
    input.click();
    input.sendKeys("Test Version");

    // set branch
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    input = chromeDriver.findElement(By.id("branch"));
    input.click();
    input.sendKeys("Test branch");

    // set description
    chromeDriver.wait(until.elementLocated(By.id("desc")), 3000);
    input = chromeDriver.findElement(By.id("desc"));
    input.click();
    input.sendKeys("Test description");

    // set description document
    chromeDriver.wait(until.elementLocated(By.id("descDocLoc")), 3000);
    input = chromeDriver.findElement(By.id("descDocLoc"));
    input.click();
    input.sendKeys("http://www.google.com");

    // set design description document
    chromeDriver.wait(until.elementLocated(By.id("designDescDocLoc")), 3000);
    input = chromeDriver.findElement(By.id("designDescDocLoc"));
    input.click();
    input.sendKeys("http://www.google.com");

    // set owner 
    chromeDriver.wait(until.elementLocated(By.id("owner")), 3000);
    input = chromeDriver.findElement(By.id("owner"));
    input.click();
    //*[@id="owner"]/input[1]
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="owner"]/input[1]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="owner"]/input[1]'));
    input.sendKeys("controls");
    //*[@id="ui-select-choices-row-0-2"]/span
    // "IFS:LAB.NSCL.OPS.CONTROLS"
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-0-2"]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-0-2"]'));
    input.click();


    // set level of care
    chromeDriver.wait(until.elementLocated(By.id("levelOfCare")), 3000);
    input = chromeDriver.findElement(By.id("levelOfCare"));
    input.click();
    input.sendKeys("LOW");

    // set status
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    input = chromeDriver.findElement(By.id("status"));
    input.click();
    input.sendKeys("Development");

    // set status date
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
    input = chromeDriver.findElement(By.id("statusDate"));
    input.clear();

    input.sendKeys("10/1/2017");


    // set platforms
    chromeDriver.wait(until.elementLocated(By.id("platforms")), 3000);
    input = chromeDriver.findElement(By.id("platforms"));
    input.click();
    input.sendKeys("Test platform");

    // set vvProcLoc
    chromeDriver.wait(until.elementLocated(By.id("add.vvProcLoc")), 3000);
    input = chromeDriver.findElement(By.id("add.vvProcLoc"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("vvProcLoc.0")), 3000);
    input0 = chromeDriver.findElement(By.id("vvProcLoc.0"));
    input0.sendKeys("http://procservtest.com/procdoc0");
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("vvProcLoc.1")), 3000);
    input1 = chromeDriver.findElement(By.id("vvProcLoc.1"));
    input1.sendKeys("http://procservtest.com/procdoc1");
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("vvProcLoc.2")), 3000);
    input2 = chromeDriver.findElement(By.id("vvProcLoc.2"));
    input2.sendKeys("http://procservtest.com/procdoc2");
    // remove the first entry
    chromeDriver.wait(until.elementLocated(By.id("rm.vvProcLoc.0")), 3000);
    input = chromeDriver.findElement(By.id("rm.vvProcLoc.0"));
    input.click();


    // set vvResultsLoc
    chromeDriver.wait(until.elementLocated(By.id("add.vvResultsLoc")), 3000);
    input = chromeDriver.findElement(By.id("add.vvResultsLoc"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc.0")), 3000);
    input0 = chromeDriver.findElement(By.id("vvResultsLoc.0"));
    input0.sendKeys("http://resultservtest.com/resultsdoc0");
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc.1")), 3000);
    input1 = chromeDriver.findElement(By.id("vvResultsLoc.1"));
    input1.sendKeys("http://resultservtest.com/resultsdoc1");
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc.2")), 3000);
    input2 = chromeDriver.findElement(By.id("vvResultsLoc.2"));
    input2.sendKeys("http://resultservtest.com/resultdoc2");
    // remove the first entry
    chromeDriver.wait(until.elementLocated(By.id("rm.vvResultsLoc.0")), 3000);
    input = chromeDriver.findElement(By.id("rm.vvResultsLoc.0"));
    input.click();

    // set version control
    chromeDriver.wait(until.elementLocated(By.id("versionControl")), 3000);
    input = chromeDriver.findElement(By.id("versionControl"));
    input.click();
    input.sendKeys("Git");

    // set version control location
    chromeDriver.wait(until.elementLocated(By.id("versionControlLoc")), 3000);
    input = chromeDriver.findElement(By.id("versionControlLoc"));
    input.click();
    input.sendKeys("http://www.google.com");

    // set recert freq
    chromeDriver.wait(until.elementLocated(By.id("recertFreq")), 3000);
    input = chromeDriver.findElement(By.id("recertFreq"));
    input.click();
    input.sendKeys("Test recertification frequency");

    // set recert date
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="recertDate-group"]/div/p/span/button/i')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="recertDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="recertDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="recertDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
    input.click();

    // set engineer
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    input = chromeDriver.findElement(By.id("engineer"));
    input.click();
    //*[@id="engineer"]/input[1]
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="engineer"]/input[1]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="engineer"]/input[1]'));
    input.sendKeys("ellisr");
    //*[@id="ui-select-choices-row-1-0"]/span/div
    //*[@id="ui-select-choices-row-1-0"]/span
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-select-choices-row-1-0"]')));
    input = chromeDriver.findElement(By.xpath('//*[@id="ui-select-choices-row-1-0"]'));
    input.click();


    chromeDriver.findElement(By.id("submitBtn")).click();
    // chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("formStatus")),
    //   "Document posted"), 5000);
  });

  test.it("should show the details record", function () {
    this.timeout(5000);
    chromeDriver.wait(until.titleIs("SWDB - Details"), 5000);
  });

  test.it("should show the correct software name in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("swName")), 3000);
    chromeDriver.findElement(By.id("swName")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Record3");
      });
  });

  test.it("should show the correct version in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    chromeDriver.findElement(By.id("version")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Version");
      });
  });

  test.it("should show the correct branch in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    chromeDriver.findElement(By.id("branch")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test branch");
      });
  });

  test.it("should show the correct descption in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("desc")), 3000);
    chromeDriver.findElement(By.id("desc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test description");
      });
  });

  test.it("should show the correct descption doc location in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("descDocLoc")), 3000);
    chromeDriver.findElement(By.id("descDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct design descption doc location in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("designDescDocLoc")), 3000);
    chromeDriver.findElement(By.id("designDescDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct owner in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("owner")), 3000);
    chromeDriver.findElement(By.id("owner")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("IFS:LAB.FRIB.ASD.CONTROLS.EBC");
      });
  });

  test.it("should show the correct engineer in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    chromeDriver.findElement(By.id("engineer")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("ELLISR");
      });
  });

  test.it("should show the correct level of care in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("levelOfCare")), 3000);
    chromeDriver.findElement(By.id("levelOfCare")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("LOW");
      });
  });

  test.it("should show the correct status in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    chromeDriver.findElement(By.id("status")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Development");
      });
  });

  // need date checker
  // test.it("should show the correct status date in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
  //   chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

  test.it("should show the correct platforms in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("platforms")), 3000);
    chromeDriver.findElement(By.id("platforms")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test platform");
      });
  });

  test.it("should show the correct vvProcLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("vvProcLoc")), 3000);
    chromeDriver.findElement(By.id("vvProcLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://procservtest.com/procdoc1,http://procservtest.com/procdoc2");
      });
  });

  test.it("should show the correct vvResultsLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")), 3000);
    chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2");
      });
  });

  test.it("should show the correct version control location in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControl")), 3000);
    chromeDriver.findElement(By.id("versionControl")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Git");
      });
  });

  test.it("should show the correct version control location in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControlLoc")), 3000);
    chromeDriver.findElement(By.id("versionControlLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct recert freq in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("recertFreq")), 3000);
    chromeDriver.findElement(By.id("recertFreq")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test recertification frequency");
      });
  });

  // need date checker - skip date test for now
  // test.it("should show the correct recert date in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("recertDate")), 3000);
  //   chromeDriver.findElement(By.id("recertDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

});
