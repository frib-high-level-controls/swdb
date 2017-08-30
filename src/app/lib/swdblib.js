"use strict";
// var be = require('./db');
const fs = require('fs');
const circJSON = require('circular-json');
const enumify = require('enumify');
// const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));
//const swTable = JSON.parse(fs.readFileSync('./config/swData.json', 'utf8'));
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var swdb = []; // storage
var reqLog = []; // log of change requests

let CommonTools = require('./CommonTools');
let ctools = new CommonTools.CommonTools();
let props = {};
props = ctools.getConfiguration();

  /* This process conforms to the FRIB development process
   * see Configuration Management Plan for FRIB
   * Controls Software (FRIB-T10500-PL-000240-R001)
   * for more information.
   */

class levelOfCareEnum extends enumify.Enum {}
  levelOfCareEnum.initEnum(props.levelOfCareEnums);
class swStatus extends enumify.Enum {}
  swStatus.initEnum(props.statusEnums);

exports.newValidation = function(swNames, req) {
  req.checkBody({
    'swName': {
      notEmpty: {
        errorMessage: "Software name is required."
      },
      isString: {
        errorMessage: "Software name must be a string."
      },
      isAscii: {
        errorMessage: "Software name must be ASCII characters."
      },
      isIn: {
        options: [swNames],
        errorMessage: "Software name must be in the software name list"
      },
    },
    'version': {
      optional: true,
      isString: {
        errorMessage: "Version must be a string."
      },
      isAscii: {
        errorMessage: "Version must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Version must be 1-30 characters."
      }
    },
    'branch': {
      optional: true,
      isString: {
        errorMessage: "Branch must be a string."
      },
      isAscii: {
        errorMessage: "Branch must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Branch must be 1-30 characters."
      }
    },
    'desc': {
      optional: true,
      isString: {
        errorMessage: "Description must be a string."
      },
      isAscii: {
        errorMessage: "Description must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Description must be 0-2048 characters."
      }
    },
    'owner': {
      notEmpty: {
        errorMessage: "Owner is required."
      },
      isString: {
        errorMessage: "Owner must be a string."
      },
      isAscii: {
        errorMessage: "Owner must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Owner must be 2-30 characters."
      }
    },
    'engineer': {
      optional: true,
      isString: {
        errorMessage: "Engineer must be a string."
      },
      isAscii: {
        errorMessage: "Engineer must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Engineer must be 2-30 characters."
      }
    },
    'levelOfCare': {
      notEmpty: {
        errorMessage: "Level of care is required."
      },
      isOneOf: {
        options: [props.levelOfCareEnums],
        errorMessage: "Status must be one of "+props.levelOfCareEnums
      },
    },
    'status': {
      notEmpty: {
        errorMessage: "Status is required."
      },
      isOneOf: {
        options: [props.statusEnums],
        errorMessage: "Status must be one of "+props.statusEnums
      },
    },
    'statusDate': {
      notEmpty: {
        errorMessage: "Status date is required."
      },
      isDate: {
        errorMessage: "Status date must be a date."
      }
    },
    'platforms': {
      optional: true,
      isString: {
        errorMessage: "Platforms must be a string."
      },
      isAscii: {
        errorMessage: "Platforms must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Platforms must be 4-30 characters."
      }
    },
    'designDescDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Design description document location must be a URL."
      },
    },
    'descDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Description document location must be a URL."
      },
    },
    'vvProcLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V procedure location must be a URL."
      },
    },
    'vvResultsLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V results location must be a URL."
      },
    },
    'versionControl': {
      optional: true,
      isOneOf: {
        options: [props.rcsEnums],
        errorMessage: "Revision control must be one of "+props.rcsEnums
      },
    },
    'versionControlLoc': {
      optional: true,
      isURL: {
        errorMessage: "Version control location must be a URL."
      },
    },
    'recertFreq': {
      optional: true,
      isString: {
        errorMessage: "Recertification frequency must be a string."
      },
      isAscii: {
        errorMessage: "Recertification frequency must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification frequency must be 4-30 characters."
      }
    },
    'recertStatus': {
      optional: true,
      isString: {
        errorMessage: "Recertification status must be a string."
      },
      isAscii: {
        errorMessage: "Recertification status must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification status must be 4-30 characters."
      }
    },
    'recertDate': {
      optional: true,
      isDate: {
        errorMessage: "Recertification date must be a date."
      }
    },
    'previous': {
      optional: true,
      isAscii: {
        errorMessage: "Previous must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Previous must be 1-30 characters."
      }
    },
    'comment': {
      optional: true,
      isString: {
        errorMessage: "Comment must be a string."
      },
      isAscii: {
        errorMessage: "Comment must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Comment must be 0-2048 characters."
      }
    }
  });

};

