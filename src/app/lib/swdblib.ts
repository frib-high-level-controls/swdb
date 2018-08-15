'use strict';
import dbg = require('debug');
import express = require('express');
import fs = require('fs');
import request = require('request');
import url = require('url');
import forgApi = require('../shared/forgapi');
const debug = dbg('swdb:swdblib');

import CommonTools = require('./CommonTools');
const ctools = new CommonTools.CommonTools();
const props: any = ctools.getConfiguration();

/* This process conforms to the FRIB development process
 * see Configuration Management Plan for FRIB
 * Controls Software (FRIB-T10500-PL-000240-R001)
 * for more information.
 */

export class SwdbLib {

  /**
   * getReqId gets a clean ID for from an Express.Request
   *
   * @params req Express.Request
   * @returns id The ID of the item found in the request
   */
  public static getReqId = (req: express.Request) => {
    let id: string | null = null;
    const path = url.parse(req.url).pathname;
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

  /**
   * getFrogGroups gets FORG group data from the source specified in the properties file
   *
   * @params req Express.Request
   * @params res Express.Response
   * @params next Express.NextFunction
   */
  public static getForgGroups = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Prepare the source location by looking at the properties useSource
    const source = props.forgGroupsDataSource[props.forgGroupsDataSource.useSource];
    debug('Using forg groups source: ' + source);
    // if the location is http:// then open the URL
    if (source.match(/^https?:\/\//)) {
      request({
        url: source,
        strictSSL: false,
        headers: {
          'Accept': 'application/json',
          'DISCS-Authorization': 'key:pass',
        },
        timeout: 5 * 1000,
      }, (error, response, body) => {
        if (error) {
          debug('GET forg groups got error: ' + error);
          next(error);
        } else {
          if (response.statusCode === 200) {
            debug('GET forg groups got: ' + JSON.stringify(body));
            res.send(body);
          }
        }
      });
    } else {
      // try to open the slot source as a file
      fs.readFile(source, { encoding: 'utf-8' }, (err, data) => {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(data);
          res.end();
          debug('File read of forg groups got: ' + JSON.stringify(data));
        } else {
          debug('File read of forg groups got error : ' + err);
          next(err);
        }
      });
    }
  }

