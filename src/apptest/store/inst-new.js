let app = require("../../app/server");
let chai = require("chai");
let expect = require("chai").expect;
chai.use(require("chai-as-promised"));
let ObjectId = require('mongodb').ObjectID;
let rc = require("rc");
let TestTools = require('./TestTools');
let testTools = new TestTools.TestTools();

let webdriver = require("selenium-webdriver"),
  By = webdriver.By,
  until = webdriver.until,
  test = require("selenium-webdriver/testing");
let fs = require('fs');
let path = require('path');
let dbg = require('debug');
const debug = dbg('swdb:inst-new-tests');

let CommonTools = require('../../app/lib/CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();


test.describe("Installations add screen tests", function() {
  let chromeDriver;
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


  let allCookies = null;

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

    // set software
    chromeDriver.wait(until.elementLocated(By.id("software")), 3000);
    searchInput = chromeDriver.findElement(By.id("software"));
    searchInput.sendKeys("BEAST");
    chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-") and "option-4"=substring(@id, string-length(@id)-string-length("option-4")+1)]/a')));
    input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-4"=substring(@id, string-length(@id)-string-length("option-2")+1)]/a'));
    input.click();

    // set name
    chromeDriver.wait(until.elementLocated(By.id("name")), 3000);
    input = chromeDriver.findElement(By.id("name"));
    input.click();
    input.sendKeys("Test name");

    // set area
    chromeDriver.wait(until.elementLocated(By.id("add.area")), 3000);
    input = chromeDriver.findElement(By.id("add.area"));
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("area.0")), 3000);
    input0 = chromeDriver.findElement(By.id("area.0"));
    input0.sendKeys("FE");
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("area.1")), 3000);
    input1 = chromeDriver.findElement(By.id("area.1"));
    input1.sendKeys("LS1");
    input.click();
    chromeDriver.wait(until.elementLocated(By.id("area.2")), 3000);
    input2 = chromeDriver.findElement(By.id("area.2"));
    input2.sendKeys("LS2");
    // remove the first entry
    chromeDriver.wait(until.elementLocated(By.id("rm.area.0")), 3000);
    input = chromeDriver.findElement(By.id("rm.area.0"));
    input.click();

    // set drrs
    chromeDriver.wait(until.elementLocated(By.id("drrs")), 3000);
    input = chromeDriver.findElement(By.id("drrs"));
    input.click();
    input.sendKeys("TestDRR");

    // set the status
    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);
    input = chromeDriver.findElement(By.id("status"));
    input.click();
    input.sendKeys("RDY_BEAM");

    chromeDriver.wait(until.elementLocated(By.id("status")), 3000);

    // set status date
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/span/button/i'));
    input.click();
    chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]')), 3000);
    input = chromeDriver.findElement(By.xpath('//*[@id="statusDate-group"]/div/p/div/ul/li[2]/span/button[1]'));
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

    // // set slots
    // chromeDriver.wait(until.elementLocated(By.id("slots")), 3000);
    // searchInput = chromeDriver.findElement(By.id("slots"));
    // searchInput.sendKeys("FE_LEBT");
    // // find the second item in that list and add it to the selected list
    // chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-")]')), 3000);
    // input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-1"=substring(@id, string-length(@id)-string-length("option-1")+1)]/a'));
    // input.click();

    // // now search again and add the third item to the selected list
    // searchInput.clear();
    // searchInput.sendKeys("FE_LEBT");
    // chromeDriver.wait(until.elementLocated(By.xpath('//*[starts-with(@id,"typeahead-")]')), 3000);
    // input = chromeDriver.findElement(By.xpath('//*[starts-with(@id,"typeahead-") and "option-2"=substring(@id, string-length(@id)-string-length("option-2")+1)]/a'));
    // input.click();

    // // find one of the selected items and cancel it
    // chromeDriver.wait(until.elementLocated(By.xpath('/html/body/div[2]/section/div[2]/form/div[9]/div[1]/div[1]/span')), 3000);
    // input = chromeDriver.findElement(By.xpath('/html/body/div[2]/section/div[2]/form/div[9]/div[1]/div[1]/span'));
    // chromeDriver.wait(until.elementTextIs(input, "FE_LEBT:BD_D0824"),5000);

    // chromeDriver.wait(until.elementLocated(By.xpath('//*[@id="rmSelSlotBtn"]')), 3000);
    // input = chromeDriver.findElement(By.xpath('//*[@id="rmSelSlotBtn"]'));
    // input.click();

    // // locate the other selected item to make sure we got it
    // chromeDriver.wait(until.elementLocated(By.xpath('/html/body/div[2]/section/div[2]/form/div[9]/div[1]/div/span')), 3000);
    // input = chromeDriver.findElement(By.xpath('/html/body/div[2]/section/div[2]/form/div[9]/div[1]/div/span'));
    // chromeDriver.wait(until.elementTextIs(input, "FE_LEBT:AP_D0807"),5000);

    // submit the record
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
        expect(text).to.equal("testHost1");
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
        expect(text).to.equal("5947589458a6aa0face9a556");
      });
  });

  test.it("should show the correct installtion area in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("area")), 3000);
    chromeDriver.findElement(By.id("area")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("LS1,LS2");
      });
  });

  test.it("should show the correct installtion DRR in details", function () {
    this.timeout(8000);
    chromeDriver.wait(until.elementLocated(By.id("drrs")), 3000);
    chromeDriver.findElement(By.id("drrs")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("TestDRR");
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

  test.it("should show the correct vvResultsLoc in details", function () {
    chromeDriver.wait(until.elementLocated(By.id("vvResultsLoc")), 3000);
    chromeDriver.findElement(By.id("vvResultsLoc")).getAttribute("value").then(
      function (text) {
        expect(text).to.equal("http://resultservtest.com/resultsdoc1,http://resultservtest.com/resultdoc2");
      });
  });
});
