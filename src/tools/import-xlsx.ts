/**
 * Import data from a xls file to the database.
 */
import * as path from 'path';
import { format } from 'util';

import * as Debug from 'debug';
import * as mongoose from 'mongoose';
import rc = require('rc');
import XLSX = require('xlsx');

import {
  ISoftware,
  Software,
} from '../app/models/software';

import {
  ISWInstall,
  SWInstall,
} from '../app/models/swinstall';

interface WorksheetRow {
  [key: string]: ({} | undefined | null);
}

const COL_NAME = 'Name';
const COL_AREA = 'Area';
const COL_OWNER = 'Owner';
const COL_VERSION = 'Version';
const COL_NAME_1 = 'Name_1';
const COL_ENGINEER = 'Engineer';
const COL_LOC = 'Level Of Care';
const COL_DESCRIPTION = 'Description';
const COL_PLATFORMS = 'Platforms';
const COL_VCS_TYPE = 'VCS Type';
const COL_VCS_LOCATION = 'VCS Location';
const COL_HOST = 'Host';
const COL_STATUS = 'Status';
const COL_VV_RESULTS = 'V&V Results';
const COL_VV_APRDATE = 'V&V Date';

interface Config {
  configs?: string[];
  h?: {};
  help?: {};
  mongo: {
    user?: {};
    pass?: {};
    host?: {};
    port: {};
    addr: {};
    db: {};
    options: {};
  };
  dryrun?: {};
  updateBy?: {};
  _?: Array<{}>;
  engineer: {[key: string]: {} | undefined};
  area: {[key: string]: {} | undefined};
  owner: {[key: string]: {} | undefined};
  statusDate: {[key: string]: {} | undefined};
  status: {[key: string]: {} | undefined};
  vcs: {[key: string]: {} | undefined};
}


const debug = Debug('import-xlsx');

// Custom Error class that accepts a format string and parameters.
class Errorf extends Error {
  constructor(message: any, ...params: any[]) {
    super(format(message, ...params));
  }
}

// tslint:disable:no-console
const info = (message?: any, ...params: any[]) => {
  console.info('INFO: ' + format(message, ...params));
};
const warn = (message?: any, ...params: any[]) => {
  console.warn('WARN: ' + format(message, ...params));
};
const error = (message?: any, ...params: any[]) => {
  console.error('ERROR: ' + format(message, ...params));
};

const softwareDB = new Map<string, ISoftware>();
const swInstallDB = new Map<string, ISWInstall>();

const softwares: ISoftware[] = [];
const swInstalls: ISWInstall[] = [];

