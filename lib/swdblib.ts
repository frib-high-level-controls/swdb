"use strict";
// var be = require('./db');
const fs = require('fs');
const circJSON = require('circular-json');
const enumify = require('enumify');
// const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
//const swTable = JSON.parse(fs.readFileSync('./config/swData.json', 'utf8'));
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var swdb = []; // storage
var reqLog = []; // log of change requests

exports.getConfiguration = function() {
  // acquire configuration
  let props = {};
  if (fs.existsSync('./config/swdbrc')) {
    let stripJSON = require('strip-json-comments');
    props = JSON.parse(stripJSON(fs.readFileSync('./config/swdbrc', 'utf8')));
  }
  let rc = new require('rc')("swdb", props);
  return rc;
}
let props = exports.getConfiguration();



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

  this.checkSwDescDoc = function () {
    // returns true for all good
    return({ok: true, message: ""});
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
  this.version = ""; // released version
  this.platform = ""; // platform (plc, pc, etc.)
  this.versionControl = ""; // description of revision control
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

exports.newValidation = function(swNames, req) {
  req.checkBody({
    'swName': {
      notEmpty: {
        errorMessage: "Software name is required."
      },
      isString: {
        errorMessage: "Software name must be a string."
      },
      isAscii: {
        errorMessage: "Software name must be ASCII characters."
      },
      isIn: {
        options: [swNames],
        errorMessage: "Software name must be in the software name list"
      },
    },
    'version': {
      optional: true,
      isString: {
        errorMessage: "Version must be a string."
      },
      isAscii: {
        errorMessage: "Version must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Version must be 1-30 characters."
      }
    },
    'branch': {
      optional: true,
      isString: {
        errorMessage: "Branch must be a string."
      },
      isAscii: {
        errorMessage: "Branch must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Branch must be 1-30 characters."
      }
    },
    'desc': {
      optional: true,
      isString: {
        errorMessage: "Description must be a string."
      },
      isAscii: {
        errorMessage: "Description must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Description must be 0-2048 characters."
      }
    },
    'owner': {
      notEmpty: {
        errorMessage: "Owner is required."
      },
      isString: {
        errorMessage: "Owner must be a string."
      },
      isAscii: {
        errorMessage: "Owner must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Owner must be 2-30 characters."
      }
    },
    'engineer': {
      optional: true,
      isString: {
        errorMessage: "Engineer must be a string."
      },
      isAscii: {
        errorMessage: "Engineer must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Engineer must be 2-30 characters."
      }
    },
    'levelOfCare': {
      notEmpty: {
        errorMessage: "Level of care is required."
      },
      isOneOf: {
        options: [props.levelOfCareEnums],
        errorMessage: "Status must be one of "+props.levelOfCareEnums
      },
    },
    'status': {
      notEmpty: {
        errorMessage: "Status is required."
      },
      isOneOf: {
        options: [props.statusEnums],
        errorMessage: "Status must be one of "+props.statusEnums
      },
    },
    'statusDate': {
      notEmpty: {
        errorMessage: "Status date is required."
      },
      isDate: {
        errorMessage: "Status date must be a date."
      }
    },
    'platforms': {
      optional: true,
      isString: {
        errorMessage: "Platforms must be a string."
      },
      isAscii: {
        errorMessage: "Platforms must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Platforms must be 4-30 characters."
      }
    },
    'designDescDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Design description document location must be a URL."
      },
    },
    'descDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Description document location must be a URL."
      },
    },
    'vvProcLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V procedure location must be a URL."
      },
    },
    'vvResultsLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V results location must be a URL."
      },
    },
    'versionControl': {
      optional: true,
      isOneOf: {
        options: [props.rcsEnums],
        errorMessage: "Revision control must be one of "+props.rcsEnums
      },
    },
    'versionControlLoc': {
      optional: true,
      isURL: {
        errorMessage: "Version control location must be a URL."
      },
    },
    'recertFreq': {
      optional: true,
      isString: {
        errorMessage: "Recertification frequency must be a string."
      },
      isAscii: {
        errorMessage: "Recertification frequency must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification frequency must be 4-30 characters."
      }
    },
    'recertStatus': {
      optional: true,
      isString: {
        errorMessage: "Recertification status must be a string."
      },
      isAscii: {
        errorMessage: "Recertification status must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification status must be 4-30 characters."
      }
    },
    'recertDate': {
      optional: true,
      isDate: {
        errorMessage: "Recertification date must be a date."
      }
    },
    'previous': {
      optional: true,
      isAscii: {
        errorMessage: "Previous must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Previous must be 1-30 characters."
      }
    },
    'comment': {
      optional: true,
      isString: {
        errorMessage: "Comment must be a string."
      },
      isAscii: {
        errorMessage: "Comment must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Comment must be 0-2048 characters."
      }
    }
  });

};

