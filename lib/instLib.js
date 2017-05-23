/* jslint node: true */
"use strict";
var util = require('util');
var instBe = require('./instDb.js');
const fs = require('fs');
const circJSON = require('circular-json');
const enumify = require('enumify');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = require('request');

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

// go get ccdb slot info on behalf of browsers
exports.getSlot = function (req, res, next) {
  request({
    url: props.ccdbApiUrl+"/slot",
    strictSSL: false,
    headers: {
      Accept: 'application/json',
      'DISCS-Authorization': "key:pass"
    },
    timeout: 5 * 1000
  }, function (error, response, body) {
    if (error) {
      console.error(error);
    } else {
      if (response.statusCode === 200) {
        res.send(body);
      }
    }
  });
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
  //req.checkBody("DRRs","DRRs document location must be a string")
    //.optional().isLength("");
};

exports.updateValidation = function(req) {
  //Update record validation
  req.checkBody("host","Host name is required").optional().notEmpty();
  req.checkBody("host","Host name must be between 2 and 30 characters").optional()
    .isLength({"min":2,"max":30});
  //area
  req.checkBody("area","Area must be a URL").optional().isAreas(req);
  //area
  req.checkBody("slots","Slots must be a list of URLs")
    .optional().isSlots(req);
  //software
  req.checkBody("software","SWDB software reference is required").optional().notEmpty();
  req.checkBody("software","SWDB reference must be 24 hex characters").optional()
    .isLength({"min":24,"max":24}).isHexadecimal();
  //vvResultLoc
  req.checkBody("vvResultsLoc","V&V results document location must be a URL")
    .optional().isURL();
  //DRRs
  req.checkBody("DRRs","DRRs document location must be a string")
    .optional().isLength();
};


exports.updateSanitization = function(req) {
};
