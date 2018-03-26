/* jslint node: true */
'use strict';
import express = require('express');
import fs = require('fs');
import request = require('request');
import url = require('url');

import CommonTools = require('./CommonTools');
import {InstStatusEnum} from './swdbEnums';
import dbg = require('debug');
const debug = dbg('swdb:instlib');
const ctools = new CommonTools.CommonTools();
let props: any = {};
props = ctools.getConfiguration();


  /* This process conforms to the FRIB development process
   * see Configuration Management Plan for FRIB
   * Controls Software (FRIB-T10500-PL-000240-R001)
   * for more information.
   */

// general function to find a request ID in a request and
// return it, if available
export class InstLib {

  /**
   * getReqId gets a clean ID for from an Express.Request
   *
   * @params req Express.Request
   * @returns id The ID of the item found in the request
   */
  public static getReqId = (req: express.Request) => {
    let id: string | null = null;
    let path: string | null | undefined = url.parse(req.url).pathname;
    if (url.parse(req.url).pathname) {
      if (path!.match(/[^v][\da-fA-F]+$/) !== null) {
        const urlParts: string[] = path!.split('/');
        id = urlParts[urlParts.length - 1];
        debug('getReqId returning ' + id);
        return id;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  // go get ccdb slot info on behalf of browsers
  public static getSlot = function(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Prepare the source location by looking at the properties useSource
    const source = props.slotsDataSource[props.slotsDataSource.useSource];
    // if the location is http:// then open the URL
    if (source.match(/^http:\/\//)) {
      request({
        url: source,
        strictSSL: false,
        headers: {
          'Accept': 'application/json',
          'DISCS-Authorization': 'key:pass',
        },
        timeout: 5 * 1000,
      }, function(error, response, body) {
        if (error) {
          next(error);
        } else {
          if (response.statusCode === 200) {
            res.send(body);
          }
        }
      });
    } else {
      // try to open the slot source as a file
      fs.readFile(source, { encoding: 'utf-8' }, function(err, data) {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(data);
          res.end();
        } else {
          next(err);
        }
      });

    }
  };

  public static newValidation = function(req: express.Request) {
    req.checkBody({
      host: {
        notEmpty: {
          errorMessage: 'Host is required.',
        },
        isString: {
          errorMessage: 'Host must be a string.',
        },
        isAscii: {
          errorMessage: 'Host must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 30 }],
          errorMessage: 'Host must be 2-30 characters.',
        },
      },
      area: {
        optional: true,
        isArea: {
          options: [req],
          // options: [AreaEnum],
          errorMessage: 'Area must be a list of area strings.',
        },
      },
      slots: {
        optional: true,
        isSlots: {
          options: [req],
          errorMessage: 'Slots must be a list of slots',
        },
      },
      status: {
        optional: true,
        isInEnum: {
          options: [InstStatusEnum],
          errorMessage: 'Status must be one of ' + JSON.stringify(InstStatusEnum),
        },
      },
      software: {
        notEmpty: {
          errorMessage: 'Software reference is required.',
        },
        isString: {
          errorMessage: 'Software reference must be a string.',
        },
        isHexadecimal: {
          errorMessage: 'Software reference must be hexadecimal characters.',
        },
        isLength: {
          options: [{ min: 24, max: 24 }],
          errorMessage: 'Software reference must be 24 characters.',
        },
      },
      vvResultsLoc: {
        optional: true,
        isVvResultsLoc: {
          options: [req],
          errorMessage: 'V&V results location must be an array of URLs.',
        },
      },
      DRRs: {
        optional: true,
        isString: {
          errorMessage: 'DRRs must be a string.',
        },
        isAscii: {
          errorMessage: 'DRRs must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 30 }],
          errorMessage: 'DRRs must be 1-30 characters.',
        },
      },

    });
  };

  public static updateValidation = function(req: express.Request) {
    req.checkBody({
      host: {
        optional: true,
        isString: {
          errorMessage: 'Host must be a string.',
        },
        isAscii: {
          errorMessage: 'Host must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 30 }],
          errorMessage: 'Host must be 2-30 characters.',
        },
      },
      area: {
        optional: true,
        isArea: {
          options: [req],
          errorMessage: 'Area must be a list of area strings.',
        },
      },
      slots: {
        optional: true,
        isSlots: {
          options: [req],
          errorMessage: 'Slots must be a list of slots',
        },
      },
      status: {
        optional: true,
        isInEnum: {
          options: [InstStatusEnum],
          errorMessage: 'Status must be one of ' + InstStatusEnum,
        },
      },
      software: {
        optional: true,
        isString: {
          errorMessage: 'Software reference must be a string.',
        },
        isHexadecimal: {
          errorMessage: 'Software reference must be hexadecimal characters.',
        },
        isLength: {
          options: [{ min: 24, max: 24 }],
          errorMessage: 'Software reference must be 24 characters.',
        },
      },
      vvResultsLoc: {
        optional: true,
        isVvResultsLoc: {
          options: [req],
          errorMessage: 'V&V results location must be an array of URLs.',
        },
      },
      DRRs: {
        optional: true,
        isString: {
          errorMessage: 'DRRs must be a string.',
        },
        isAscii: {
          errorMessage: 'DRRs must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 30 }],
          errorMessage: 'DRRs must be 1-30 characters.',
        },
      },
    });
  };


  public static updateSanitization = function(req: express.Request){
    debug('Sanitizing updateExpression...');
  };

}

