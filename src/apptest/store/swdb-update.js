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
const debug = dbg('swdb:swdb-update-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();


test.describe("Software update screen tests", function() {
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

  test.it("should show search page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl + "#/list");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()),5000);
  });

  test.it("should show new page with username on logout button", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/new");
    chromeDriver.wait(until.elementLocated(By.id("usrBtn")),5000);
    chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("usrBtn")),
      props.test.username.toUpperCase()),5000);
  });


  test.it("should show the requested installation record title", function() {
    chromeDriver.wait(until.titleIs("SWDB - New"), 5000);
  });

  test.it("Add new record", function() {
    this.timeout(25000);
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
    input.sendKeys("controls");
    //*[@id="typeahead-11-1083-option-5"]/a
    chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-") and "option-5"=substring(@id, string-length(@id)-string-length("option-5")+1)]/a')));
    input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-5"=substring(@id, string-length(@id)-string-length("option-5")+1)]/a'));
    input.click();

    // set engineer
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    input = chromeDriver.findElement(By.id("engineer"));
    input.click();
    input.sendKeys("ellis");
    chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-") and "option-0"=substring(@id, string-length(@id)-string-length("option-0")+1)]/a')));
    input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-0"=substring(@id, string-length(@id)-string-length("option-0")+1)]/a'));
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
    input.sendKeys("DEVEL");

    // set status date
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
    input.click();

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

    // submit and check result
    chromeDriver.findElement(By.id("submitBtn")).click();
    // chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("formStatus")),
    //   "Document posted"),5000);
  });

  test.it("should show the details record", function () {
    chromeDriver.wait(until.titleIs("SWDB - Details"), 5000);
  });

  test.it("should show the correct software name in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("swName")), 3000);
    chromeDriver.findElement(By.id("swName")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Record3");
      });
  });

  // find the created record
  test.it("should find a record", function() {
    this.timeout(8000);
    chromeDriver.get(props.webUrl+"#/list");
    chromeDriver.wait(until.elementLocated(By.id("swNameSrch")), 8000)
      .sendKeys("Record3");
    chromeDriver.wait(until.elementLocated(By.id("versionSrch")), 8000)
      .sendKeys("Test version");
    chromeDriver.wait(until.elementLocated(By.linkText("Test Record3")),
      8000);
  });

  // find the created record and click update
  test.it("should show record details", function() {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.linkText("Test Record3")),
      8000).click();
    chromeDriver.wait(until.titleIs("SWDB - Details"), 5000);
    chromeDriver.wait(until.elementLocated(By.id("updateBtn")),
      8000).click();
  });

  test.it("should show the update title", function() {
    chromeDriver.wait(until.titleIs("SWDB - Update"), 5000);
  });

  test.it("should update a record", function() {
    this.timeout(20000);
    chromeDriver.wait(until.elementLocated(By.id("desc")), 8000)
      .clear();
    chromeDriver.wait(until.elementLocated(By.id("desc")), 8000)
      .sendKeys("New Test Description");
    chromeDriver.wait(until.elementLocated(By.id("submitBtn")), 8000)
      .click();
    // chromeDriver.wait(until.elementTextContains(chromeDriver.findElement(By.id("formStatus")),
    //   "Document updates successfully posted"),5000);
  });

  test.it("should show the details record", function () {
    this.timeout(20000);
    chromeDriver.wait(until.titleIs("SWDB - Details"), 20000);
  });

  test.it("should show the correct description in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("desc")), 3000);
    chromeDriver.findElement(By.id("desc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("New Test Description");
      });
  });

  test.it("should show the correct software name in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("swName")), 3000);
    chromeDriver.findElement(By.id("swName")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Record3");
      });
  });

  test.it("should show the correct software branch in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    chromeDriver.findElement(By.id("branch")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test branch");
      });
  });

  test.it("should show the correct software version in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    chromeDriver.findElement(By.id("version")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Version");
      });
  });

  test.it("should show the correct description doc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("descDocLoc")), 3000);
    chromeDriver.findElement(By.id("descDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct design description doc in details", function () {
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
        expect(text).to.equal("IFS:LAB.NSCL.OPS.CONTROLS");
      });
  });

  test.it("should show the correct engineer in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    chromeDriver.findElement(By.id("engineer")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("ELLISR");
      });
  });

  test.it("should show the correct levelOfCare in details", function () {
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
        expect(text).to.equal("DEVEL");
      });
  });

  // test.it("should show the correct statusDate in details", function () {
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

  test.it("should show the correct versionControl in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControl")), 3000);
    chromeDriver.findElement(By.id("versionControl")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Git");
      });
  });

  test.it("should show the correct versionControlLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControlLoc")), 3000);
    chromeDriver.findElement(By.id("versionControlLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct recertFreq in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("recertFreq")), 3000);
    chromeDriver.findElement(By.id("recertFreq")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test recertification frequency");
      });
  });

  // test.it("should show the correct recertDate in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("recertDate")), 3000);
  //   chromeDriver.findElement(By.id("recertDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });
  test.it("should click new version shows new record page ", function () {
    chromeDriver.wait(until.elementLocated(By.id("bumpVerBtn")),
      8000).click();
    chromeDriver.wait(until.titleIs("SWDB - New"), 5000);
  });

  test.it("should show the correct description in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("desc")), 3000);
    chromeDriver.findElement(By.id("desc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("New Test Description");
      });
  });

  test.it("should show the correct software name in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("swName")), 3000);
    chromeDriver.findElement(By.id("swName")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Record3");
      });
  });

  test.it("should show the correct software branch in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    chromeDriver.findElement(By.id("branch")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct software version in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    chromeDriver.findElement(By.id("version")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct description doc in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("descDocLoc")), 3000);
    chromeDriver.findElement(By.id("descDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct design description doc in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("designDescDocLoc")), 3000);
    chromeDriver.findElement(By.id("designDescDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });
  
  test.it("should show the correct owner in bump version new", function () {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id("owner")), 3000);
    chromeDriver.wait(function() {
      return chromeDriver.findElement(By.id("owner")).getAttribute("value").then(function(val){
        if (val === "IFS:LAB.NSCL.OPS.CONTROLS") {
          // return chai.assert.strictEqual(val,"xIFS:LAB.NSCL.OPS.CONTROLS" ,"Got");
          return true;
        } else {
          // return chai.assert.notStrictEqual(val,"xIFS:LAB.NSCL.OPS.CONTROLS" ,"Not Got");
          return false;
        }
      });
    });
  });

  test.it("should show the correct engineer in bump version new", function () {
    this.timeout(5000);
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    chromeDriver.wait(function() {
      return chromeDriver.findElement(By.id("engineer")).getAttribute("value").then(function(val){
        return val === "ELLISR";
      });
    });
  });

  test.it("should show the correct levelOfCare in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("levelOfCare")), 3000);
    chromeDriver.findElement(By.id("levelOfCare")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("LOW");
      });
  });

  test.it("should show the correct status in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    chromeDriver.findElement(By.id("status")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("DEVEL");
      });
  });

  // test.it("should show the correct statusDate in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("statusDate")), 3000);
  //   chromeDriver.findElement(By.id("statusDate")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("2017-09-30T07:00:00.000Z");
  //     });
  // });

  test.it("should show the correct platforms in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("platforms")), 3000);
    chromeDriver.findElement(By.id("platforms")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test platform");
      });
  });

  // test.it("should show the correct vvProcLoc in bump version new", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("vvProcLoc")), 3000);
  //   chromeDriver.findElement(By.id("vvProcLoc")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("http://procservtest.com/procdoc1,http://procservtest.com/procdoc2");
  //     });
  // });

  // test.it("should show the correct vvResultsLoc in details", function () {
  //   chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")), 3000);
  //   chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(
  //     function (text) {
  //       expect(text).to.equal("");
  //     });
  // });

  test.it("should show the correct versionControl in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControl")), 3000);
    chromeDriver.findElement(By.id("versionControl")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Git");
      });
  });

  test.it("should show the correct versionControlLoc in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControlLoc")), 3000);
    chromeDriver.findElement(By.id("versionControlLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct recertFreq in bump version new", function () {
    chromeDriver.wait(until.elementLocated(By.id("recertFreq")), 3000);
    chromeDriver.findElement(By.id("recertFreq")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test recertification frequency");
      });
  });

  test.it("should update the branch and version and submit ", function () {
    this.timeout(5000);
    // set version
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    input = chromeDriver.findElement(By.id("version"));
    input.click();
    input.sendKeys("Bumped Version");

    // set branch
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    input = chromeDriver.findElement(By.id("branch"));
    input.click();
    input.sendKeys("Bumped Branch");
    chromeDriver.wait(until.elementLocated(By.id("submitBtn")),
      8000).click();
    chromeDriver.wait(until.titleIs("SWDB - Details"), 5000);
  });

  test.it("should show the correct description in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("desc")), 3000);
    chromeDriver.findElement(By.id("desc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("New Test Description");
      });
  });

  test.it("should show the correct software name in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("swName")), 3000);
    chromeDriver.findElement(By.id("swName")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test Record3");
      });
  });

  test.it("should show the correct software branch in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("branch")), 3000);
    chromeDriver.findElement(By.id("branch")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Bumped Branch");
      });
  });

  test.it("should show the correct software version in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("version")), 3000);
    chromeDriver.findElement(By.id("version")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Bumped Version");
      });
  });

  test.it("should show the correct description doc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("descDocLoc")), 3000);
    chromeDriver.findElement(By.id("descDocLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct design description doc in details", function () {
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
        expect(text).to.equal("IFS:LAB.NSCL.OPS.CONTROLS");
      });
  });

  test.it("should show the correct engineer in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("engineer")), 3000);
    chromeDriver.findElement(By.id("engineer")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("ELLISR");
      });
  });

  test.it("should show the correct levelOfCare in details", function () {
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
        expect(text).to.equal("DEVEL");
      });
  });

  // test.it("should show the correct statusDate in details", function () {
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
        expect(text).to.equal("");
      });
  });

  test.it("should show the correct versionControl in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControl")), 3000);
    chromeDriver.findElement(By.id("versionControl")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Git");
      });
  });

  test.it("should show the correct versionControlLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("versionControlLoc")), 3000);
    chromeDriver.findElement(By.id("versionControlLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://www.google.com");
      });
  });

  test.it("should show the correct recertFreq in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("recertFreq")), 3000);
    chromeDriver.findElement(By.id("recertFreq")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("Test recertification frequency");
      });
  });

});
