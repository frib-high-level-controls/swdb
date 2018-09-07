/**
 *
 */
import * as express from 'express';

import {
  CARE_LEVELS,
  STATUSES as SOFTWARE_STATUSES,
  VERSION_CONTROL_SYSTEMS,
} from '../models/software';



/**
 * newValidation checks validation on new swdb records
 * Uses express-validator.
 *
 * @params req Express.Request
 */
export const newValidation = (req: express.Request) => {
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
        options: [CARE_LEVELS],
        errorMessage: 'Level of care must be one of ' + CARE_LEVELS,
      },
    },
    status: {
      notEmpty: {
        errorMessage: 'Status is required.',
      },
      isOneOf: {
        options: [SOFTWARE_STATUSES],
        errorMessage: 'Status must be one of ' + SOFTWARE_STATUSES,
      },
    },
    statusDate: {
      notEmpty: {
        errorMessage: 'Status date is required.',
      },
      isFribDate: {
        options: [req],
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
        options: [VERSION_CONTROL_SYSTEMS],
        errorMessage: 'Revision control must be one of ' + VERSION_CONTROL_SYSTEMS,
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

};

/**
 * updateValidation checks validation on swdb record updates
 * Uses express-validator.
 *
 * @params req Express.Request
 */
export function updateValidation(req: express.Request) {
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
        options: [CARE_LEVELS],
        errorMessage: 'Level of care must be one of ' + CARE_LEVELS,
      },
    },
    status: {
      optional: true,
      isOneOf: {
        options: [SOFTWARE_STATUSES],
        errorMessage: 'Status must be one of ' + SOFTWARE_STATUSES,
      },
    },
    statusDate: {
      optional: true,
      isFribDate: {
        options: [req],
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
        options: [VERSION_CONTROL_SYSTEMS],
        errorMessage: 'Revision control must be one of ' + VERSION_CONTROL_SYSTEMS,
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

export function updateSanitization(req: express.Request) {
  return;
}
