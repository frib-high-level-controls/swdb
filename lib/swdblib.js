"use strict";
const fs = require('fs');
const enumify = require('enumify');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var swdb = []; // storage
var reqLog = []; // log of change requests


  /* This process conforms to the FRIB development process
   * see Configuration Management Plan for FRIB
   * Controls Software (FRIB-T10500-PL-000240-R001)
   * for more information.
   */

class levelOfCareEnum extends enumify.Enum {}
  levelOfCareEnum.initEnum(props.levelOfCareEnums);
class swStatus extends enumify.Enum {}
  swStatus.initEnum(props.statusEnums);

exports.Record = function (newId, newSwName, newOwner, newLevelOfCare, newStatus, newStatusDate) {

  // do basic checks on required fields
  if (
      (!newId) || (!newSwName) || (!newOwner) ||
      (!newLevelOfCare) || (!newStatus) || (!newStatusDate)
     ) {
        throw new Error("ID, sw name, owner, level of care, status, status date are required");
      }

  this.getId = function() {
    return this.id;
  };

  this.checkSwName = function (swName) {
    // returns true for all good
    if (/^[\d\sa-zA-Z-_\.\'\"\,]+$/.test(swName)) {
      // ok
      return({ok: true, message: ""});
    } else {
      throw new Error("Software name must be alphanimeric");
    }
  };

  this.setSwName = function( swName ) {
      if (this.checkSwName(swName).ok) {
        this.swName = swName;
      } else {
        throw new Error("Software name must be alphanimeric");
      }
  };
  this.getSwName = function() {
    return this.swName;
  };

  this.checkOwner = function (newOwner) {
    // returns true for all good
    //return({ok: true, message: ""});
    if (/^[\d\sa-zA-Z-_\.\'\"\,]+$/.test(newOwner)) {
      return({ok: true, message: ""});
    } else {
      return({ok: false, message: "Owner name must be alphanumeric"});
    }
  };

  this.setOwner = function(newOwner) {
    if (this.checkOwner().ok) {
      this.owner = newOwner;
    } else {
      throw new Error("Owner name must be alphanumeric");
    }
  };

  this.getOwner = function() {
    return this.owner;
  };

  this.checkLevelOfCare = function (newLevelOfCare) {
    // returns true for all good
    if ( levelOfCareEnum[ newLevelOfCare ] instanceof levelOfCareEnum ){
      return({ok: true, message: ""});
    } else {
      return({ok: false, message: "Invalid value"});
    }
  };

  this.setLevelOfCare = function(newLevelOfCare) {
    if (this.checkLevelOfCare( newLevelOfCare ).ok) {
      this.levelOfCare = levelOfCareEnum[ newLevelOfCare ];
    } else {
      throw new Error("Invalid value");
    }
  };
  this.getLevelOfCare = function() {
    return this.levelOfCare;
  };

  this.checkReleasedVersion = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setReleasedVersion = function(releasedVersion) {
    if (this.checkReleasedVersion().ok) {
      this.releasedVersion = releasedVersion;
    }
  };

  this.getReleasedVersion = function() {
    return this.releasedVersion;
  };

  this.checkPlatform = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setPlatform = function(platform) {
    if (this.checkPlatform().ok) {
      this.platform = platform;
    }
  };

  this.getPlatform = function() {
    return this.platform;
  };

  this.checkAuxSw = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setAuxSw = function(auxSw) {
    if (this.checkAuxSw().ok) {
      this.auxSw = auxSw;
    }
  };

  this.getAuxSw = function() {
    return this.auxSw;
  };

  this.checkSwDescDoc = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setSwDescDoc = function(swDescDoc) {
    if (this.checkSwDescDoc().ok) {
      this.swDescDoc = swDescDoc;
    }
  };

  this.getSwDescDoc = function() {
    return this.swDescDoc;
  };

  this.checkStatus = function (newStatus) {
    // returns true for all good
    if ( swStatus[ newStatus ] instanceof swStatus ){
      return({ok: true, message: ""});
    } else {
      return({ok: false, message: "Invalid value"});
    }
  };

  this.setStatus = function(newStatus) {
    if (this.checkStatus(newStatus).ok) {
      this.status = swStatus[ newStatus ];
    } else {
      throw new Error("Status value invalid");
    }
  };

  this.getStatus = function() {
    return this.status;
  };

  this.checkStatusDate = function (newDate) {
    // returns true for all good
    var nDate = Date.parse(newDate);
    if (!isNaN(nDate)){
      return({ok: true, message: ""});
    } else {
      return({ok: false, message: "Invalid value"});
    }
  };

  this.setStatusDate = function(newStatusDate) {
    if (this.checkStatusDate(newStatusDate).ok) {
      this.statusDate = new Date(newStatusDate);
    } else {
      throw new Error("Status date invalid");
    }
  };
  this.getStatusDate = function() {
    return this.statusDate;
  };

  this.checkValidationDoc = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setValidationDoc = function(validationDoc) {
    if (this.checkValidationDoc().ok) {
      this.validationDoc = validationDoc;
    }
  };

  this.getValidationDoc = function() {
    return this.validationDoc;
  };

  this.checkValidationDate = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setValidationDate = function(validationDate) {
    if (this.checkValidationDate().ok) {
      this.validationDate = validationDate;
    }
  };

  this.getValidationDate = function() {
    return this.validationDate;
  };

  this.checkVerificationDoc = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setVerificationDoc = function(verificationDoc) {
    if (this.checkVerificationDoc().ok) {
      this.verificationDoc = verificationDoc;
    }
  };

  this.getVerificationDoc = function() {
    return this.verificationDoc;
  };

  this.checkVerificationDate = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setVerificationDate = function(verificationDate) {
    if (this.checkVerificationDate().ok) {
      this.verificationDate = verificationDate;
    }
  };

  this.getVerificationDate = function() {
    return this.verificationDate;
  };

  this.checkRevisionControl = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setRevisionControl = function(revisionControl) {
    if (this.checkRevisionControl().ok) {
      this.revisionControl = revisionControl;
    }
  };

  this.getRevisionControl = function() {
    return this.revisionControl;
  };

  this.checkRecertFreq = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setRecertFreq = function(recertFreq) {
    if (this.checkRecertFreq().ok) {
      this.recertFreq= recertFreq;
    }
  };

  this.getRecertFreq = function() {
    return this.recertFreq;
  };

  this.checkRecertStatus = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setRecertStatus = function(recertStatus) {
    if (this.checkRecertStatus().ok) {
      this.recertStatus= recertStatus;
    }
  };

  this.getRecertStatus = function() {
    return this.recertStatus;
  };

  this.checkComment = function () {
    // returns true for all good
    return({ok: true, message: ""});
  };

  this.setComment = function(newComment) {
    if (this.checkComment().ok) {
      this.comment = newComment;
    }
  };

  this.getComment = function() {
    return this.comment;
  };

  this.id = newId;  // unique numeric ID
  this.setSwName(newSwName); // software name (req'd)
  this.setOwner(newOwner); // responsible party (req'd)
  this.setLevelOfCare(newLevelOfCare); //  (req'd)
  this.setStatus(newStatus); // system status (production, retired, etc) (req'd)
  this.setStatusDate(newStatusDate); // date of last status change, Date object (req'd)
  this.releasedVersion = ""; // released version
  this.platform = ""; // platform (plc, pc, etc.)
  this.auxSw = []; // list of associated sw to "generate or load" this sw
  this.swDescDoc = []; // list os sw description documents
  this.validationDoc = []; // list of documentation of validations
  this.validationDate = null; // validation Date objectx`
  this.verificationDoc = []; // list of documentation of verification
  this.verificationDate = null; // verification Date object
  this.verificationApprover = ""; // verification signer
  this.revisionControl = ""; // description of revision control
  this.recertFreq = ""; // recertification frequency
  this.recertStatus = ""; // recertification status
  this.comment = []; // comments
};

// find an ID in the backend storage and return the index
exports.findItemById = function (id) {
  for ( var i in swdb ) {
    if (swdb[i].id == id) {
      return i;
    }
  }
  return -1;
};

// encapsulate findbyid
exports.findById = function (id) {
  var item = this.findItemById(id);
  if ( item == -1 ) {
    return null;
  } else {
    return item;
  }
};

// Create a new record in the backend storage
exports.createRecord = function (item) {
  var existingIdx = exports.findById(item.id);
  var err = null;
  if (existingIdx === null) {
    // if the record is new
    var rec = new exports.Record(item.id, item.swName, item.owner, item.levelOfCare, item.status, item.statusDate);
    if (rec) {
      // add to db
      swdb.push(rec);
      return;
    } else {
      // we got nothing back from the constructor, this is an error
      err  = new Error("Record constructor returned invalid object");
      err.status = 500;
      return(err);
    }
  } else {
  var existingObj = swdb[existingIdx];
    // a record with this id exists
    // This is an error
    err  = new Error("Record ID exists");
    err.status = 500;
    return(err);
  }
};

// update and existing record in the backend storage
exports.updateRecord = function (item) {
  var existingIdx = exports.findById(item.id);
  if (existingIdx === null) {
    // there is no record to update, error
    var err  = new Error("Record not found");
    err.status = 500;
    return(err);
  } else {
  var existingObj = swdb[existingIdx];
    // a record with this id exists
    for (var prop in item) {
      if (item.hasOwnProperty(prop)) {
        // overwrite the record property with this, but not id
        if (prop === "id") {
          continue;
        }
        existingObj[prop] = item[prop];
      }
    }
  }
};

// general function to find a request ID in a request and
// return it, if available
exports.getReqId = function (req) {
  var id = null;
  if (req.url.match(/[^v][\da-fA-F]+$/) !== null) {
    var urlParts = req.url.split("/");
    id = urlParts[urlParts.length-1];
    return id;
  } else {
    return null;
  }
};

exports.getItems = function (id) {
  if (id === null) {
    return swdb;
  } else {
    return(swdb[this.findById( id )]);
  }
};

// remove item
// takes an index to delete, returns the element deleted
exports.rmItems = function (id) {
  var err = null;
  if (id === null) {
    err =  new Error(`ID ${id} not found`);
    //err.ststus(500);
    return(err);
  } else {
    var idx = this.findById(id);
    if (idx) {
      swdb.splice(idx, 1);
      return(null);
    } else {
      err =  new Error(`ID ${id} not found`);
      return(err);
    }
  }
};

// helper function takes a string url and returns result
exports.httpGet = function(url)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false ); // false for synchronous request
  xmlHttp.send( null );
  return xmlHttp.responseText;
};

