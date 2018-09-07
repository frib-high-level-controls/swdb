/**
 *
 */
import * as express from 'express';

import {
  STATUSES as SWINSTALL_STATUSES,
} from '../models/swinstall';



export function newValidation(req: express.Request) {
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
      isOneOf: {
        options: [SWINSTALL_STATUSES],
        errorMessage: 'Status must be one of ' + SWINSTALL_STATUSES,
      },
    },
    statusDate: {
      optional: true,
      isFribDate: {
        options: [req],
        errorMessage: 'Status date must be a date.',
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
    vvApprovalDate: {
      optional: true,
      isFribVvApprovalDate: {
        options: [req],
        errorMessage: 'V&V approval date must be a date.',
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
}

export function updateValidation(req: express.Request) {
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
      isOneOf: {
        options: [SWINSTALL_STATUSES],
        errorMessage: 'Status must be one of ' + SWINSTALL_STATUSES,
      },
    },
    statusDate: {
      optional: true,
      isFribDate: {
        options: [req],
        errorMessage: 'Status date must be a date.',
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
    vvApprovalDate: {
      optional: true,
      isFribVvApprovalDate: {
        options: [req],
        errorMessage: 'V&V approval date must be a date.',
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
}


export function updateSanitization(req: express.Request) {
  // update field sanitization
}