exports.updateValidation = function(swNames, req) {
  req.checkBody({
    'swName': {
      optional: true,
      isString: {
        errorMessage: "swName must be a string."
      },
      isAscii: {
        errorMessage: "swName must be ASCII characters."
      },
      isIn: {
        options: [swNames],
        errorMessage: "Software name must be in the software name list"
      },
    },
    'version': {
      optional: true,
      isString: {
        errorMessage: "Version must be a string."
      },
      isAscii: {
        errorMessage: "Version must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Version must be 1-30 characters."
      }
    },
    'branch': {
      optional: true,
      isString: {
        errorMessage: "Branch must be a string."
      },
      isAscii: {
        errorMessage: "Branch must be ASCII characters."
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Branch must be 1-30 characters."
      }
    },
    'desc': {
      optional: true,
      isString: {
        errorMessage: "Description must be a string"
      },
      isAscii: {
        errorMessage: "Description must be ASCII characters"
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Description must be 0-2048 characters"
      }
    },
    'owner': {
      optional: true,
      isString: {
        errorMessage: "Owner must be a string."
      },
      isAscii: {
        errorMessage: "Owner must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Owner must be 2-30 characters."
      }
    },
    'engineer': {
      optional: true,
      isString: {
        errorMessage: "Engineer must be a string."
      },
      isAscii: {
        errorMessage: "Engineer must be ASCII characters."
      },
      isLength: {
        options: [{min:2, max:30}],
        errorMessage: "Engineer must be 2-30 characters."
      }
    },
    'levelOfCare': {
      optional: true,
      isOneOf: {
        options: [props.levelOfCareEnums],
        errorMessage: "Level of care must be one of "+props.levelOfCareEnums
      },
    },
    'status': {
      optional: true,
      isOneOf: {
        options: [props.statusEnums],
        errorMessage: "Status must be one of "+props.statusEnums
      },
    },
    'statusDate': {
      optional: true,
      isDate: {
        errorMessage: "Status date must be a date."
      }
    },
    'platforms': {
      optional: true,
      isString: {
        errorMessage: "Platforms must be a string."
      },
      isAscii: {
        errorMessage: "Platforms must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Platforms must be 4-30 characters."
      }
    },
    'designDescDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Design description document location must be a URL."
      },
    },
    'descDocLoc': {
      optional: true,
      isURL: {
        errorMessage: "Description document location must be a URL."
      },
    },
    'vvProcLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V procedure location must be a URL."
      },
    },
    'vvResultsLoc': {
      optional: true,
      isURL: {
        errorMessage: "V&V results location must be a URL."
      },
    },
    'versionControl': {
      optional: true,
      isOneOf: {
        options: [props.rcsEnums],
        errorMessage: "Revision control must be one of "+props.rcsEnums
      },
    },
    'versionControlLoc': {
      optional: true,
      isURL: {
        errorMessage: "Version control location must be a URL."
      },
    },
    'recertFreq': {
      optional: true,
      isString: {
        errorMessage: "Recertification frequency must be a string."
      },
      isAscii: {
        errorMessage: "Recertification frequency must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification frequency must be 4-30 characters."
      }
    },
    'recertStatus': {
      optional: true,
      isString: {
        errorMessage: "Recertification status must be a string."
      },
      isAscii: {
        errorMessage: "Recertification status must be ASCII characters."
      },
      isLength: {
        options: [{min:4, max:30}],
        errorMessage: "Recertification status must be 4-30 characters."
      }
    },
    'recertDate': {
      optional: true,
      isDate: {
        errorMessage: "Recertification date must be a date."
      }
    },
    'previous': {
      optional: true,
      isAscii: {
        errorMessage: "Previous must be ASCII characters"
      },
      isLength: {
        options: [{min:1, max:30}],
        errorMessage: "Previous must be 1-30 characters"
      }
    },
    'comment': {
      optional: true,
      isString: {
        errorMessage: "Comment must be a string"
      },
      isAscii: {
        errorMessage: "Comment must be ASCII characters"
      },
      isLength: {
        options: [{min:1, max:2048}],
        errorMessage: "Comment must be 0-2048 characters"
      }
    }
  });
};

exports.updateSanitization = function(req) {
};
