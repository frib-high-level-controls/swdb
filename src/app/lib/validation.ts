/**
 * Validation handlers
 */
import * as express from 'express';

import {
  checkSchema,
} from 'express-validator/check';

import {
  // check,
  validate,
} from '../shared/handlers';

import {
  CARE_LEVELS,
  STATUSES as SOFTWARE_STATUSES,
  VERSION_CONTROL_SYSTEMS,
} from '../models/software';

import {
  STATUSES as SWINSTALL_STATUSES,
} from '../models/swinstall';

import {
  isArea,
  isoDateStringToUTCDate,
  isSlots,
  isVvResultsLoc,
} from './validators';


/**
 * newValidation checks validation on new swdb records
 * Uses express-validator.
 *
 * @params req Express.Request
 */
export async function checkNewSoftware(req: express.Request) {
  return validate(req, checkSchema({
    'name': {
      in: ['body'],
      trim: true,
      exists: {
        options: { checkFalsy: true },
        errorMessage: 'Software name is required.',
      },
      isString: {
        errorMessage: 'Software name must be a string.',
      },
      isLength: {
        options: [{ min: 2, max: 40 }],
        errorMessage: 'Name must be 2-40 characters.',
      },
    },
    'desc': {
      in: ['body'],
      isString: {
        errorMessage: 'Description must be a string.',
      },

      isLength: {
        options: { max: 2000 },
        errorMessage: 'Description must less than 2000 characters.',
      },
    },
    'version': {
      in: ['body'],
      isString: {
        errorMessage: 'Version must be a string.',
      },
      isLength: {
        options: { max: 100 },
        errorMessage: 'Version must less than 100 characters.',
      },
    },
    'branch': {
      in: ['body'],
      isString: {
        errorMessage: 'Branch must be a string.',
      },
      isLength: {
        options: { max: 100 },
        errorMessage: 'Branch must less than 100 characters.',
      },
    },
    'owner': {
      in: ['body'],
      exists: {
        options: { checkFalsy: true },
        errorMessage: 'Owner is required.',
      },
      isString: {
        errorMessage: 'Owner must be a string.',
      },
      isLength: {
        options: [{ min: 2, max: 80 }],
        errorMessage: 'Owner must be 2-80 characters.',
      },
      // TODO: Need do validate against FORG!?
    },
    'engineer': {
      in: ['body'],
      isString: {
        errorMessage: 'Engineer must be a string.',
      },
      isLength: {
        options: { max: 30 },
        errorMessage: 'Engineer must less than 30 characters.',
      },
      // TODO: Need to validate against FORG!?
    },
    'levelOfCare': {
      in: ['body'],
      exists: {
        errorMessage: 'Level of care is required.',
      },
      isIn: {
        options: [CARE_LEVELS],
        errorMessage: 'Level of care must be one of ' + CARE_LEVELS.join(', '),
      },
    },
    'status': {
      in: ['body'],
      exists: {
        errorMessage: 'Status is required.',
      },
      isIn: {
        options: [SOFTWARE_STATUSES],
        errorMessage: 'Status must be one of ' + SOFTWARE_STATUSES.join(', '),
      },
    },
    'statusDate': {
      in: ['body'],
      exists: {
        errorMessage: 'Status date is required.',
      },
      matches: {
        options: /\d{4}-\d{2}-\d{2}/,
        errorMessage: 'Status date must be a date.',
      },
      custom: {
        options: (v: {}) => Number.isFinite(Date.parse(String(v))),
        errorMessage: 'Status date must be a valid date.',
      },
    },
    'platforms': {
      in: ['body'],
      isString: {
        errorMessage: 'Platforms must be a string.',
      },
      isLength: {
        options: { max: 100 },
        errorMessage: 'Platforms must less than 100 characters.',
      },
    },
    'descDocLoc': {
      in: ['body'],
      isString: {
        errorMessage: 'Description document location must be a string.',
      },
    },
    'designDescDocLoc': {
      in: ['body'],
      isString: {
        errorMessage: 'Design description document location must be a string.',
      },
    },
    'vvProcLoc': {
      in: ['body'],
      isArray: {
        errorMessage: 'V&V procedure location must be an array of strings.',
      },
    },
    'vvProcLoc.*': {
      in: ['body'],
      isString: {
        errorMessage: 'V&V procedure location must be a string.',
      },
    },
    'vvResultsLoc': {
      in: ['body'],
      custom: {
        options: isVvResultsLoc,
        errorMessage: 'V&V results location must be an array of strings.',
      },
    },
    'versionControl': {
      in: ['body'],
      isString: {
        errorMessage: 'Version controls must be a string',
      },
      isIn: {
        // Empty string is allowed, but is not is the standard list.
        options: [[''].concat(VERSION_CONTROL_SYSTEMS)],
        errorMessage: 'Version control must be one of ' + VERSION_CONTROL_SYSTEMS.join(', '),
      },
    },
    'versionControlLoc': {
      in: ['body'],
      isString: {
        errorMessage: 'Version control location must be a string.',
      },
    },
    'previous': {
      in: ['body'],
      optional: true,
      isMongoId: {
        errorMessage: 'Previous must be a UUID.',
      },
    },
    'comment': {
      in: ['body'],
      isString: {
        errorMessage: 'Comment must be a string.',
      },
      // isAscii: {
      //   errorMessage: 'Comment must be ASCII characters.',
      // },
      isLength: {
        options: { max: 2000 },
        errorMessage: 'Comment must be less than 2000 characters.',
      },
    },
  }));
}