exports.updateValidation = function(swNames, req) {
  req.checkBody({
    'swName': {
      optional: true,
      isString: {
        errorMessage: "swName must be a string."
      },
      isAscii: {
        errorMessage: "swName must be ASCII characters."
      },
      isIn: {
        options: [swNames],
        errorMessage: "Software name must be in the software name list"
      },
    },
    'version': {
      optional: true,
      isString: {
        errorMessage: "Version must be a string."
      },
      isAscii: {
        errorMessage: "Version must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Version must be 1-30 characters."
      }
    },
    'branch': {
      optional: true,
      isString: {
        errorMessage: "Branch must be a string."
      },
      isAscii: {
        errorMessage: "Branch must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Branch must be 1-30 characters."
      }
    },
    'desc': {
      optional: true,
      isString: {
        errorMessage: "Description must be a string"
      },
      isAscii: {
        errorMessage: "Description must be ASCII characters"
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Description must be 0-2048 characters"
      }
    },
    'owner': {
      optional: true,
      isString: {
        errorMessage: "Owner must be a string."
      },
      isAscii: {
        errorMessage: "Owner must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Owner must be 2-30 characters."
      }
    },
    'engineer': {
      optional: true,
      isString: {
        errorMessage: "Engineer must be a string."
      },
      isAscii: {
        errorMessage: "Engineer must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Engineer must be 2-30 characters."
      }
    },
    'levelOfCare': {
      optional: true,
      isOneOf: {
        options: [props.levelOfCareEnums],
        errorMessage: "Level of care must be one of "+props.levelOfCareEnums
      },
    },
    'status': {
      optional: true,
      isOneOf: {
        options: [props.statusEnums],
        errorMessage: "Status must be one of "+props.statusEnums
      },
    },
    'statusDate': {
      optional: true,
      isDate: {
        errorMessage: "Status date must be a date."
      }
    },
    'platforms': {
      optional: true,
      isString: {
        errorMessage: "Platforms must be a string."
      },
      isAscii: {
        errorMessage: "Platforms must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Platforms must be 4-30 characters."
      }
    },
    'designDescDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Design description document location must be a URL."
      },
    },
    'descDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Description document location must be a URL."
      },
    },
    'vvProcLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V procedure location must be a URL."
      },
    },
    'vvResultsLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V results location must be a URL."
      },
    },
    'versionControl': {
      optional: true,
      isOneOf: {
        options: [props.rcsEnums],
        errorMessage: "Revision control must be one of "+props.rcsEnums
      },
    },
    'versionControlLoc': {
      optional: true,
      isURL: {
        errorMessage: "Version control location must be a URL."
      },
    },
    'recertFreq': {
      optional: true,
      isString: {
        errorMessage: "Recertification frequency must be a string."
      },
      isAscii: {
        errorMessage: "Recertification frequency must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification frequency must be 4-30 characters."
      }
    },
    'recertStatus': {
      optional: true,
      isString: {
        errorMessage: "Recertification status must be a string."
      },
      isAscii: {
        errorMessage: "Recertification status must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification status must be 4-30 characters."
      }
    },
    'recertDate': {
      optional: true,
      isDate: {
        errorMessage: "Recertification date must be a date."
      }
    },
    'previous': {
      optional: true,
      isAscii: {
        errorMessage: "Previous must be ASCII characters"
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Previous must be 1-30 characters"
      }
    },
    'comment': {
      optional: true,
      isString: {
        errorMessage: "Comment must be a string"
      },
      isAscii: {
        errorMessage: "Comment must be ASCII characters"
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Comment must be 0-2048 characters"
      }
    }
  });
};

exports.updateSanitization = function(req) {
};