  /**
   * getForgAreas gets FORG area data from the source specified in the properties file
   *
   * @params req Express.Request
   * @params res Express.Response
   * @params next Express.NextFunction
   */
  public static getForgAreas = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Prepare the source location by looking at the properties useSource
    const source = props.forgGroupsDataSource[props.forgGroupsDataSource.useSource];
    debug('Using forg groups source: ' + source);
    // if the location is http:// then open the URL
    if (source.match(/^https?:\/\//)) {
      request({
        url: source,
        strictSSL: false,
        headers: {
          'Accept': 'application/json',
          'DISCS-Authorization': 'key:pass',
        },
        timeout: 5 * 1000,
      }, (error, response, body) => {
        if (error) {
          debug('GET forg areas got error: ' + error);
          next(error);
        } else {
          if (response.statusCode === 200) {
            try {
              const areasBody = JSON.parse(body).filter((
                element: forgApi.Group,
                idx: number, array: forgApi.Group[]) => {
                return element.type === 'AREA';
              });
              debug('GET forg areas got: ' + JSON.stringify(areasBody));
              res.send(areasBody);
          } catch (err) {
            debug('caouft error: ' + err);
          }
          }
        }
      });
    } else {
      // try to open the areas source as a file
      fs.readFile(source, { encoding: 'utf-8' }, (err, data) => {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(data);
          res.end();
          debug('File read of forg areas got: ' + JSON.stringify(data));
        } else {
          debug('File read of forg areas got error : ' + err);
          next(err);
        }
      });
    }
  }

  /**
   * getForgUsers gets FORG user data from the source specified in the properties file
   *
   * @params req Express.Request
   * @params res Express.Response
   * @params next Express.NextFunction
   */
  public static getForgUsers = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Prepare the source location by looking at the properties useSource
    const source = props.forgUsersDataSource[props.forgUsersDataSource.useSource];
    debug('Using forg users source: ' + source);
    // if the location is http:// then open the URL
    if (source.match(/^https?:\/\//)) {
      request({
        url: source,
        strictSSL: false,
        headers: {
          'Accept': 'application/json',
          'DISCS-Authorization': 'key:pass',
        },
        timeout: 5 * 1000,
      }, (error, response, body) => {
        if (error) {
          debug('GET forg users got error: ' + error);
          next(error);
        } else {
          if (response.statusCode === 200) {
            debug('GET forg users got: ' + JSON.stringify(body));
            res.send(body);
          }
        }
      });
    } else {
      // try to open the slot source as a file
      fs.readFile(source, { encoding: 'utf-8' }, (err, data) => {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(data);
          res.end();
        } else {
          next(err);
        }
      });
    }
  }

  /**
   * newValidation checks validation on new swdb records
   * Uses express-validator.
   *
   * @params req Express.Request
   */
  public static newValidation = (req: express.Request) => {
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
          options: [props.levelOfCareKeys],
          errorMessage: 'Level of care must be one of ' + props.levelOfCareKeys,
        },
      },
      status: {
        notEmpty: {
          errorMessage: 'Status is required.',
        },
        isOneOf: {
          options: [props.statusKeys],
          errorMessage: 'Status must be one of ' + props.statusKeys,
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
        isString: {
          errorMessage: 'Design description document location must be a string.',
        },
      },
      descDocLoc: {
        optional: true,
        isString: {
          errorMessage: 'Description document location must be a string.',
        },
      },
      vvProcLoc: {
        optional: true,
        isVvProcLoc: {
          options: [req],
          errorMessage: 'V&V procedure location must be an array of strings.',
        },
      },
      vvResultsLoc: {
        optional: true,
        isVvResultsLoc: {
          options: [req],
          errorMessage: 'V&V results location must be an array of strings.',
        },
      },
      versionControl: {
        optional: true,
        isOneOf: {
          options: [props.rcsKeys],
          errorMessage: 'Revision control must be one of ' + props.rcsKeys,
        },
      },
      versionControlLoc: {
        optional: true,
        isString: {
          errorMessage: 'Version control location must be a string.',
        },
      },
      previous: {
        optional: true,
        isAscii: {
          errorMessage: 'Previous must be ASCII characters.',
        },
        isHexadecimal: {
          errorMessage: 'Previous must be hexadecimal characters.',
        },
        isLength: {
          options: [{ min: 24, max: 24 }],
          errorMessage: 'Previous must be 24 hex characters as record ObjectId.',
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

  }

  /**
   * updateValidation checks validation on swdb record updates
   * Uses express-validator.
   *
   * @params req Express.Request
   */
  public static updateValidation = (req: express.Request) => {
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
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Version must be 1-30 characters.',
        },
      },
      branch: {
        optional: true,
        isString: {
          errorMessage: 'Branch must be a string.',
        },
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Branch must be 1-30 characters.',
        },
      },
      desc: {
        optional: true,
        isString: {
          errorMessage: 'Description must be a string',
        },
        isLength: {
          options: [{ min: 0, max: 2048 }],
          errorMessage: 'Description must be 0-2048 characters',
        },
      },
      owner: {
        optional: false,
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
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Engineer must be 2-30 characters.',
        },
      },
      levelOfCare: {
        optional: true,
        isOneOf: {
          options: [props.levelOfCareKeys],
          errorMessage: 'Level of care must be one of ' + props.levelOfCareKeys,
        },
      },
      status: {
        optional: true,
        isOneOf: {
          options: [props.statusKeys],
          errorMessage: 'Status must be one of ' + props.statusKeys,
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
        isLength: {
          options: [{ min: 0, max: 30 }],
          errorMessage: 'Platforms must be 4-30 characters.',
        },
      },
      designDescDocLoc: {
        optional: true,
        isString: {
          errorMessage: 'Design description document location must be a string.',
        },
      },
      descDocLoc: {
        optional: true,
        isString: {
          errorMessage: 'Description document location must be a string.',
        },
      },
      vvProcLoc: {
        optional: true,
        isVvProcLoc: {
          options: [req],
          errorMessage: 'V&V procedure location must be an array of strings.',
        },
      },
      vvResultsLoc: {
        optional: true,
        isVvResultsLoc: {
          options: [req],
          errorMessage: 'V&V results location must be an array of strings.',
        },
      },
      versionControl: {
        optional: true,
        isOneOf: {
          options: [props.rcsKeys],
          errorMessage: 'Revision control must be one of ' + props.rcsKeys,
        },
      },
      versionControlLoc: {
        optional: true,
        isString: {
          errorMessage: 'Version control location must be a string.',
        },
      },
      previous: {
        optional: true,
        isAscii: {
          errorMessage: 'Previous must be ASCII characters.',
        },
        isHexadecimal: {
          errorMessage: 'Previous must be hexadecimal characters.',
        },
        isLength: {
          options: [{ min: 24, max: 24 }],
          errorMessage: 'Previous must be 24 hex characters as record ObjectId.',
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
  }

  public static updateSanitization = (req: express.Request) => {
    return;
  }
}
