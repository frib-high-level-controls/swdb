/* jslint node: true */
"use strict";
var util = require('util');
var instBe = require('./instDb.js');
const fs = require('fs');
const circJSON = require('circular-json');
const enumify = require('enumify');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


  /* This process conforms to the FRIB development process
   * see Configuration Management Plan for FRIB
   * Controls Software (FRIB-T10500-PL-000240-R001)
   * for more information.
   */

class instStatus extends enumify.Enum {}
  instStatus.initEnum(props.instStatusEnums);


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


exports.newValidation = function(req) {

  //New record validation
  req.checkBody("host","Host name is required").notEmpty();
  req.checkBody("host","Host name must be between 2 and 30 characters")
    .isLength({"min":2,"max":30});
  //area
  req.checkBody("area","Area must be a URL").optional().isAreas(req);
  //area
  req.checkBody("slots","Slots must be a list of URLs")
    .optional().isSlots(req);
  //software
  req.checkBody("software","SWDB software reference is required").notEmpty();
  req.checkBody("software","SWDB reference must be 24 hex characters")
    .isLength({"min":24,"max":24}).isHexadecimal();
  //vvResultLoc
  req.checkBody("vvResultsLoc","V&V results document location must be a URL")
    .optional().isURL();
  //DRRs
  req.checkBody("DRRs","DRRs document location must be a URL")
    .optional().isURL();
};

exports.updateValidation = function(req) {
  ////Validation
  //req.checkBody("swName","Software Name must be between 2 and 30 characters")
    //.optional().isLength({"min":2,"max":30});
  //req.checkBody("swName","Software Name must be in the sw name list")
    //.optional().isIn(swNames);
  //req.checkBody("desc","Description must an array of strings be 4-30 characters")
    //.optional().isDesc(req);
  //req.checkBody("owner","Owner must be between 2 and 30 characters")
    //.optional().isLength({"min":2,"max":30});
  //req.checkBody("engineer","Engineer must be between 2 and 30 characters")
    //.optional().isLength({"min":2,"max":30});
  //req.checkBody("levelOfCare","LevelOfCare must be one of "+props.levelOfCareEnums)
    //.optional().isOneOf(props.levelOfCareEnums);
  //req.checkBody("status","Status must be one of "+props.statusEnums)
    //.optional().isOneOf(props.statusEnums);
  //req.checkBody("statusDate","Status date must be a date")
    //.optional().isDate();
  //req.checkBody("version","Version must be 1-30 characters")
    //.optional().isAscii().isLength({min:1,max:30});
  //req.checkBody("branch","Branch must be 1-30 characters")
    //.optional().isAscii().isLength({min:1,max:30});
  //req.checkBody("platforms","platforms must be 4-30 characters")
    //.optional().isAscii().isLength({min:4,max:30});
  //req.checkBody("designDescDocLoc","Design description document location must be a URL")
    //.optional().isURL();
  //req.checkBody("descDocLoc","Description document location must be a URL")
    //.optional().isURL();
  //req.checkBody("vvProcLoc","V&V procedure location control must be a URL")
    //.optional().isURL();
  //req.checkBody("vvResultsLoc","V&V results location control must be a URL")
    //.optional().isURL();
  //req.checkBody("versionControl","Revision control must be one of "+props.rcsEnums)
    //.optional().isOneOf(props.rcsEnums);
  //req.checkBody("versionControlLoc","Version control location control must be a URL")
    //.optional().isURL();
  //req.checkBody("recertFreq","Recerification frequency must be 4-30 characters")
    //.optional().isAscii().isLength({min:4,max:30});
  //req.checkBody("recertStatus","Recertification status must be 4-30 characters")
    //.optional().isAscii().isLength({min:4,max:30});
  //req.checkBody("recertDate","Recertification date must be a date")
    //.optional().isDate();
  //req.checkBody("previous","Previous version reference must be 1-30 characters")
    //.optional().isAscii().isLength({min:1,max:30});
  //req.checkBody("comment","Comment must an array of strings be 4-30 characters")
    //.optional().isComment(req);
};


exports.updateSanitization = function(req) {
};
