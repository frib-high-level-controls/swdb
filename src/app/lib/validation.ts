/**
 * Validation handlers
 */
import * as express from 'express';

import {
  checkSchema,
  ValidationSchema,
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

const ISO8601_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * newValidation checks validation on new swdb records
 * Uses express-validator.
 *
 * @params req Express.Request
 */
export async function checkNewSoftware(v2: boolean, req: express.Request) {
  const prefix = v2 ? 'data.' : '';
  const schema: ValidationSchema = {};

  schema[`${prefix}name`] = {
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
  };
  schema[`${prefix}desc`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Description must be a string.',
    },
    isLength: {
      options: { max: 2000 },
      errorMessage: 'Description must less than 2000 characters.',
    },
  };
  schema[`${prefix}version`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Version must be a string.',
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Version must less than 100 characters.',
    },
  };
  schema[`${prefix}branch`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Branch must be a string.',
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Branch must less than 100 characters.',
    },
  };
  schema[`${prefix}owner`] = {
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
  };
  schema[`${prefix}engineer`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Engineer must be a string.',
    },
    isLength: {
      options: { max: 30 },
      errorMessage: 'Engineer must less than 30 characters.',
    },
    // TODO: Need to validate against FORG!?
  };
  schema[`${prefix}levelOfCare`] = {
    in: ['body'],
    exists: {
      errorMessage: 'Level of care is required.',
    },
    isIn: {
      options: [CARE_LEVELS],
      errorMessage: 'Level of care must be one of ' + CARE_LEVELS.join(', '),
    },
  };
  schema[`${prefix}status`] = {
    in: ['body'],
    exists: {
      errorMessage: 'Status is required.',
    },
    isIn: {
      options: [SOFTWARE_STATUSES],
      errorMessage: 'Status must be one of ' + SOFTWARE_STATUSES.join(', '),
    },
  };
  schema[`${prefix}statusDate`] = {
    in: ['body'],
    exists: {
      errorMessage: 'Status date is required.',
    },
    matches: {
      options: ISO8601_DATE_REGEX,
      errorMessage: 'Status date must be a date.',
    },
    custom: {
      options: (v: {}) => Number.isFinite(Date.parse(String(v))),
      errorMessage: 'Status date must be a valid date.',
    },
  };
  schema[`${prefix}platforms`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Platforms must be a string.',
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Platforms must less than 100 characters.',
    },
  };
  schema[`${prefix}descDocLoc`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Description document location must be a string.',
    },
  },
  schema[`${prefix}designDocLoc`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Design description document location must be a string.',
    },
  };
  schema[`${prefix}vvProcLoc`] = {
    in: ['body'],
    isArray: {
      errorMessage: 'V&V procedure location must be an array of strings.',
    },
  };
  schema[`${prefix}vvProcLoc.*`] = {
    in: ['body'],
    isString: {
      errorMessage: 'V&V procedure location must be a string.',
    },
  };
  schema[`${prefix}vvResultsLoc`] = {
    in: ['body'],
    isArray: {
      errorMessage: 'V&V results location must be an array of strings.',
    },
  };
  schema[`${prefix}vvResultsLoc.*`] = {
    in: ['body'],
    isString: {
      errorMessage: 'V&V results location must be a string.',
    },
  };
  schema[`${prefix}versionControl`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Version controls must be a string',
    },
    isIn: {
      // Empty string is allowed, but is not is the standard list.
      options: [[''].concat(VERSION_CONTROL_SYSTEMS)],
      errorMessage: 'Version control must be one of ' + VERSION_CONTROL_SYSTEMS.join(', '),
    },
  };
  schema[`${prefix}versionControlLoc`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Version control location must be a string.',
    },
  };
  schema[`${prefix}previous`] = {
    in: ['body'],
    optional: true,
    isMongoId: {
      errorMessage: 'Previous must be a UUID.',
    },
  };
  schema[`${prefix}comment`] = {
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
  };
  return validate(req, checkSchema(schema));
}

export async function checkNewSWInstall(v2: boolean, req: express.Request) {
  const prefix = v2 ? 'data.' : '';
  const schema: ValidationSchema = {};

  schema[`${prefix}host`] = {
    in: ['body'],
    trim: true,
    exists: {
      options: { checkFalsy: true },
      errorMessage: 'Host is required.',
    },
    isString: {
      errorMessage: 'Host must be a string.',
    },
    // isAscii: {
    //   errorMessage: 'Host must be ASCII characters.',
    // },
    isLength: {
      options: [{ min: 2, max: 40 }],
      errorMessage: 'Host must be 2-40 characters.',
    },
  };
  schema[`${prefix}name`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Name must be a string.',
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Name must less than 100 characters.',
    },
  };
  schema[`${prefix}area`] = {
    in: ['body'],
    isLength: {
      options: { min: 1 },
      errorMessage: 'Areas is required.',
    },
  };
  schema[`${prefix}area.*`] = {
    in: ['body'],
    isString: {
      errorMessage: 'Area must be a string.',
    },
  };
  // slots: {
  //   in: ['body'],
  //   optional: true,
  //   custom: {
  //     options: isSlots,
  //     errorMessage: 'Slots must be a list of slots',
  //   },
  // },
  schema[`${prefix}status`] = {
    in: ['body'],
    exists: {
      errorMessage: 'Status is required.',
    },
    isIn: {
      options: [SWINSTALL_STATUSES],
      errorMessage: 'Status must be one of ' + SWINSTALL_STATUSES.join(', '),
    },
  };
  schema[`${prefix}statusDate`] = {
    in: ['body'],
    exists: {
      errorMessage: 'Status date is required.',
    },
    matches: {
      options: ISO8601_DATE_REGEX,
      errorMessage: 'Status date must be a date.',
    },
    custom: {
      options: (v: {}) => Number.isFinite(Date.parse(String(v))),
      errorMessage: 'Status date must be a valid date.',
    },
  };
  schema[`${prefix}software`] = {
    in: ['body'],
    exists: {
      options: { checkFalsy: true },
      errorMessage: 'Software reference is required.',
    },
    isMongoId: {
      errorMessage: 'Software reference must be an ID.',
    },
  },
  schema[`${prefix}vvResultsLoc`] = {
    in: ['body'],
    isArray: {
      errorMessage: 'V&V results must be an array.',
    },
  };
  schema[`${prefix}vvResultsLoc.*`] = {
    in: ['body'],
    isString: {
      errorMessage: 'V&V results location must be a string.',
    },
  };
  schema[`${prefix}vvApprovalDate`] = {
    in: ['body'],
    // Allowed to be '' OR 'YYYY-MM-DD'!
    custom: {
      options: (v: {}) => {
        if (v !== '') {
          const str = String(v);
          if (!str.match(ISO8601_DATE_REGEX)) {
            throw new Error('V&V approval date must be a date.');
          }
          if (!Number.isFinite(Date.parse(str))) {
            throw new Error('V&V approval date must be a valid date.');
          }
        }
        return true;
      },
    },
  };
  schema[`${prefix}drrs`] = {
    in: ['body'],
    isString: {
      errorMessage: 'DRRs must be a string.',
    },
    // isAscii: {
    //   errorMessage: 'DRRs must be ASCII characters.',
    // },
    isLength: {
      options: { max: 30 },
      errorMessage: 'DRRs must be less than 30 characters.',
    },
  };
  return validate(req, checkSchema(schema));
}
