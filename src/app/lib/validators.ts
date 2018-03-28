import express = require('express');
import cJSON = require('circular-json');
import validate = require('validate.js');
import dbg = require('debug');
import Be = require('./Db');
import InstBe = require('./instDb');
import  mongoose = require('mongoose');
import enums = require('./swdbEnums');
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

  /**
   * swNoVerBranchChgIfStatusRdyInstall - method to detect version/branch change when sw status
   *  is Ready for install
   * @param req - express request
   * @param instBe - db object for installation db access
   *
   * @returns Promise<IValResult>
   */
  public static swNoVerBranchChgIfStatusRdyInstall =
    async function(req: express.Request): Promise<IValResult> {
    // get the id of the record which is wanting update
    // go get the existing record
    debug('Checking wfRuler1');
    let id = req.params.id;
    try {
      let idObj = new mongoose.mongo.ObjectId(req.params.id);
      debug(JSON.stringify(idObj));
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
      if (!queryPromise) {
        return {
          error: true,
          data: 'Record id not found' + id,
        };
      }
      if (queryPromise.status === enums.StatusEnum[2]) {
        // if the version or branch have changed
        // debug('swUpdateWorkflowValidation req: ' + JSON.stringify(req.body));
        if ((('version' in req.body) || ('branch' in req.body)) &&
         ((req.body.version !== queryPromise.version) || (req.body.branch !== queryPromise.branch))) {
          // debug('swUpdateWorkflowValidation version and/or branch changed');
          return {
            error: true,
            data: 'Version and branch cannot change in state ' + enums.StatusEnum[2],
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

  /**
   * instUpdateWorflowValidation - method to detect workflow issues with installation updates
   * @param req - express request
   * @param instBe - db object for installation db access
   *
   * @returns Promise<IValResult>
   */
  public static noInstSwChangeUnlessReadyForInstall =
    async function(req: express.Request): Promise<IValResult> {
    // The installation sw field cxan only change in the Ready for install state
    // get the id of the record which is wanting update
    // go get the existing record
    debug('Checking wfRuler2');
    let id = req.params.id;
    try {
      debug('Rule 2 id: ' + id);
      let idObj = new mongoose.mongo.ObjectId(req.params.id);
      debug(JSON.stringify(idObj));
    } catch (err) {
      return {
        error: true,
        data: 'Record id parse err: ' + id + ': ' + JSON.stringify(err),
      };
    }
    try {
      let queryPromise = await InstBe.InstDb.instDoc.findOne({ _id: id }).exec();
      // if old status was Ready for install
      // first, see if there was eve a  record to update
      if (!queryPromise) {
        return {
          error: true,
          data: 'Rule2 record id not found ' + id,
        };
      }
      if ((req.body.software) && (req.body.software !== queryPromise.software)) {
        debug('software from ' + JSON.stringify(queryPromise.software) + ' to ' + JSON.stringify(req.body.software));
        if (queryPromise.status === enums.InstStatusEnum[0]) {
          // req is changing software, and in in Ready for installation
          return {
            error: false,
            data: queryPromise,
          };
        } else {
          // req is changing sw, and not in Ready for installation
          return {
            error: true,
            data: 'Installation software field can only be changed in state ' + enums.InstStatusEnum[0],
          };
        }
      } else {
        return {
          error: false,
          data: queryPromise,
        };
      }
    } catch (err) {
      debug('instUpdateWorkflowValidation db err: ' + JSON.stringify(err));
      return {
        error: true,
        data: err,
      };
    }
  };

  /**
   * noInstSwUnlessSwIsReadyForInstall  - method to detect installations attempting to point to software that is not
   * in state Ready for install
   * @param req - express request
   *
   * @returns Promise<IValResult>
   */
  public static noInstSwUnlessSwIsReadyForInstall =
    async function(req: express.Request): Promise<IValResult> {
    // here the req passed is either a new installation or an update.
    // the software listed in the request must have state Ready for install.

    // check that the id is parsable
    debug('Checking wfRule3');
    if (req.body.software) {
      let id = req.body.software;
      try {
        let idObj = new mongoose.mongo.ObjectId(id);
        debug(JSON.stringify(idObj));
      } catch (err) {
        return {
          error: true,
          data: 'Record id parse err: ' + id + ': ' + JSON.stringify(err),
        };
      }
      try {
        let queryPromise  = await Be.Db.swDoc.findOne({ _id: id }).exec();
        // if old status was Ready for install
        // first, see if there was eve a  record to update
        if (!queryPromise) {
          debug('Rule3 No queryPromise, returning err');
          return {
            error: true,
            data: 'Rule3 record id not found ' + id,
          };
        } else {
          let sts: string = enums.StatusEnum[2];
          if (queryPromise.status !== sts) {
            debug('Rule3 Sw field status is incorrect, returning err');
            return {
              error: true,
              data: 'Software field must point to software with status ' + sts + '.' +
              'The given software, ' + id + ', has status ' + queryPromise.status,
            };
          } else {
            debug('Rule 3: Sw field status is okay, returning okay');
            return {
              error: false,
              data: 'No errors',
            };
          }
        }
      } catch (err) {
        debug('Rule3 db err: ' + JSON.stringify(err));
        return {
          error: true,
          data: err,
        };
      }
    } else {
      debug('Rule3 Sw field status is blank, returning okay');
      return {
        error: false,
        data: 'No software listed',
      };
    }
  };

  /**
   * noSwStateChgIfReferringInst  - method to detect software attempting to change state
   * when there are installations referring to it.
   * @param req - express request
   *
   * @returns Promise<IValResult>
   */
  public static noSwStateChgIfReferringInst = async function(req: express.Request): Promise<IValResult> {
    // check that the id is parsable
    debug('Checking wfRule4');
    // go get the existing record
    let id = req.params.id;
    try {
      let idObj = new mongoose.mongo.ObjectId(req.params.id);
      debug(JSON.stringify(idObj));
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
      if (!queryPromise) {
        return {
          error: true,
          data: 'Record id not found' + id,
        };
      }
      if (queryPromise.status === req.body.status) {
        return {
          error: false,
          data: 'No status changed.',
        };
      } else {
        // go find installations that refer to this sw
        queryPromise = await InstBe.InstDb.instDoc.find({ software: id }).exec();
        if (queryPromise.length > 0) {
          // there are referring installations
          return {
            error: true,
            data: 'Software state cannot change while there are active installations: ' +
              queryPromise.map(function (item: any){
                return item._id;
              }),
          };
        } else {
          return {
            error: false,
            data: 'No referring acive installations.',
          };
        }
      }
    } catch (err) {
      debug(err);
      return {
        error: true,
        data: JSON.stringify(err),
      };
    }
  };
};

export interface IValResult {
    error: boolean;
    data: string;
}
