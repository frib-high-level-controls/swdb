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
  isVvProcLoc,
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
    swName: {
      in: 'body',
      exists: {
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
      in: 'body',
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
      in: 'body',
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
      in: 'body',
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
      in: 'body',
      exists: {
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
      in: 'body',
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
      in: 'body',
      exists: {
        errorMessage: 'Level of care is required.',
      },
      isIn: {
        options: [CARE_LEVELS],
        errorMessage: 'Level of care must be one of ' + CARE_LEVELS,
      },
    },
    status: {
      in: 'body',
      exists: {
        errorMessage: 'Status is required.',
      },
      isIn: {
        options: [SOFTWARE_STATUSES],
        errorMessage: 'Status must be one of ' + SOFTWARE_STATUSES,
      },
    },
    statusDate: {
      in: 'body',
      customSanitizer: {
        options: isoDateStringToUTCDate(),
      },
      exists: {
        options: { checkFalsy: true },
        errorMessage: (value: {}) => {
          if (value === undefined) {
            return 'Status date is required.';
          }
          return 'Status date must be a date.';
        },
      },
    },
    platforms: {
      in: 'body',
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
      in: 'body',
      optional: true,
      isString: {
        errorMessage: 'Design description document location must be a string.',
      },
    },
    descDocLoc: {
      in: 'body',
      optional: true,
      isString: {
        errorMessage: 'Description document location must be a string.',
      },
    },
    vvProcLoc: {
      in: 'body',
      optional: true,
      custom: {
        options: isVvProcLoc,
        errorMessage: 'V&V procedure location must be an array of strings.',
      },
    },
    vvResultsLoc: {
      in: 'body',
      optional: true,
      custom: {
        options: isVvResultsLoc,
        errorMessage: 'V&V results location must be an array of strings.',
      },
    },
    versionControl: {
      in: 'body',
      optional: true,
      isIn: {
        options: [VERSION_CONTROL_SYSTEMS],
        errorMessage: 'Revision control must be one of ' + VERSION_CONTROL_SYSTEMS,
      },
    },
    versionControlLoc: {
      in: 'body',
      optional: true,
      isString: {
        errorMessage: 'Version control location must be a string.',
      },
    },
    previous: {
      in: 'body',
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
      in: 'body',
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
  }));
}

/**
 * updateValidation checks validation on swdb record updates
 * Uses express-validator.
 *
 * @params req Express.Request
 */
export async function checkUpdateSoftware(req: express.Request) {
  return validate(req, checkSchema({
    swName: {
      in: ['body'],
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
      in: ['body'],
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
      in: ['body'],
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
      in: ['body'],
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
      in: ['body'],
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
      in: ['body'],
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
      in: ['body'],
      optional: true,
      isIn: {
        options: [CARE_LEVELS],
        errorMessage: 'Level of care must be one of ' + CARE_LEVELS,
      },
    },
    status: {
      in: ['body'],
      optional: true,
      isIn: {
        options: [SOFTWARE_STATUSES],
        errorMessage: 'Status must be one of ' + SOFTWARE_STATUSES,
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
    platforms: {
      in: ['body'],
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
      in: ['body'],
      optional: true,
      isString: {
        errorMessage: 'Design description document location must be a string.',
      },
    },
    descDocLoc: {
      in: ['body'],
      optional: true,
      isString: {
        errorMessage: 'Description document location must be a string.',
      },
    },
    vvProcLoc: {
      in: ['body'],
      optional: true,
      custom: {
        options: isVvProcLoc,
        errorMessage: 'V&V procedure location must be an array of strings.',
      },
    },
    vvResultsLoc: {
      in: ['body'],
      optional: true,
      custom: {
        options: isVvResultsLoc,
        errorMessage: 'V&V results location must be an array of strings.',
      },
    },
    versionControl: {
      in: ['body'],
      optional: true,
      isIn: {
        options: [VERSION_CONTROL_SYSTEMS],
        errorMessage: 'Revision control must be one of ' + VERSION_CONTROL_SYSTEMS,
      },
    },
    versionControlLoc: {
      in: ['body'],
      optional: true,
      isString: {
        errorMessage: 'Version control location must be a string.',
      },
    },
    previous: {
      in: ['body'],
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
      in: ['body'],
      optional: true,
      isString: {
        errorMessage: 'Comment must be a string',
      },
      isLength: {
        options: [{ min: 0, max: 2048 }],
        errorMessage: 'Comment must be 0-2048 characters',
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
