'use strict';
import express = require('express');
import fs = require('fs');
import url = require('url');
import dbg = require('debug');
const debug = dbg('swdb:swdblib');

const swdb = []; // storage
const reqLog = []; // log of change requests

import CommonTools = require('./CommonTools');
const ctools = new CommonTools.CommonTools();
const props = ctools.getConfiguration();

/* This process conforms to the FRIB development process
 * see Configuration Management Plan for FRIB
 * Controls Software (FRIB-T10500-PL-000240-R001)
 * for more information.
 */

// class levelOfCareEnum extends enumify.Enum {}
// levelOfCareEnum.initEnum(props.levelOfCareEnums);
// class swStatus extends enumify.Enum {}
// swStatus.initEnum(props.statusEnums);
export class SwdbLib {

  /**
   * getReqId gets a clean ID for from an Express.Request
   *
   * @params req Express.Request
   * @returns id The ID of the item found in the request
   */
  public static getReqId = (req: express.Request) => {
    let id = null;
    let path = url.parse(req.url).pathname;
    if (url.parse(req.url).pathname) {
      if (path!.match(/[^v][\da-fA-F]+$/) !== null) {
        const urlParts = path!.split('/');
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

  public static newValidation = function(req: express.Request) {
    req.checkBody({
      swName: {
        notEmpty: {
          errorMessage: 'Software name is required.',
        },
        isString: {
          errorMessage: 'Software name must be a string.',
        },
        isAscii: {
          errorMessage: 'Software name must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 40 }],
          errorMessage: 'Name must be 2-40 characters.',
        },
      },
      version: {
        optional: true,
        isString: {
          errorMessage: 'Version must be a string.',
        },
        isAscii: {
          errorMessage: 'Version must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 30 }],
          errorMessage: 'Version must be 1-30 characters.',
        },
      },
      branch: {
        optional: true,
        isString: {
          errorMessage: 'Branch must be a string.',
        },
        isAscii: {
          errorMessage: 'Branch must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 30 }],
          errorMessage: 'Branch must be 1-30 characters.',
        },
      },
      desc: {
        optional: true,
        isString: {
          errorMessage: 'Description must be a string.',
        },
        isAscii: {
          errorMessage: 'Description must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 2048 }],
          errorMessage: 'Description must be 0-2048 characters.',
        },
      },
      owner: {
        notEmpty: {
          errorMessage: 'Owner is required.',
        },
        isString: {
          errorMessage: 'Owner must be a string.',
        },
        isAscii: {
          errorMessage: 'Owner must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 80 }],
          errorMessage: 'Owner must be 2-80 characters.',
        },
      },
      engineer: {
        optional: true,
        isString: {
          errorMessage: 'Engineer must be a string.',
        },
        isAscii: {
          errorMessage: 'Engineer must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 30 }],
          errorMessage: 'Engineer must be 2-30 characters.',
        },
      },
      levelOfCare: {
        notEmpty: {
          errorMessage: 'Level of care is required.',
        },
        isOneOf: {
          options: [props.levelOfCareLabels],
          errorMessage: 'Status must be one of ' + props.levelOfCareLabels,
        },
      },
      status: {
        notEmpty: {
          errorMessage: 'Status is required.',
        },
        isOneOf: {
          options: [props.statusLabels],
          errorMessage: 'Status must be one of ' + props.statusLabels,
        },
      },
      statusDate: {
        notEmpty: {
          errorMessage: 'Status date is required.',
        },
        isDate: {
          errorMessage: 'Status date must be a date.',
        },
      },
      platforms: {
        optional: true,
        isString: {
          errorMessage: 'Platforms must be a string.',
        },
        isAscii: {
          errorMessage: 'Platforms must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 4, max: 30 }],
          errorMessage: 'Platforms must be 4-30 characters.',
        },
      },
      designDescDocLoc: {
        optional: true,
        isURL: {
          errorMessage: 'Design description document location must be a URL.',
        },
      },
      descDocLoc: {
        optional: true,
        isURL: {
          errorMessage: 'Description document location must be a URL.',
        },
      },
      vvProcLoc: {
        optional: true,
        isVvProcLoc: {
          options: [req],
          errorMessage: 'V&V procedure location must be an array of URLs.',
        },
      },
      vvResultsLoc: {
        optional: true,
        isVvResultsLoc: {
          options: [req],
          errorMessage: 'V&V results location must be an array of URLs.',
        },
      },
      versionControl: {
        optional: true,
        isOneOf: {
          options: [props.rcsLabels],
          errorMessage: 'Revision control must be one of ' + props.rcsLabels,
        },
      },
      versionControlLoc: {
        optional: true,
        isURL: {
          errorMessage: 'Version control location must be a URL.',
        },
      },
      recertFreq: {
        optional: true,
        isString: {
          errorMessage: 'Recertification frequency must be a string.',
        },
        isAscii: {
          errorMessage: 'Recertification frequency must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 4, max: 30 }],
          errorMessage: 'Recertification frequency must be 4-30 characters.',
        },
      },
      recertStatus: {
        optional: true,
        isString: {
          errorMessage: 'Recertification status must be a string.',
        },
        isAscii: {
          errorMessage: 'Recertification status must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Recertification status must be 0-30 characters.',
        },
      },
      recertDate: {
        optional: true,
        isDate: {
          errorMessage: 'Recertification date must be a date.',
        },
      },
      previous: {
        optional: true,
        isAscii: {
          errorMessage: 'Previous must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Previous must be 0-30 characters.',
        },
      },
      comment: {
        optional: true,
        isString: {
          errorMessage: 'Comment must be a string.',
        },
        isAscii: {
          errorMessage: 'Comment must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 0, max: 2048 }],
          errorMessage: 'Comment must be 0-2048 characters.',
        },
      },
    });

  };

  public static updateValidation = function(req: express.Request) {
    req.checkBody({
      swName: {
        optional: true,
        isString: {
          errorMessage: 'swName must be a string.',
        },
        isAscii: {
          errorMessage: 'swName must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 40 }],
          errorMessage: 'Name must be 2-40 characters.',
        },
      },
      version: {
        optional: true,
        isString: {
          errorMessage: 'Version must be a string.',
        },
        isAscii: {
          errorMessage: 'Version must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 30 }],
          errorMessage: 'Version must be 1-30 characters.',
        },
      },
      branch: {
        optional: true,
        isString: {
          errorMessage: 'Branch must be a string.',
        },
        isAscii: {
          errorMessage: 'Branch must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 1, max: 30 }],
          errorMessage: 'Branch must be 1-30 characters.',
        },
      },
      desc: {
        optional: true,
        isString: {
          errorMessage: 'Description must be a string',
        },
        isAscii: {
          errorMessage: 'Description must be ASCII characters',
        },
        isLength: {
          options: [{ min: 1, max: 2048 }],
          errorMessage: 'Description must be 0-2048 characters',
        },
      },
      owner: {
        optional: true,
        isString: {
          errorMessage: 'Owner must be a string.',
        },
        isAscii: {
          errorMessage: 'Owner must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 80 }],
          errorMessage: 'Owner must be 2-80 characters.',
        },
      },
      engineer: {
        optional: true,
        isString: {
          errorMessage: 'Engineer must be a string.',
        },
        isAscii: {
          errorMessage: 'Engineer must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 2, max: 30 }],
          errorMessage: 'Engineer must be 2-30 characters.',
        },
      },
      levelOfCare: {
        optional: true,
        isOneOf: {
          options: [props.levelOfCareLabels],
          errorMessage: 'Level of care must be one of ' + props.levelOfCareLabels,
        },
      },
      status: {
        optional: true,
        isOneOf: {
          options: [props.statusLabels],
          errorMessage: 'Status must be one of ' + props.statusLabels,
        },
      },
      statusDate: {
        optional: true,
        isDate: {
          errorMessage: 'Status date must be a date.',
        },
      },
      platforms: {
        optional: true,
        isString: {
          errorMessage: 'Platforms must be a string.',
        },
        isAscii: {
          errorMessage: 'Platforms must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 4, max: 30 }],
          errorMessage: 'Platforms must be 4-30 characters.',
        },
      },
      designDescDocLoc: {
        optional: true,
        isURL: {
          errorMessage: 'Design description document location must be a URL.',
        },
      },
      descDocLoc: {
        optional: true,
        isURL: {
          errorMessage: 'Description document location must be a URL.',
        },
      },
      vvProcLoc: {
        optional: true,
        isVvProcLoc: {
          options: [req],
          errorMessage: 'V&V procedure location must be an array of URLs.',
        },
      },
      vvResultsLoc: {
        optional: true,
        isVvResultsLoc: {
          options: [req],
          errorMessage: 'V&V results location must be an array of URLs.',
        },
      },
      versionControl: {
        optional: true,
        isOneOf: {
          options: [props.rcsLabels],
          errorMessage: 'Revision control must be one of ' + props.rcsLabels,
        },
      },
      versionControlLoc: {
        optional: true,
        isURL: {
          errorMessage: 'Version control location must be a URL.',
        },
      },
      recertFreq: {
        optional: true,
        isString: {
          errorMessage: 'Recertification frequency must be a string.',
        },
        isAscii: {
          errorMessage: 'Recertification frequency must be ASCII characters.',
        },
        isLength: {
          options: [{ min: 4, max: 30 }],
          errorMessage: 'Recertification frequency must be 4-30 characters.',
        },
      },
      recertStatus: {
        optional: true,
        isString: {
          errorMessage: 'Recertification status must be a string.',
        },
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Recertification status must be 0-30 characters.',
        },
      },
      recertDate: {
        optional: true,
        isDate: {
          errorMessage: 'Recertification date must be a date.',
        },
      },
      previous: {
        optional: true,
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Previous must be 0-30 characters',
        },
      },
      comment: {
        optional: true,
        isString: {
          errorMessage: 'Comment must be a string',
        },
        isLength: {
          options: [{ min: 0, max: 2048 }],
          errorMessage: 'Comment must be 0-2048 characters',
        },
      },
    });
  };

  public static updateSanitization = function(req: express.Request) {
    return;
  };
}