async function main() {
  const cfg: Config = {
    mongo: {
      port: '27017',
      addr: 'localhost',
      db: 'swdb-dev',
      options: {
        // Use the "new" URL parser (Remove deprecation warning in Mongoose 5.x!)
        useNewUrlParser: true,
      },
    },
    engineer: {},
    area: {},
    owner: {},
    statusDate: {},
    status: {},
    vcs: {},
  };

  rc('import-xlsx', cfg);
  if (cfg.configs) {
    for (const file of cfg.configs) {
      info('Load configuration: %s', file);
    }
  }

  if (debug.enabled) {
    debug(JSON.stringify(cfg, null, 4));
  }

  if (cfg.h || cfg.help) {
    info(`Usage: import-xlsx [ options ] data.xlsx [ ... ]

    Options
        --help               display help information
        --config [rcfile]    load configuration from rcfile
        --dryrun [dryrun]    validate CCDB data (default: true)
        --updateBy [username]  username to use for saving history
    `);
    return;
  }

  if (!cfg._ || (cfg._.length === 0)) {
    info('Data file(s) must be specified');
    return;
  }

  const updateBy = cfg.updateBy ? String(cfg.updateBy).trim().toUpperCase() : '';
  if (!updateBy) {
    error(`Error: Parameter 'updateBy' is required`);
    process.exitCode = 1;
    return;
  }

  // Configure Mongoose (MongoDB)
  let mongoUrl = 'mongodb://';
  if (cfg.mongo.user) {
    mongoUrl += encodeURIComponent(String(cfg.mongo.user));
    if (cfg.mongo.pass) {
      mongoUrl += ':' + encodeURIComponent(String(cfg.mongo.pass));
    }
    mongoUrl += '@';
  }
  if (!cfg.mongo.host) {
    cfg.mongo.host = `${cfg.mongo.addr}:${cfg.mongo.port}`;
  }
  mongoUrl +=  `${cfg.mongo.host}/${cfg.mongo.db}`;

  // Connect and wait for autoIndex to complete
  await mongoose.connect(mongoUrl, cfg.mongo.options);
  info('Connected to database: mongodb://%s/%s', cfg.mongo.host, cfg.mongo.db);

  // Clean DB before saving data
  // await mongoose.connection.db.dropDatabase();
  // await Software.ensureIndexes();
  // await SWInstall.ensureIndexes();

  // const updatedBy = auth.formatRole(auth.RoleScheme.SYS, 'IMPORTXLSX');


  try {
    await Promise.all([
      Software.find().exec().then((docs) => {
        for (const doc of docs) {
          softwareDB.set(genSoftwareKey(doc.name, doc.version), doc);
        }
      }),
      SWInstall.find().exec().then((docs) => {
        for (const doc of docs) {
          swInstallDB.set(genSWInstallKey(doc.host, doc.name, String(doc.software)), doc);
        }
      }),
    ]);

    for (const filePath of cfg._) {
      const absFilePath = path.resolve(String(filePath));
      info('Loading file: %s', absFilePath);
      await loadXLSX(absFilePath, cfg);
    }

    let valid = true;

    const softwareDocuments: Software[] = [];
    for (const d of softwares) {
      info('Create Software document and validate: "%s" (Version: %s)', d.name, d.version);
      const doc = new Software(d);
      try {
        await doc.validate();
      } catch (err) {
        valid = false;
        error(err);
        error(JSON.stringify(d, null, 4));
      }
      softwareDocuments.push(doc);
    }

    const swInstallDocuments: SWInstall[] = [];
    for (const d of swInstalls) {
      info('Create SWInstall document and validate: "%s" (Host: %s)', d.name, d.host);
      const doc = new SWInstall(d);
      try {
        await doc.validate();
      } catch (err) {
        valid = false;
        error(err);
        error(JSON.stringify(d, null, 4));
      }
      swInstallDocuments.push(doc);
    }

    if (!valid) {
      return;
    }

    if (cfg.dryrun !== false && cfg.dryrun !== 'false') {
      info('DRYRUN DONE');
      return;
    }

    for (const doc of softwareDocuments) {
      try {
        await doc.saveWithHistory(updateBy);
      } catch (err) {
        error(err);
      }
    }
    info('Software documents saved with history: %s', softwareDocuments.length);

    for (const doc of swInstallDocuments) {
      try {
        await doc.saveWithHistory(updateBy);
      } catch (err) {
        error(err);
      }
    }
    info('SWInstall documents saved with history: %s', swInstallDocuments.length);

  } finally {
    try {
      await mongoose.disconnect();
      info('Disconnected from database');
    } catch (err) {
      warn('Failed to disconnect from database: %s', err);
    }
  }
}

/**
 * convert data in xlsx to json format, each sheet will be handled
 * @param fileName
 * @returns {Array}
 */
