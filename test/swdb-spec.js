var app = require("../server");
var expect = require("chai").expect;
var supertest = require("supertest")(app);
var tools = require("../lib/swdblib");
var be = require("../lib/db");
var expect2 = require("expect");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var testLogin = function(request, done) {
  console.log('Login start');
  supertest
  .get("/login?username=testuser&password=testuserpasswd")
  .send(testAcct)
  .expect(200)
  .end(function(err,res){
    console.log('Login complete');
    agent.saveCookies(res);
    done();
  });
};

// clear the test collection before and after tests suite
before(function(done) {
  // clear the test collection
  be.swDoc.db.collections.swdbs.drop();
  //app.listen(3000);
  done();
});
after(function(done) {
  // clear the test collection
  be.swDoc.db.collections.swdbs.drop();
  done();
});

var Cookies;
//
describe("app", function() {
  before("login as test user", function(done){
    supertest
    .get("/login?username=testuser&password=testuserpasswd")
    .expect(200)
    .end(function(err,res){
      Cookies = res.headers['set-cookie'].pop().split(';')[0];
      //console.log('Login complete. Cookie: '+Cookies);
      done();
    });
  });

  // web facing tests
  //
  it("Respond with welcome", function(done) {
    supertest
    .get("/")
    .expect(200)
    .end(function(err, res){
      //console.log(res.res.text);
      expect(res.res.text).to.match(/SWDB \(Prototype Interface\)/);
      done(err);
    });
  });
  it("Returns all records", function(done) {
    supertest
    .get("/swdbserv/v1")
    .expect(200)
    .end(function(err, res){
      expect(res.text).to.match(/\[*\]/);
      done();
    });
  });
  it("Post a new record", function(done) {
    supertest
    .post("/swdbserv/v1/")
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .send({swName: "test1000", owner: "Owner 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: "date 1000"})
    .expect(201)
    .end(done);
  });

  it("Errors posting a duplicate new record", function(done) {
    //be.swDoc.db.collections.swdbs.drop();
    supertest
    .post("/swdbserv/v1/")
    .send({swName: "test1000", owner: "Owner 1000", levelOfCare: "LOW", status: "DEVEL", statusDate: "date 1000"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(500)
    .expect('There was a duplicate key error')
    .end();
    done();
  });

  it("Post a new record test1002", function(done) {
    supertest
    .post("/swdbserv/v1/")
    .send({swName: "test1002", owner: "Owner 1002", levelOfCare: "LOW",
    status: "DEVEL", statusDate: "date 1002"})
    .set("Accept", "application/json")
    .set('Cookie', [Cookies])
    .expect(201)
    .end(done);
  });

  describe('get id for test1000', function() {
    var wrapper = {origId:null};
    before("Get ID record id:1000", function(done) {
      //var origId = tools.getIdFromSwName("test1000");
      supertest
      .get("/swdbserv/v1")
      .expect(200)
      .end(function(err,res){
        res=JSON.parse(res.text);
        for (var i=0, iLen=res.length; i<iLen; i++){
          if (res[i].swName=="test1000") wrapper.origId=res[i]._id;
        }
        done();
      });
    });

    it("Returns test record id:1000", function(done) {
      supertest
      .get("/swdbserv/v1/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        expect(res.body).to.have.property("_id");
        expect(res.body.swName).to.equal("test1000");
        expect(res.body._id).to.match(/.{24}/);
        expect(res.body.__v).to.match(/\d+/);
        done();
      });
    });
    // it("Deletes test record id:1000", function(done) {
    //   supertest
    //   .delete("/swdbserv/v1/"+wrapper.origId)
    //   .expect(200)
    //   .end(done);
    // });
    // it("Returns empty record list id:1000", function(done) {
    //   supertest
    //   .get("/swdbserv/v1/"+wrapper.origId)
    //   .expect(200)
    //   .expect('')
    //   .end(done);
    // });
  });


  describe('get id for test1002', function() {
    var wrapper = {origId:null};
    before("Get ID record id:1002", function(done) {
      supertest
      .get("/swdbserv/v1")
      .expect(200)
      //var origId = tools.getIdFromSwName("test1000");
      .end(function(err,res){
        res=JSON.parse(res.text);
        for (var i=0, iLen=res.length; i<iLen; i++){
          if (res[i].swName=="test1002"){
            wrapper.origId=res[i]._id;
          }
        }
        done();
      });
    });

    it("Can update a record via PUT swName id:1002", function(done) {
      supertest
      .put("/swdbserv/v1/"+wrapper.origId)
      .send({swName: "Test name 1002"})
    .set('Cookie', [Cookies])
      .expect(200)
      .end(done);
    });
    it("Returns test record 1d:1002", function(done) {
      supertest
      .get("/swdbserv/v1/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        expect(res.body).to.have.property("_id");
        //expect(res.body._id).to.equal(wrapper.origId);
        expect(res.body.swName).to.equal("Test name 1002");
        done();
      });
    });

    // This table lists test requests to make and the expected
    // responses.
    // {req:{msg:,url:,type:,err{status:}}
    //  res:{msg:,url:,type:,err{status:}}
    //  }
    var testUpdateParams = [
      {"type": "PUT", "req": {"msg": {"swName": "New test name 1002"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET", "res": {"msg": {"swName": "New test name 1002"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"owner": "New test owner 1002"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"owner": "New test owner 1002"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"levelOfCare": "MEDIUM"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"levelOfCare": "MEDIUM"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"levelOfCare": "ERRONEOUS_VALUE"},"url": "/swdbserv/v1/", "err": {"status": 400}}},
      {"type": "GET","res": {"msg": {"levelOfCare": "MEDIUM"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"status": "RDY_INSTALL"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"status": "RDY_INSTALL"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"status": "ERRONEOUS_VALUE"},"url": "/swdbserv/v1/", "err": {"status": 400}}},
      {"type": "GET","res": {"msg": {"status": "RDY_INSTALL"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"statusDate": "7/7/1977"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"statusDate": "1977-07-07T07:00:00.000Z"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"releasedVersion": "NEW test version"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"releasedVersion": "NEW test version"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"platforms": "NEW test platform"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"platforms": "NEW test platform"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"auxSw": ["NEW aux sw 1","aux sw 2","aux sw 3"]},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"auxSw": ["NEW aux sw 1","aux sw 2","aux sw 3"]},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"req": {"msg": {"swDescDoc": ["NEW sw desc 1","sw desc 2","sw desc 3"]},"url": "/swdbserv/v1/","type": "PUT", "err": {"status": 200}}},
      {"res": {"msg": {"swDescDoc": ["NEW sw desc 1","sw desc 2","sw desc 3"]},"url": "/swdbserv/v1/", "type": "GET", "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"validationDoc": [{"doc": "NEW validation doc1","date": "7/7/77"},{"doc": "NEW validation doc 2","date": "7/7/79"}]},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"validationDoc": [{"doc": "NEW validation doc1","date": "1977-07-07T07:00:00.000Z"},{"doc": "NEW validation doc 2","date": "1979-07-07T07:00:00.000Z"}]},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"verificationDoc": [{"doc": "NEW verification doc1","date": "7/7/77"}, {"doc": "NEW verification doc 2","date": "7/7/79"}]},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"verificationDoc": [{"doc": "NEW verification doc1","date": "1977-07-07T07:00:00.000Z","_id": /.{24}/},{"doc": "NEW verification doc 2","date": "1979-07-07T07:00:00.000Z"}]},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"verificationApprover": "NEW test approver"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"verificationApprover": "NEW test approver"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"revisionControl": "NEW revision control"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"revisionControl": "NEW revision control"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"recertFreq": "NEW test recert frequency"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"recertFreq": "NEW test recert frequency"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"recertStatus": "NEW test recert status"},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"recertStatus": "NEW test recert status"},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      {"type": "PUT","req": {"msg": {"comment": ["NEW test comment"]},"url": "/swdbserv/v1/", "err": {"status": 200}}},
      {"type": "GET","res": {"msg": {"comment": ["NEW test comment"]},"url": "/swdbserv/v1/",  "err": {"status": 200}}},
      // test new swName is required, min, max
      {"type":"POST", "req": {"msg": {"owner": "test owner"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"swName","msg":"Software Name is required"}'}}},
      {"type":"POST", "req": {"msg": {"swName": "t"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swName","msg":"Software Name must be between 2 and 30 characters"'}}},
      {"type":"POST", "req": {"msg": {"swName": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swName","msg":"Software Name must be between 2 and 30 characters"'}}},
      // test nwe owner required, min, max
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"owner","msg":"Owner is required"}'}}},
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"owner","msg":"Owner must be between 2 and 30 characters"'}}},
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name","owner": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"owner","msg":"Owner must be between 2 and 30 characters"'}}},
      // test levelOfCare required, enumerated
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner":"NEW OWNER"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"levelOfCare","msg":"LevelOfCare is required"}'}}},
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner":"NEW OWNER", "levelOfCare": "LOW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status is required"}'}}},
      {"type":"POST", "req": {"msg": {"swName": "NEW Test name", "owner":"NEW OWNER", "levelOfCare": "LOW","status":"DEVEL"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"statusDate","msg":"Status date is required"}'}}},
      // test new status enumerated
      {"type":"POST", "req": {"msg": {"status": "not-enumerated"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status must be one of DEVEL,RDY_INSTALL,RDY_INT_TEST,RDY_BEAM,RETIRED","value":"not-enumerated"}'}}},
      // test new statusDate with non-date
      {"type":"POST", "req": {"msg": {"swName":"testing","owner":"test owner","levelOfCare":"LOW","status":"DEVEL","statusDate": "non-date"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"statusDate","msg":"Status date must be a date","value":"non-date"}'}}},
      // test new releasedVersion min, max
      {"type":"POST", "req": {"msg": {"releasedVersion": ""}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"releasedVersion","msg":"Released version must be 1-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"releasedVersion": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"releasedVersion","msg":"Released version must be 1-30 characters"'}}},
      // test new platforms min, max
      {"type":"POST", "req": {"msg": {"platforms": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"platforms must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"platforms": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"platforms must be 4-30 characters"'}}},
      // test new auxSw
      {"type":"POST", "req": {"msg": {"auxSw": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw","msg":"Auxilliary software must be an array of strings 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"auxSw": ["NE"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw[0]","msg":"Auxilliary SW field 0 must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"auxSw": ["0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw[0]","msg":"Auxilliary SW field 0 must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"auxSw": ["this is okay","also okay","0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw[2]","msg":"Auxilliary SW field 2 must be 4-30 characters"'}}},
      // test new swDescDoc
      {"type":"POST", "req": {"msg": {"swDescDoc": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc","msg":"SW desc doc must be an array of strings 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"swDescDoc": ["NE"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc[0]","msg":"SW description doc 0 must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"swDescDoc": ["0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc[0]","msg":"SW description doc 0 must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"swDescDoc": ["this is okay","also okay","0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc[2]","msg":"SW description doc 2 must be 4-30 characters"'}}},
      // test new validationDoc
       {"type":"POST", "req": {"msg": {"validationDoc": ""}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc","msg":"Validation doc must be an array of strings 4-30 characters and dates"'}}},
       {"type":"POST", "req": {"msg": {"validationDoc": [{"doc": "NEW validation doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc[0].date","msg":"Validation doc 0 date must be a date"'}}},
       {"type":"POST", "req": {"msg": {"validationDoc": [{"doc": "NEW","date": "7/7/77"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc[0].doc","msg":"Validation doc 0 must be 4-30 characters"'}}},
       {"type":"POST", "req": {"msg": {"validationDoc": [{"doc": "NEW validation doc1","date": "7/7/77"},{"doc": "NEW validation doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc[1].date","msg":"Validation doc 1 date must be a date"'}}},
      // test new verificationDoc
       {"type":"POST", "req": {"msg": {"verificationDoc": ""}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc","msg":"Verification doc must be an array of strings 4-30 characters and dates"'}}},
       {"type":"POST", "req": {"msg": {"verificationDoc": [{"doc": "NEW verification doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc[0].date","msg":"Verification doc 0 date must be a date"'}}},
       {"type":"POST", "req": {"msg": {"verificationDoc": [{"doc": "NEW","date": "7/7/77"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc[0].doc","msg":"Verification doc 0 must be 4-30 characters"'}}},
       {"type":"POST", "req": {"msg": {"verificationDoc": [{"doc": "NEW verification doc1","date": "7/7/77"},{"doc": "NEW validation doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc[1].date","msg":"Verification doc 1 date must be a date"'}}},
      // test new verificationApprover min, max
      {"type":"POST", "req": {"msg": {"verificationApprover": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"verificationApprover","msg":"Verification approver must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"verificationApprover": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"verificationApprover","msg":"Verification approver must be 4-30 characters"'}}},
      // test new revisionControl min, max
      {"type":"POST", "req": {"msg": {"revisionControl": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"revisionControl","msg":"Revision control must be 2-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"revisionControl": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"revisionControl","msg":"Revision control must be 2-30 characters"'}}},
      // test new recertFreq min, max
      {"type":"POST", "req": {"msg": {"recertFreq": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recerification frequency must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"recertFreq": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recerification frequency must be 4-30 characters"'}}},
      // test new recertStatus min, max
      {"type":"POST", "req": {"msg": {"recertStatus": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"recertStatus": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 4-30 characters"'}}},
      // test new comment
      {"type":"POST", "req": {"msg": {"comment": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment","msg":"Comment must an array of strings be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"comment": ["NE"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment[0]","msg":"Comment 0 must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"comment": ["0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment[0]","msg":"Comment 0 must be 4-30 characters"'}}},
      {"type":"POST", "req": {"msg": {"comment": ["this is okay","also okay","0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment[2]","msg":"Comment 2 must be 4-30 characters"'}}},

      // test update swName min, max
      {"type":"PUT", "req": {"msg": {"swName": "t"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swName","msg":"Software Name must be between 2 and 30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"swName": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swName","msg":"Software Name must be between 2 and 30 characters"'}}},
      // test update owner min, max
      {"type":"PUT", "req": {"msg": {"swName": "NEW Test name", "owner": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"owner","msg":"Owner must be between 2 and 30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"swName": "NEW Test name","owner": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"owner","msg":"Owner must be between 2 and 30 characters"'}}},
      // test update levelOfCare enumerated
      {"type":"PUT", "req": {"msg": {"levelOfCare": "not-enumerated"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"levelOfCare","msg":"LevelOfCare must be one of NONE,LOW,MEDIUM,HIGH","value":"not-enumerated"}'}}},
      // test update status enumerated
      {"type":"PUT", "req": {"msg": {"status": "not-enumerated"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"status","msg":"Status must be one of DEVEL,RDY_INSTALL,RDY_INT_TEST,RDY_BEAM,RETIRED","value":"not-enumerated"}'}}},
      // test update statusDate with non-date
      {"type":"PUT", "req": {"msg": {"statusDate": "non-date"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '{"param":"statusDate","msg":"Status date must be a date","value":"non-date"}'}}},
      // test update releasedVersion min, max
      {"type":"PUT", "req": {"msg": {"releasedVersion": ""}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"releasedVersion","msg":"Released version must be 1-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"releasedVersion": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"releasedVersion","msg":"Released version must be 1-30 characters"'}}},
      // test update platforms min, max
      {"type":"PUT", "req": {"msg": {"platforms": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"platforms must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"platforms": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"platforms","msg":"platforms must be 4-30 characters"'}}},
      // test update auxSw
      {"type":"PUT", "req": {"msg": {"auxSw": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw","msg":"Auxilliary software must be an array of strings 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"auxSw": ["NE"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw[0]","msg":"Auxilliary SW field 0 must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"auxSw": ["0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw[0]","msg":"Auxilliary SW field 0 must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"auxSw": ["this is okay","also okay","0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"auxSw[2]","msg":"Auxilliary SW field 2 must be 4-30 characters"'}}},
      // test update swDescDoc
      {"type":"PUT", "req": {"msg": {"swDescDoc": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc","msg":"SW desc doc must be an array of strings 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"swDescDoc": ["NE"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc[0]","msg":"SW description doc 0 must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"swDescDoc": ["0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc[0]","msg":"SW description doc 0 must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"swDescDoc": ["this is okay","also okay","0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"swDescDoc[2]","msg":"SW description doc 2 must be 4-30 characters"'}}},
      // test update validationDoc
       {"type":"PUT", "req": {"msg": {"validationDoc": ""}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc","msg":"Validation doc must be an array of strings 4-30 characters and dates"'}}},
       {"type":"PUT", "req": {"msg": {"validationDoc": [{"doc": "NEW validation doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc[0].date","msg":"Validation doc 0 date must be a date"'}}},
       {"type":"PUT", "req": {"msg": {"validationDoc": [{"doc": "NEW","date": "7/7/77"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc[0].doc","msg":"Validation doc 0 must be 4-30 characters"'}}},
       {"type":"PUT", "req": {"msg": {"validationDoc": [{"doc": "NEW validation doc1","date": "7/7/77"},{"doc": "NEW validation doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"validationDoc[1].date","msg":"Validation doc 1 date must be a date"'}}},
      // test update verificationDoc
       {"type":"PUT", "req": {"msg": {"verificationDoc": ""}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc","msg":"Verification doc must be an array of strings 4-30 characters and dates"'}}},
       {"type":"PUT", "req": {"msg": {"verificationDoc": [{"doc": "NEW verification doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc[0].date","msg":"Verification doc 0 date must be a date"'}}},
       {"type":"PUT", "req": {"msg": {"verificationDoc": [{"doc": "NEW","date": "7/7/77"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc[0].doc","msg":"Verification doc 0 must be 4-30 characters"'}}},
       {"type":"PUT", "req": {"msg": {"verificationDoc": [{"doc": "NEW verification doc1","date": "7/7/77"},{"doc": "NEW validation doc1","date": "trash"}]}, "url": "/swdbserv/v1/",
       "err": {"status": 400, "msgHas": '"param":"verificationDoc[1].date","msg":"Verification doc 1 date must be a date"'}}},
      // test update verificationApprover min, max
      {"type":"PUT", "req": {"msg": {"verificationApprover": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"verificationApprover","msg":"Verification approver must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"verificationApprover": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"verificationApprover","msg":"Verification approver must be 4-30 characters"'}}},
      // test update revisionControl min, max
      {"type":"PUT", "req": {"msg": {"revisionControl": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"revisionControl","msg":"Revision control must be 2-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"revisionControl": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"revisionControl","msg":"Revision control must be 2-30 characters"'}}},
      // test update recertFreq min, max
      {"type":"PUT", "req": {"msg": {"recertFreq": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recerification frequency must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"recertFreq": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertFreq","msg":"Recerification frequency must be 4-30 characters"'}}},
      // test update recertStatus min, max
      {"type":"PUT", "req": {"msg": {"recertStatus": "N"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"recertStatus": "0123456789012345678901234567890"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"recertStatus","msg":"Recertification status must be 4-30 characters"'}}},
      // test update comment
      {"type":"PUT", "req": {"msg": {"comment": "NEW"}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment","msg":"Comment must an array of strings be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"comment": ["NE"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment[0]","msg":"Comment 0 must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"comment": ["0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment[0]","msg":"Comment 0 must be 4-30 characters"'}}},
      {"type":"PUT", "req": {"msg": {"comment": ["this is okay","also okay","0123456789012345678901234567890"]}, "url": "/swdbserv/v1/",
      "err": {"status": 400, "msgHas": '"param":"comment[2]","msg":"Comment 2 must be 4-30 characters"'}}},
    ];

    // go through the table and check the given parameters
    testUpdateParams.forEach(function(value,i) {
      //handle PUT
      if (value.type === "PUT") {
        it(value.req.err.status+" "+value.type+" msg: "+
        JSON.stringify(JSON.stringify(value.req.msg)), function(done) {
          //console.log("PUT to"+value.req.url+wrapper.origId);
          supertest
          .put(value.req.url+wrapper.origId)
          .send(value.req.msg)
          .set('Cookie', [Cookies])
          .expect(value.req.err.status)
          .end(function(err,res){
            if (value.req.err.msgHas) {
              expect2(res.text).toMatch(value.req.err.msgHas);
            }
            done();
          });
        });
      }
      if (value.type === "POST") {
        it(value.req.err.status+" "+value.type+" "+JSON.stringify(JSON.stringify(value.req.msg)), function(done) {
          supertest
          .post(value.req.url)
          .send(value.req.msg)
          .set('Cookie', [Cookies])
          .expect(value.req.err.status)
          .end(function(err,res){
            if (value.req.err.msgHas) {
              expect2(res.text).toMatch(value.req.err.msgHas);
            }
            done();
          });
        });
      }

      // handle GET
      if (value.type === "GET") {
        it(value.res.err.status+" "+JSON.stringify(value.res.msg), function(done) {
          supertest
          .get(value.res.url+wrapper.origId)
          .expect(value.res.err.status)
          .end(function(err, res) {
            for (var prop in value.res.msg) {
              //console.log("res.body."+prop+":"+res.body[prop]+"  "+
              //  "value.res.msg."+prop+":"+value.res.msg[prop]);
              expect(res.body).to.have.property(prop);
              // This is to allow sloppy matching on whole objects.
              // See the npm "expect" module for more
              expect2(res.body[prop]).toMatch(value.res.msg[prop]);
            }
            done();
          });
        });
      }
    });
    it("Can update a record via PATCH auxSw id:1002", function(done) {
      supertest
      .patch("/swdbserv/v1/"+wrapper.origId)
      .set('Cookie', [Cookies])
      .send({auxSw: ["aux sw 1","aux sw 2","aux sw 3"]})
      .expect(200)
      .end(done);
    });
    it("Returns updated test record 1d:1002", function(done) {
      supertest
      .get("/swdbserv/v1/"+wrapper.origId)
      .expect(200)
      .end(function(err, res){
        expect(res.body).to.have.property("_id");
        expect(res.body._id).to.equal(wrapper.origId);
        expect(res.body.auxSw).to.deep.equal(["aux sw 1","aux sw 2","aux sw 3"]);
        done();
      });
    });

    it("Errors on update a nonexistant record via PUT swName id:badbeef", function(done) {
      supertest
      .put("/swdbserv/v1/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test name 1000"})
      .expect(500)
      .expect('Record not found')
      .end(done);
    });
    it("Errors on update a nonexistant record via PATCH swName id:badbeef", function(done) {
      supertest
      .patch("/swdbserv/v1/badbeef")
      .set('Cookie', [Cookies])
      .send({swName: "Test name 1000"})
      .expect(500)
      .expect('Record not found')
      .end(done);
    });
  });
});
