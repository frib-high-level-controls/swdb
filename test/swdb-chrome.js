var app = require("../server");
var chai = require("chai");
var expect = require("chai").expect;
chai.use(require('chai-as-promised'));
var be = require("../lib/db");

var webdriver = require('../node_modules/selenium-webdriver'),
By = webdriver.By,
until = webdriver.until,
test = require('../node_modules/selenium-webdriver/testing');

// clear the test collection before and after tests suite
before(function(done) {
  // clear the test collection
  be.swDoc.db.collections.swdbs.drop();
  this.timeout(5000);
  done();
});
after(function(done) {
  // clear the test collection
  be.swDoc.db.collections.swdbs.drop();
  done();
});
test.describe('SWDB record tests', function() {
  var driver;

  test.before(function() {
    this.timeout(5000);
    driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();
    driver.manage().timeouts().implicitlyWait(3000);
    driver.manage().window().setPosition(200,0);
  });

  test.it('should login', function() {
    // get test authentication
    driver.get("http://localhost:3000/login?username=testuser&password=testuserpasswd");
    driver.wait(until.elementLocated(By.id("Test auth success")),3000);
  });

  // Open the new page and insert test data
  test.it('should add a new record', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    driver.findElement(By.id('swName')).sendKeys('Software Name - 3001');
    driver.findElement(By.id('owner')).sendKeys('Software owner - 3001');
    driver.findElement(By.id('levelOfCare')).sendKeys('LOW');
    driver.findElement(By.id('status')).sendKeys('DEVEL');
    driver.findElement(By.id('statusDate')).sendKeys('1978/07/07');
    driver.findElement(By.id('releasedVersion')).sendKeys('v0.3001');
    driver.findElement(By.id('submitBtn')).click();

    driver.wait(until.elementTextContains(driver.findElement(By.id('formStatus')),
    'Document posted'),5000);
  });

  // find a record
  test.it('should find and update a record', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/list');
    driver.wait(until.elementLocated(By.id('swdbList_filter')), 8000)
    .findElement(By.tagName('Input'))
    .sendKeys('3001');
    driver.wait(until.elementLocated(By.linkText("Software Name - 3001")),
    8000);

    driver.findElement(By.linkText('Software Name - 3001')).click();
    driver.wait(until.titleIs('SWDB - Details'), 5000);

    driver.findElement(By.linkText('Update this document')).click();
    driver.wait(until.titleIs('SWDB - Update'), 5000);
    driver.findElement(By.id('owner')).clear();
    driver.findElement(By.id('owner')).sendKeys('NEW Owner 3001');
    driver.findElement(By.id('submitBtn')).click();
    driver.wait(until.elementTextContains(driver.findElement(By.id('formStatus')),
    'Document updates successfully posted'),5000);
  });

  // // delete a record
  // test.it('should delete a record', function() {
  //   this.timeout(5000);
  //   driver.get('http://localhost:3000/#/del/3001');
  //   driver.wait(until.titleIs('SWDB - Delete'), 5000);
  //   driver.findElement(By.id('submitBtn')).click();

  //   // wait for success message
  //   driver.wait(until.elementTextContains(
  //     driver.findElement(By.id('formStatus')),
  //      'Document successfully deleted'),5000);
  // });

  // test field limits
  test.it('SW Name required', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var swNameInput = driver.findElement(By.id('swName'));
    swNameInput.sendKeys('0123456789012345678901234567891');
    swNameInput.clear();
    var swNameInputSts = driver.findElement(By.id('swNameInputSts'));
    text = swNameInputSts.getText();
    expect(text).to.eventually.contain("Name is required");
    swNameInput.clear();
  });
  test.it('SW Name min for field ', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var swNameInput = driver.findElement(By.id('swName'));
    swNameInput.sendKeys('1');
    var swNameInputSts = driver.findElement(By.id('swNameInputSts'));
    var text = swNameInputSts.getText();
    expect(text).to.eventually.contain("Name must exceed 2 characters");
    swNameInput.clear();
    swNameInput.sendKeys('11');
    // text = swNameInputSts.getText();
    // expect(text).to.eventually.equal("");
    swNameInputSts.getText().should.equal("");
    swNameInput.clear();
  });
  test.it('SW Name max for field ', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var swNameInput = driver.findElement(By.id('swName'));
    swNameInput.sendKeys('0123456789012345678901234567891');
    var swNameInputSts = driver.findElement(By.id('swNameInputSts'));
    text = swNameInputSts.getText();
    expect(text).to.eventually.equal("Name must not exceed 30 characters");
    swNameInput.clear();
    swNameInput.sendKeys('012345678901234567890123456789');
    var text = swNameInputSts.getText();
    expect(text).to.eventually.equal("");
    swNameInput.clear();
  });
  test.it('SW owner required', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var ownerInput = driver.findElement(By.id('owner'));
    ownerInput.sendKeys('1');
    ownerInput.clear();
    var ownerInputSts = driver.findElement(By.id('ownerInputSts'));
    text = ownerInputSts.getText();
    expect(text).to.eventually.equal("Owner is required");
    ownerInput.clear();
  });
  test.it('SW owner min for field ', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var ownerInput = driver.findElement(By.id('owner'));
    ownerInput.sendKeys('1');
    var ownerInputSts = driver.findElement(By.id('ownerInputSts'));
    text = ownerInputSts.getText();
    expect(text).to.eventually.contain("Owner must exceed 2 characters");
    ownerInput.clear();
    ownerInput.sendKeys('11');
    var text = ownerInputSts.getText();
    expect(text).to.eventually.equal("");
    ownerInput.clear();
  });
  test.it('SW owner max for field ', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var ownerInput = driver.findElement(By.id('owner'));
    ownerInput.sendKeys('0123456789012345678901234567891');
    var ownerInputSts = driver.findElement(By.id('ownerInputSts'));
    var text = ownerInputSts.getText();
    expect(text).to.eventually.equal("Owner must not exceed 30 characters");
    ownerInput.clear();
    ownerInput.sendKeys('012345678901234567890123456789');
    text = ownerInputSts.getText();
    expect(text).to.eventually.equal("");
    ownerInput.clear();
  });

  test.it('statusDate date format', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var input = driver.findElement(By.id('statusDate'));
    //input.sendKeys('7');
    //var inputSts = driver.findElement(By.id('statusDateInputSts'));
    //var text = inputSts.getText();
    //expect(text).to.eventually.equal("Use date format YYYY/MM/DD");
    input.clear();
    input.sendKeys('1911/11/11');
    var text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
  });
  test.it('releasedVersion format', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var input = driver.findElement(By.id('releasedVersion'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('releasedVersionInputSts'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 2 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
  });
  test.it('platforms format', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var input = driver.findElement(By.id('platforms'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('platformsInputSts'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
  });

  // auxSw
  test.it('Add auxSw min', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var addButton = driver.findElement(By.id('add.auxSw'));
    addButton.click();
    var input = driver.findElement(By.id('auxSw.0'));
    var rmButton = driver.findElement(By.id('rm.auxSw.0'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('auxSwInputSts.0'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
    rmButton.click();
  });
  // swDescDoc add
  test.it('Add swDescDoc min', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var addButton = driver.findElement(By.id('add.swDescDoc'));
    addButton.click();
    var input = driver.findElement(By.id('swDescDoc.0'));
    var rmButton = driver.findElement(By.id('rm.swDescDoc.0'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('swDescDocInputSts.0'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
    rmButton.click();
  });
  // validationDoc add
  test.it('Add validationDoc doc min', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var addButton = driver.findElement(By.id('add.validationDoc'));
    addButton.click();
    var input = driver.findElement(By.id('validationDocInput.0.doc'));
    var rmButton = driver.findElement(By.id('rm.validationDoc.0'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('validationDocInputSts.0.doc'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();

    input = driver.findElement(By.id('validationDocInput.0.date'));
    input.sendKeys('7');
    inputSts = driver.findElement(By.id('validationDocInputSts.0.date'));
    text = inputSts.getText();
    expect(text).to.eventually.equal("Use date format YYYY/MM/DD");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("Use date format YYYY/MM/DD");
    input.clear();
    rmButton.click();
  });
  // verificationDoc add
  test.it('Add verificationDoc doc min', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    var addButton = driver.findElement(By.id('add.verificationDoc'));
    addButton.click();
    input = driver.findElement(By.id('verificationDocInput.0.doc'));
    var rmButton = driver.findElement(By.id('rm.verificationDoc.0'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('verificationDocInputSts.0.doc'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();

    var input = driver.findElement(By.id('verificationDocInput.0.date'));
    input.sendKeys('7');
    inputSts = driver.findElement(By.id('verificationDocInputSts.0.date'));
    text = inputSts.getText();
    expect(text).to.eventually.equal("Use date format YYYY/MM/DD");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("Use date format YYYY/MM/DD");
    input.clear();
    rmButton.click();
  });

  // versionControl
  test.it('revisionControl', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    input = driver.findElement(By.id('revisionControl'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('revisionControlInputSts'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
  });
  // recertFreq
  test.it('recertFreq', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    input = driver.findElement(By.id('recertFreq'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('recertFreqInputSts'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
  });
  // recertStatus
  test.it('recertFreq', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    input = driver.findElement(By.id('recertStatus'));
    input.sendKeys('7');
    var inputSts = driver.findElement(By.id('recertStatusInputSts'));
    var text = inputSts.getText();
    expect(text).to.eventually.equal("Minimum 4 characters");
    input.clear();
    input.sendKeys('0123456789012345678901234567890');
    text = inputSts.getText();
    expect(text).to.eventually.equal("");
    input.clear();
  });

  test.it('should logout', function() {
    // get test authentication
    driver.get("http://localhost:3000/logout");
    driver.wait(until.elementLocated(By.id("Logout complete")),3000);
  });

  // test unauthorized record adds
  test.it('should fail add a new record', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/new');
    driver.findElement(By.id('swName')).sendKeys('Software Name - 4001');
    driver.findElement(By.id('owner')).sendKeys('Software owner - 4001');
    driver.findElement(By.id('levelOfCare')).sendKeys('LOW');
    driver.findElement(By.id('status')).sendKeys('DEVEL');
    driver.findElement(By.id('statusDate')).sendKeys('7/7/1978');
    driver.findElement(By.id('releasedVersion')).sendKeys('v0.3001');
    driver.findElement(By.id('submitBtn')).click();

    driver.wait(until.elementTextContains(driver.findElement(By.id('formError')),
    'Not authorized'),5000);
  });
  // find a record and fail to update it
  test.it('should find and fail to update a record', function() {
    this.timeout(8000);
    driver.get('http://localhost:3000/#/list');
    driver.wait(until.elementLocated(By.id('swdbList_filter')), 8000)
    .findElement(By.tagName('Input'))
    .sendKeys('3001');
    driver.wait(until.elementLocated(By.linkText("Software Name - 3001")),
    8000);

    driver.findElement(By.linkText('Software Name - 3001')).click();
    driver.wait(until.titleIs('SWDB - Details'), 5000);

    driver.findElement(By.linkText('Update this document')).click();
    driver.wait(until.titleIs('SWDB - Update'), 5000);
    driver.findElement(By.id('owner')).clear();
    driver.findElement(By.id('owner')).sendKeys('NEW Owner 3001');
    driver.findElement(By.id('submitBtn')).click();
    driver.wait(until.elementTextContains(driver.findElement(By.id('formError')),
    'Not authorized'),5000);
  });

  test.after(function() {
    driver.manage().timeouts().implicitlyWait(2000);
    driver.quit();
  });
});