// helper function to return the _id for a given swName string
exports.getIdFromSwName = function(name){


  var res = JSON.parse(this.httpGet("http://localhost:"+props.restPort+"/swdbserv/v1"));
  for (var i=0, iLen=res.length; i<iLen; i++){
    if (res[i].swName==name) return res[i]._id;
  }
};

exports.newValidation = function(req) {

  //New record validation
  req.checkBody("swName","Software Name is required").notEmpty();
  req.checkBody("swName","Software Name must be between 2 and 30 characters")
    .isLength({"min":2,"max":30});
  req.checkBody("owner","Owner is required").notEmpty();
  req.checkBody("owner","Owner must be between 2 and 30 characters")
    .isLength({"min":2,"max":30});
  req.checkBody("levelOfCare","LevelOfCare is required").notEmpty();
  req.checkBody("levelOfCare","LevelOfCare must be one of "+props.levelOfCareEnums)
    .isOneOf(props.levelOfCareEnums);
  req.checkBody("status","Status is required").notEmpty();
  req.checkBody("status","Status must be one of "+props.statusEnums)
    .isOneOf(props.statusEnums);
  req.checkBody("statusDate","Status date is required").notEmpty();
  req.checkBody("statusDate","Status date must be a date")
    .isDate();
  req.checkBody("releasedVersion","Released version must be 1-30 characters")
    .optional().isAscii().isLength({min:1,max:30});
  req.checkBody("platforms","platforms must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("auxSw","Auxilliary software must be an array of strings 4-30 characters")
    .optional().isAuxSw(req);
  req.checkBody("swDescDoc","SW desc doc must be an array of strings 4-30 characters")
    .optional().isSwDescDoc(req);
  req.checkBody("validationDoc","Validation doc must be an array of strings 4-30 characters and dates")
    .optional().isValidationDoc(req);
  req.checkBody("verificationDoc","Verification doc must be an array of strings 4-30 characters and dates")
    .optional().isVerificationDoc(req);
  req.checkBody("verificationApprover","Verification approver must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("revisionControl","Revision control must be 2-30 characters")
    .optional().isAscii().isLength({min:2,max:30});
  req.checkBody("recertFreq","Recerification frequency must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("recertStatus","Recertification status must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("comment","Comment must an array of strings be 4-30 characters")
    .optional().isComment(req);

};

exports.updateValidation = function(req) {
  //Validation
  //req.checkBody("swName","Software Name is required").notEmpty();
  req.checkBody("swName","Software Name must be between 2 and 30 characters")
    .optional().isLength({"min":2,"max":30});
  //req.checkBody("owner","Owner is required").notEmpty();
  req.checkBody("owner","Owner must be between 2 and 30 characters")
    .optional().isLength({"min":2,"max":30});
  //req.checkBody("levelOfCare","LevelOfCare is required").notEmpty();
  req.checkBody("levelOfCare","LevelOfCare must be one of "+props.levelOfCareEnums)
    .optional().isOneOf(props.levelOfCareEnums);
  //req.checkBody("status","Status is required").notEmpty();
  req.checkBody("status","Status must be one of "+props.statusEnums)
    .optional().isOneOf(props.statusEnums);
  //req.checkBody("statusDate","Status date is required").notEmpty();
  req.checkBody("statusDate","Status date must be a date")
    .optional().isDate();
  req.checkBody("releasedVersion","Released version must be 1-30 characters")
    .optional().isAscii().isLength({min:1,max:30});
  req.checkBody("platforms","platforms must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("auxSw","Auxilliary software must be an array of strings 4-30 characters")
    .optional().isAuxSw(req);
  req.checkBody("swDescDoc","SW desc doc must be an array of strings 4-30 characters")
    .optional().isSwDescDoc(req);
  req.checkBody("validationDoc","Validation doc must be an array of strings 4-30 characters and dates")
    .optional().isValidationDoc(req);
  req.checkBody("verificationDoc","Verification doc must be an array of strings 4-30 characters and dates")
    .optional().isVerificationDoc(req);
  req.checkBody("verificationApprover","Verification approver must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("revisionControl","Revision control must be 2-30 characters")
    .optional().isAscii().isLength({min:2,max:30});
  req.checkBody("recertFreq","Recerification frequency must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("recertStatus","Recertification status must be 4-30 characters")
    .optional().isAscii().isLength({min:4,max:30});
  req.checkBody("comment","Comment must an array of strings be 4-30 characters")
    .optional().isComment(req);
};


exports.updateSanitization = function(req) {
  //Validation
  // if (req.body.swName) {
  //   req.sanitize("swName").trim();
  // }
  // if (req.body.owner) {
  //   req.sanitize("owner").trim();
  // }
  // console.log("before"+req.body.statusDate);
  // if (req.body.statusData) {
  //   console.log("before"+req.body.statusDate);
  //   req.sanitize("statusDate").toDate();
  //   console.log("after"+JSON.stringify(req.body.statusDate));
  // }
  // console.log("after"+JSON.stringify(req.body.statusDate));
  // if (req.body.releasedVersion) {
  //   req.sanitize("releasedVersion").strip();
  // }
  // console.log("auxSw req.body:"+JSON.stringify(req.body));
  // if (req.body.platforms) {
  //   req.sanitize("platforms").strip();
  // }
  // console.log("auxSw req.body:"+req.body);
  //  if (req.body.auxSw) {
  //    req.body.auxSw.forEach(function(element, idx) {
  //      console.log("before"+req.body.auxSw[idx]);
  //      //req.body.auxSw[idx].trim();
  //      console.log("after"+JSON.stringify(req.body.auxSw[idx]));
  //    });
  //  }
  // if (req.body.auxSw) {
  //   req.swDescDoc.forEach(function(element, idx) {
  //     req.sanitize("swDescDoc[idx]").strip();
  //   });
  // }
  //   .optional().isSwDescDoc(req);
  // req.checkBody("validationDoc","Validation doc must be an array of strings 4-30 characters and dates")
  //   .optional().isValidationDoc(req);
  // req.checkBody("verificationDoc","Verification doc must be an array of strings 4-30 characters and dates")
  //   .optional().isVerificationDoc(req);
  // req.checkBody("verificationApprover","Verification approver must be 4-30 characters")
  //   .optional().isAscii().isLength({min:4,max:30});
  // req.checkBody("revisionControl","Revision control must be 2-30 characters")
  //   .optional().isAscii().isLength({min:2,max:30});
  // req.checkBody("recertFreq","Recerification frequency must be 4-30 characters")
  //   .optional().isAscii().isLength({min:4,max:30});
  // req.checkBody("recertStatus","Recertification status must be 4-30 characters")
  //   .optional().isAscii().isLength({min:4,max:30});
  // req.checkBody("comment","Comment must an array of strings be 4-30 characters")
  //   .optional().isComment(req);
};