export async function checkNewSWInstall(req: express.Request) {
  return validate(req, checkSchema({
    host: {
      in: ['body'],
      exists: {
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
      in: ['body'],
      optional: true,
      custom: {
        options: isArea,
        errorMessage: 'Area must be a list of area strings.',
      },
    },
    slots: {
      in: ['body'],
      optional: true,
      custom: {
        options: isSlots,
        errorMessage: 'Slots must be a list of slots',
      },
    },
    status: {
      in: ['body'],
      optional: true,
      isIn: {
        options: [SWINSTALL_STATUSES],
        errorMessage: 'Status must be one of ' + SWINSTALL_STATUSES,
      },
    },
    statusDate: {
      in: ['body'],
      optional: true,
      customSanitizer: {
        options: isoDateStringToUTCDate(),
      },
      exists: {
        options: { checkNull: true },
        errorMessage: 'Status date must be a date.',
      },
    },
    software: {
      in: ['body'],
      exists: {
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
      in: ['body'],
      optional: true,
      custom: {
        options: isVvResultsLoc,
        errorMessage: 'V&V results location must be an array of URLs.',
      },
    },
    vvApprovalDate: {
      in: ['body'],
      optional: true,
      customSanitizer: {
        options: isoDateStringToUTCDate(true),
      },
      exists: {
        options: { checkNull: true },
        errorMessage: 'V&V approval date must be a date.',
      },
    },
    DRRs: {
      in: ['body'],
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
  }));
}

export async function checkUpdateSWInstall(req: express.Request) {
  return validate(req, checkSchema({
    host: {
      in: ['body'],
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
      in: ['body'],
      optional: true,
      custom: {
        options: isArea,
        errorMessage: 'Area must be a list of area strings.',
      },
    },
    slots: {
      in: ['body'],
      optional: true,
      custom: {
        options: isSlots,
        errorMessage: 'Slots must be a list of slots',
      },
    },
    status: {
      in: ['body'],
      optional: true,
      isIn: {
        options: [SWINSTALL_STATUSES],
        errorMessage: 'Status must be one of ' + SWINSTALL_STATUSES,
      },
    },
    statusDate: {
      in: ['body'],
      optional: true,
      customSanitizer: {
        options: isoDateStringToUTCDate(),
      },
      exists: {
        options: { checkNull: true },
        errorMessage: 'Status date must be a date.',
      },
    },
    software: {
      in: ['body'],
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
      in: ['body'],
      optional: true,
      custom: {
        options: isVvResultsLoc,
        errorMessage: 'V&V results location must be an array of URLs.',
      },
    },
    vvApprovalDate: {
      in: ['body'],
      optional: true,
      customSanitizer: {
        options: isoDateStringToUTCDate(true),
      },
      exists: {
        options: { checkNull: true },
        errorMessage: 'V&V approval date must be a date.',
      },
    },
    DRRs: {
      in: ['body'],
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
  }));
}
