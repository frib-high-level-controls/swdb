"use strict";
var instBe = require('./instDb.js');
const fs = require('fs');
const circJSON = require('circular-json');
const enumify = require('enumify');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
//const swTable = JSON.parse(fs.readFileSync('./config/swData.json', 'utf8'));
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

//var swdb = []; // storage
//var reqLog = []; // log of change requests


  /* This process conforms to the FRIB development process
   * see Configuration Management Plan for FRIB
   * Controls Software (FRIB-T10500-PL-000240-R001)
   * for more information.
   */

class instStatus extends enumify.Enum {}
  instStatus.initEnum(props.instStatusEnums);


//// Create a new record in the backend storage
//exports.createRecord = function (item) {
  //var existingIdx = exports.findById(item.id);
  //var err = null;
  //if (existingIdx === null) {
    //// if the record is new
    //var rec = new exports.Record(item.id, item.host, item.status, item.statusDate, item.software);
    //if (rec) {
      //// add to db
      //swdb.push(rec);
      //return;
    //} else {
      //// we got nothing back from the constructor, this is an error
      //err  = new Error("Record constructor returned invalid object");
      //err.status = 500;
      //return(err);
    //}
  //} else {
  //var existingObj = swdb[existingIdx];
    //// a record with this id exists
    //// This is an error
    //err  = new Error("Record ID exists");
    //err.status = 500;
    //return(err);
  //}
//};

//// update and existing record in the backend storage
//exports.updateRecord = function (item) {
  //var existingIdx = exports.findById(item.id);
  //if (existingIdx === null) {
    //// there is no record to update, error
    //var err  = new Error("Record not found");
    //err.status = 500;
    //return(err);
  //} else {
  //var existingObj = swdb[existingIdx];
    //// a record with this id exists
    //for (var prop in item) {
      //if (item.hasOwnProperty(prop)) {
        //// overwrite the record property with this, but not id
        //if (prop === "id") {
          //continue;
        //}
        //existingObj[prop] = item[prop];
      //}
    //}
  //}
//};

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

//exports.getItems = function (id) {
  //if (id === null) {
    //return swdb;
  //} else {
    //return(swdb[this.findById( id )]);
  //}
//};

//// remove item
//// takes an index to delete, returns the element deleted
//exports.rmItems = function (id) {
  //var err = null;
  //if (id === null) {
    //err =  new Error(`ID ${id} not found`);
    ////err.ststus(500);
    //return(err);
  //} else {
    //var idx = this.findById(id);
    //if (idx) {
      //swdb.splice(idx, 1);
      //return(null);
    //} else {
      //err =  new Error(`ID ${id} not found`);
      //return(err);
    //}
  //}
//};

//// helper function takes a string url and returns result
//exports.httpGet = function(url)
//{
  //var xmlHttp = new XMLHttpRequest();
  //xmlHttp.open( "GET", url, false ); // false for synchronous request
  //xmlHttp.send( null );
  //return xmlHttp.responseText;
//};

//// helper function to return the _id for a given swName string
//exports.getIdFromSwName = function(name){


  //var res = JSON.parse(this.httpGet("http://localhost:"+props.restPort+"/swdbserv/v1"));
  //for (var i=0, iLen=res.length; i<iLen; i++){
    //if (res[i].swName==name) return res[i]._id;
  //}
//};

exports.newValidation = function(req) {

  ////New record validation
  //req.checkBody("swName","Software Name is required").notEmpty();
  //req.checkBody("swName","Software Name must be between 2 and 30 characters")
    //.isLength({"min":2,"max":30});
  //// get the current sw names list
  //req.checkBody("swName","Software Name must be in the sw name list")
    //.isIn(swNames);

  //req.checkBody("desc","Description must an array of strings be 4-30 characters")
    //.optional().isDesc(req);

  //req.checkBody("owner","Owner is required").notEmpty();
  //req.checkBody("owner","Owner must be between 2 and 30 characters")
    //.isLength({"min":2,"max":30});
  //req.checkBody("engineer","Engineer must be between 2 and 30 characters")
    //.optional().isLength({"min":2,"max":30});
  //req.checkBody("levelOfCare","LevelOfCare is required").notEmpty();
  //req.checkBody("levelOfCare","LevelOfCare must be one of "+props.levelOfCareEnums)
    //.isOneOf(props.levelOfCareEnums);
  //req.checkBody("status","Status is required").notEmpty();
  //req.checkBody("status","Status must be one of "+props.statusEnums)
    //.isOneOf(props.statusEnums);
  //req.checkBody("statusDate","Status date is required").notEmpty();
  //req.checkBody("statusDate","Status date must be a date")
    //.isDate();
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
