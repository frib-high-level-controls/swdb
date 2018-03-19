import express = require('express');
import expressSession = require('express-session');
import expressValidator = require('express-validator');
import cJSON = require('circular-json');
import validate = require('validate.js');
import dbg = require('debug');
import Be = require('./Db');
import commonTools = require('./CommonTools');
import mongodb = require('mongodb');
import  mongoose = require('mongoose');
let objectID = mongodb.ObjectID;
const tools = new commonTools.CommonTools();
const props = tools.getConfiguration();
const debug = dbg('swdb:validators');

export class CustomValidators {
  public static vals = {
    customValidators: {
      isOneOf: function (str: string, arr: any[]) {
        return (arr.indexOf(str) > -1);
      },
      isInEnum: function (str: string, e: any) {
        if (str in e) {
          return true;
        } else {
          return false;
        }
      },
      isArea: function (val: string, req: express.Request) {
        // Must be an array of strings
        let result: string[] = [];
        if (Array.isArray(val)) {
          debug('body is ' + cJSON.stringify(req.body, null, 2));
          debug('val is ' + cJSON.stringify(val, null, 2));
          val.forEach(function (element, idx, arr) {
            let thisResult = validate.isString(element);
            // debug('validation for element: ' + thisResult);
            if (!thisResult) {
              // record all failed fields
              result.push(String(element) + ' must be a string');
            }
          });
          return true;
        } else {
          return false;
        }
      },
      isVvProcLoc: function (val: string, req: express.Request) {
        /* Case 1: The string is not a json array
         * Case 2: The Strins is an array, but the listed items are not valid urls.
         * Case 3: The string is an arra and all listed items are valif urls
         */
        let result: string[] = [];
        if (Array.isArray(val)) {
          debug('body is ' + cJSON.stringify(req.body, null, 2));
          val.forEach(function (element: string, idx: number, arr: any[]) {
            debug('checking element ' + element);
            debug('checking element(by index) ' + req.body.vvProcLoc[idx]);
            let thisResult = validate.validate({ website: element },
              {
                website: { url: true },
              });
            // debug('validation for element: ' + thisResult);
            if (thisResult) {
              // record all failed fields
              result.push(thisResult);
            }
          });
          debug('vals: ' + JSON.stringify(result, null, 2));
          // debug('#vals: ' + result.length);
          if (result.length !== 0) {
            return false; // Case 2
          } else {
            return true; // Case 3
          }
        } else {
          return false; // Case 1
        }
      },
      isVvResultsLoc: function (val: string, req: express.Request) {
        /* Case 1: The string is not a json array
         * Case 2: The Strins is an array, but the listed items are not valid urls.
         * Case 3: The string is an arra and all listed items are valif urls
         */
        let result: string[] = [];
        if (Array.isArray(val)) {
          debug('body is ' + cJSON.stringify(req.body, null, 2));
          val.forEach(function (element: string, idx: number, arr: any[]) {
            debug('checking element ' + element);
            debug('checking element(by index) ' + req.body.vvResultsLoc[idx]);
            let thisResult = validate.validate({ website: element },
              {
                website: { url: true },
              });
            // debug('validation for element: ' + thisResult);
            if (thisResult) {
              // record all failed fields
              result.push(thisResult);
            }
          });
          debug('vals: ' + JSON.stringify(result, null, 2));
          // debug('#vals: ' + result.length);
          if (result.length !== 0) {
            return false; // Case 2
          } else {
            return true; // Case 3
          }
        } else {
          return false; // Case 1
        }
      },
      isSlots: function (val: any[], req: express.Request) {
        // Must be an array of strings
        if (Array.isArray(val)) {
          val.forEach(function (element: any, idx: number, arr: any[]) {
            req.checkBody('slots[' + idx + ']',
              'Slot ' + idx + ' must be a string')
              .optional().isAscii();
          });
          return true;
        } else {
          return false;
        }
      },
      isDRRs: function (val: any[], req: express.Request) {
        // Must be a string
        if (Array.isArray(val)) {
          val.forEach(function (element: any, idx: number, arr: any[]) {
            req.checkBody('slots[' + idx + ']',
              'DRR ' + idx + ' must be a string')
              .optional().isAscii();
          });
          return true;
        } else {
          return false;
        }
      },
      isString: function (val: any) {
        if (typeof val === 'string') {
          return true;
        } else {
          return false;
        }
      },

    },
  };

  public static swUpdateWorkflowValidation = async function(req: express.Request, be) {
    // get the id of the record which is wanting update
    // go get the existing record
    let id = req.params.id;
    try {
      let idObj = new mongoose.mongo.ObjectId(req.params.id);
    } catch (err) {
      return {
        error: true,
        data: 'Record id parse err: ' + id + ': ' + JSON.stringify(err),
      };
    }
    try {
      let queryPromise = await Be.Db.swDoc.findOne({ _id: id }).exec();
      // if old status was Ready for install
      // first, see if there was eve a  record to update
      if (!queryPromise){
        return {
          error: true,
          data: 'Record id not found' + id,
        };
      }
      if (queryPromise.status === props.StatusEnum[2]) {
        // if the version or branch have changed
        if ((req.body.version !== queryPromise.version) || (req.body.branch !== queryPromise.branch)) {
          debug('swUpdateWorkflowValidation version and/or branch changed');
          return {
            error: true,
            data: 'Version and branch cannot change in state ' + props.StatusEnum[2],
          };
        }
        return {
          error: false,
          data: queryPromise,
        };
      } else {
        // this record update is okay for workflow
        return {
          error: false,
          data: queryPromise,
        };
      }
    } catch (err) {
      debug('swUpdateWorkflowValidation err: ' + JSON.stringify(err));
      return {
        error: true,
        data: err,
      };
    }
  };
};