async function loadXLSX(fileName: string, cfg: Config): Promise<void> {
  // Read data from sheet
  const workbook = XLSX.readFile(fileName);

  for (const sheet of workbook.SheetNames) {
    info('Processing sheet %s', sheet);

    const worksheet = workbook.Sheets[sheet];
    if (!worksheet) {
      throw new Errorf(`Cannot read data from sheet: ${sheet}`);
    }

    // Cast worksheet data from type '{}[]' to more specific 'WorksheetRow[]'
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as WorksheetRow[];
    if (rows.length === 0) {
      throw new Errorf(`Cannot convert sheet to json: ${sheet}`);
    }

    if (!cfg.statusDate || !cfg.statusDate[sheet]) {
      throw new Errorf(`Cannot find Status Date for sheet: ${sheet}`);
    }

    let sheetStatusDate = String(cfg.statusDate[sheet]);
    {
      const m = sheetStatusDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
      if (!m) {
        throw new Errorf(`Sheet Status Date format is not valid (MM/DD/YYYY): ${sheetStatusDate}`);
      }
      // Convert MM/DD/YYYY (or M/D/YY) to ISO date YYYY-MM-DD
      sheetStatusDate = `${('20' + m[3]).slice(-4)}-${('0' + m[1]).slice(-2)}-${('0' + m[2]).slice(-2)}`;
      if (Number.isNaN(Date.parse(sheetStatusDate))) {
        throw new Errorf(`Sheet Status Date is not valid: ${sheetStatusDate}`);
      }
    }

    for (let rowidx = 0; rowidx < rows.length; rowidx += 1) {
      const row = rows[rowidx];

      if (debug.enabled) {
        debug('Sheet: %s, row: %s: %s', sheet, rowidx, JSON.stringify(row, null, 4));
      }

      // SWInstall name is required, otherwise the row is considered empty (and is skipped).
      const swInstallName = row[COL_NAME] ? String(row[COL_NAME]).trim() : '';
      if (!swInstallName) {
        warn('Sheet: %s, approx. row: %s: SWInstall "name" not specified, skipping row', sheet, rowidx + 1);
        continue;
      }

      // SWInstall hosts are optional.
      const swInstallHosts = row[COL_HOST] ? String(row[COL_HOST]).trim().split(/\s*,\s*/) : [];
      if (swInstallHosts.length === 0) {
        warn('Sheet: %s, name: %s: SWInstall "host" not specified', sheet, swInstallName);
      }

      // SWInstall Statue Date uses the sheet (ie DRR) Status Date by default.
      let swInstallStatusDate = sheetStatusDate;

      // SWInstall VV Approval Date is optional.
      let swInstallVVApprovalDate = row[COL_VV_APRDATE] ? String(row[COL_VV_APRDATE]).trim() : '';
      if (swInstallVVApprovalDate) {
        const m = swInstallVVApprovalDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if (!m) {
          throw new Errorf('Sheet: %s, name: %s: SWInstall VV Approval Date format is not valid (MM/DD/YYYY): %s',
                                                                        sheet, swInstallName, swInstallVVApprovalDate);
        }
        // Convert MM/DD/YYYY (or M/D/YY) to ISO date YYYY-MM-DD
        swInstallVVApprovalDate = `${('20' + m[3]).slice(-4)}-${('0' + m[1]).slice(-2)}-${('0' + m[2]).slice(-2)}`;
        if (Number.isNaN(Date.parse(swInstallVVApprovalDate))) {
          throw new Errorf('Sheet: %s, name: %s: SWInstall VV Approval date is not valid: %s',
                                                                sheet, swInstallName, swInstallVVApprovalDate);
        }
        // Use V&V Approval Date for Status Date if it is valid.
        swInstallStatusDate = swInstallVVApprovalDate;
      }

      // SWInstall Area is required, if there is at lest one installation.
      let swInstallArea = row[COL_AREA] ? String(row[COL_AREA]).trim() : '';
      if (swInstallArea && (!cfg.area || !cfg.area[swInstallArea])) {
        throw new Errorf(`Sheet: %s, name: %s: SWInstall unknown Area: %s`, sheet, swInstallName, swInstallArea);
      }
      swInstallArea = String(cfg.area[swInstallArea]);
      if (!swInstallArea) {
        if (swInstallHosts.length === 0) {
          warn(`Sheet: ${sheet}, name: ${swInstallName}: SWInstall Area is empty`);
        } else {
          throw new Errorf(`Sheet: ${sheet}, name: ${swInstallName}: SWInstall Area is required`);
        }
      }

      // SWInstall Status is required, if there is at least one installation.
      let swInstallStatus = row[COL_STATUS] ? String(row[COL_STATUS]).trim() : '';
      if (swInstallStatus && (!cfg.status || !cfg.status[swInstallStatus])) {
        throw new Errorf(`Sheet: %s, name %s: SWInstall unknown Status: %s`, sheet, swInstallName, swInstallStatus);
      }
      swInstallStatus = String(cfg.status[swInstallStatus]);
      if (!swInstallStatus) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: SWInstall Status is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name: %s: SWInstall Status is required', sheet, swInstallName);
        }
      }

      // SWInstall VV Results Location is optional, but recommended!
      const swInstallVVResultsLoc = row[COL_VV_RESULTS] ? String(row[COL_VV_RESULTS]).trim() : '';
      if (!swInstallVVResultsLoc) {
        warn('Sheet: %s, name: %s: SWInstall VV Results Location is empty', sheet, swInstallName);
      }

      // Software Name is required.
      const softwareName = row[COL_NAME_1] ? String(row[COL_NAME_1]).trim() : '';
      if (!softwareName) {
        throw new Errorf('Sheet: %s, name: %s: Software Name is required', sheet, swInstallName);
      }

      // Software Description is required if there is at least one installation.
      const softwareDesc = row[COL_DESCRIPTION] ? String(row[COL_DESCRIPTION]).trim() : '';
      if (!softwareDesc) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: Software Description is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name: %s: Software Description is required', sheet, swInstallName);
        }
      }

      // Software Branch is a constant.
      const softwareBranch = '';

      // Software version is required if there is at least one installation.
      const softwareVersion = row[COL_VERSION] ? String(row[COL_VERSION]).trim() : '';
      if (!softwareVersion) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: Software Version is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name %s: Software Version is required', sheet, swInstallName);
        }
      }

      // Software Level of Care is required.
      const softwareLevelOfCare = row[COL_LOC] ? String(row[COL_LOC]).trim().toUpperCase() : '';
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(softwareLevelOfCare)) {
        throw new Errorf(`Sheet: ${sheet}, row: ${rowidx + 1}: Software level of care is required`);
      }

      // Software Owner is required.
      let softwareOwner = row[COL_OWNER] ? String(row[COL_OWNER]).trim() : '';
      if (!cfg.owner || !cfg.owner[softwareOwner]) {
        throw new Errorf('Sheet: %s, row: %s: Software unknown Owner: %s', sheet, swInstallName, softwareOwner);
      }
      softwareOwner = String(cfg.owner[softwareOwner]);

      // Software Engineer is required if there is a least one installation.
      let softwareEngineer = row[COL_ENGINEER] ? String(row[COL_ENGINEER]).trim() : '';
      if (softwareEngineer && (!cfg.engineer || !cfg.engineer[softwareEngineer])) {
        throw new Errorf(`Sheet: %s, name: %s: Software unknown Engineer: %s`,
                                                         sheet, swInstallName, softwareEngineer);
      }
      softwareEngineer = String(cfg.engineer[softwareEngineer]);
      if (!softwareEngineer) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: Software Engineer is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name: %s: Software Engineer is required', sheet, swInstallName);
        }
      }

      // Software Version Control is required if there is at least one installation.
      let softwareVersionControl = row[COL_VCS_TYPE] ? String(row[COL_VCS_TYPE]).trim() : '';
      if (softwareVersionControl && (!cfg.vcs || !cfg.vcs[softwareVersionControl])) {
        throw new Errorf('Sheet: %s, name: %s: Software unknown Version Control: %s',
                                                          sheet, swInstallName, softwareVersionControl);
      }
      softwareVersionControl = String(cfg.vcs[softwareVersionControl]);
      if (!softwareVersionControl) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: Software Version Control is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name: %s: Software Version Control is required', sheet, swInstallName);
        }
      }

      // Software Version Control Location is required if there is at least one installation.
      const softwareVersionControlLoc = row[COL_VCS_LOCATION] ? String(row[COL_VCS_LOCATION]).trim() : '';
      if (!softwareVersionControlLoc) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: Software Version Control Location is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name: %s: Software Version Control Location is required', sheet, swInstallName);
        }
      }

      // Software Platforms  is required if there is at least one installation.
      const softwarePlatforms = row[COL_PLATFORMS] ? String(row[COL_PLATFORMS]).trim() : '';
      if (!softwarePlatforms) {
        if (swInstallHosts.length === 0) {
          warn('Sheet: %s, name: %s: Software Platforms is empty', sheet, swInstallName);
        } else {
          throw new Errorf('Sheet: %s, name: %s: Software Platforms is required', sheet, swInstallName);
        }
      }

      // Software Status is RDY_INST if there is at least one installation.
      let softwareStatus = 'RDY_INST';
      if (swInstallHosts.length === 0) {
        softwareStatus = 'DEVEL';
      }

      // Softweare Status Date is the sheet Status Date or the VV Approval Date
      let softwareStatusDate = sheetStatusDate;
      if (swInstallVVApprovalDate) {
        softwareStatusDate = swInstallVVApprovalDate;
      }

      const softwareKey =  genSoftwareKey(softwareName, softwareVersion);

      let software = softwareDB.get(softwareKey);
      if (software) {
        if (software.owner !== softwareOwner) {
          warn('Software found with key: "%s", except "%s" !== "%s"',
                                      softwareKey, software.owner, softwareOwner);
        }
        if (software.engineer !== softwareEngineer) {
          warn('Software found with key: "%s", except "%s" !== "%s"',
                                softwareKey, software.engineer, softwareEngineer);
        }
        if (software.levelOfCare !== softwareLevelOfCare) {
          warn('Software found with key: "%s", except "%s" !== "%s"',
                          softwareKey, software.levelOfCare, softwareLevelOfCare);
        }
        if (software.platforms !== softwarePlatforms) {
          warn('Software found with key: "%s", except "%s" !== "%s"',
                              softwareKey, software.platforms, softwarePlatforms);
        }
        if (software.versionControl !== softwareVersionControl) {
          warn('Software found with key: "%s", except "%s" !== "%s"',
                    softwareKey, software.versionControl, softwareVersionControl);
        }
        if (software.versionControlLoc !== softwareVersionControlLoc) {
          warn('Software found with key: "%s", except "%s" !== "%s"',
              softwareKey, software.versionControlLoc, softwareVersionControlLoc);
        }
        info('Existing Software with key: "%s", skipping it', softwareKey);
      } else {
        software = {
          _id: mongoose.Types.ObjectId(),
          name: softwareName,
          desc: softwareDesc,
          status: softwareStatus,
          statusDate: new Date(softwareStatusDate),
          branch: softwareBranch,
          version: softwareVersion,
          descDocLoc: '',
          designDocLoc: '',
          vvProcLoc: [],
          vvResultsLoc: [],
          owner: softwareOwner,
          engineer: softwareEngineer,
          levelOfCare: softwareLevelOfCare,
          platforms: softwarePlatforms,
          versionControl: softwareVersionControl,
          versionControlLoc: softwareVersionControlLoc,
          comment: `Imported from file: ${path.basename(fileName)}`,
        };
        softwares.push(software);
        softwareDB.set(softwareKey, software);
        info('New Software with key: "%s", adding it', softwareKey);
      }

      for (const host of swInstallHosts) {
        const swInstallKey = genSWInstallKey(host, swInstallName, software._id);
        if (swInstallDB.has(swInstallKey)) {
          throw new Errorf('SWInstall exists with key: "%s"', swInstallKey);
        }

        const swInstall: ISWInstall = {
          _id: undefined,
          host: host,
          name: swInstallName,
          area: swInstallArea ? [ swInstallArea ] : [],
          status: swInstallStatus,
          statusDate: new Date(swInstallStatusDate),
          vvResultsLoc: swInstallVVResultsLoc ? [ swInstallVVResultsLoc ] : [],
          vvApprovalDate: swInstallVVApprovalDate ?  new Date(swInstallVVApprovalDate) : undefined,
          software: software._id,
          drr: sheet,
        };
        swInstalls.push(swInstall);
        swInstallDB.set(swInstallKey, swInstall);
        info('New SWInstall with key: "%s"', swInstallKey);
      }
    }
  }
  return;
}

function genSoftwareKey(name: string, version: string): string {
  return `${name}-${version}`;
}

function genSWInstallKey(host: string, name: string, swid: string): string {
  return `${host}-${name}-${swid}`;
}

main().catch((err: any) => {
  process.exitCode = 1;
  error(err);
});
