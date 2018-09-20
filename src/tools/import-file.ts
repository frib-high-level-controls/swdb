/**
 * Import data from a xls file to the database.
 */
import * as path from 'path';

import * as dbg from 'debug';
import mongoose = require('mongoose');
import rc = require('rc');
import XLSX = require('xlsx');

import { Software } from '../app/models/software';
import { SWInstall } from '../app/models/swinstall';

import * as auth from '../app/shared/auth';
import * as history from '../app/shared/history';

// Constants correspond to column names in xlsx file
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

interface HistoryDocument extends history.Document<HistoryDocument> {}

interface Config {
  configs?: string[];
  h?: {};
  help?: {};
  mongo: {
    user?: {};
    pass?: {};
    port: {};
    addr: {};
    db: {};
    options: {};
  };
  dryrun?: {};
  _?: Array<{}>;
  engineer: {[key: string]: {}};
  area: {[key: string]: {}};
  owner: {[key: string]: {}};
  statusDate: {[key: string]: {}};
  status: {[key: string]: {}};
  vcs: {[key: string]: {}};
}

interface SWDataRow {
  swName: string;
  desc: string;
  status: string;
  statusDate: string;
  version: string;
  owner: string;
  engineer: string;
  levelOfCare: string;
  platforms: string;
  versionControl: string;
  versionControlLoc: string;
  _id: mongoose.Types.ObjectId | undefined;
}

interface InstDataRow {
  host: string;
  name: string;
  area: string;
  status: string;
  statusDate: string;
  vvResultsLoc: string;
  vvApprovalDate?: string;
  software: mongoose.Types.ObjectId | undefined;
  drrs: string;
}

interface CombinedJson {
  swData: SWDataRow[];
  instData: InstDataRow[];
}

mongoose.Promise = global.Promise;

const debug = dbg('import-file');

const info = console.info;
const error = console.error;

const swKeyList = new Map<string, mongoose.Types.ObjectId>();
const instKeyList = new Map<string, boolean>();

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

  rc('import-file', cfg);
  if (cfg.configs) {
    for (const file of cfg.configs) {
      info('Load configuration: %s', file);
    }
  }

  if (debug.enabled) {
    debug(JSON.stringify(cfg, null, 4));
  }
  info(JSON.stringify(cfg, null, 4));
  if (cfg.h || cfg.help) {
    info(`Usage: import-file [ options ] data.xlsx [ ... ]

    Options
        --help               display help information
        --config [rcfile]    load configuration from rcfile
        --dryrun [dryrun]    validate CCDB data (default: true)
    `);
    return;
  }

  if (!cfg._ || (cfg._.length === 0)) {
    info('Data file(s) must be specified');
    return;
  }

  const combinedData: CombinedJson = {swData: [], instData: []};
  for (const filePath of cfg._) {
    const absFilePath = path.resolve(String(filePath));
    info('filepath %s', absFilePath);
    // Convert xlsx to json
    const combinedDataLocal = getXlsxJson(absFilePath, cfg);
    combinedData.swData.push(...combinedDataLocal.swData);
    combinedData.instData.push(...combinedDataLocal.instData);
  }

  let valid = true;
  const swDataDoc: HistoryDocument[] = [];
  for (const d of combinedData.swData) {
    info('Create swDoc and validate: %s (Version: %s)', d.swName, d.version);
    const doc: HistoryDocument = new Software(d);
    try {
      await doc.validate();
    } catch (err) {
      valid = false;
      error(err);
      error(JSON.stringify(d, null, 4));
    }
    swDataDoc.push(doc);
  }

  const instDataDoc: HistoryDocument[] = [];
  for (const d of combinedData.instData) {
    info('Create instDoc and validate: %s (Host: %s)', d.name, d.host);
    const doc: HistoryDocument = new SWInstall(d);
    try {
      await doc.validate();
    } catch (err) {
      valid = false;
      error(err);
      error(JSON.stringify(d, null, 4));
    }
    instDataDoc.push(doc);
  }

  if (!valid) {
    return;
  }

  if (cfg.dryrun !== false && cfg.dryrun !== 'false') {
    info('DRYRUN DONE');
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
  mongoUrl += cfg.mongo.addr + ':' + cfg.mongo.port + '/' + cfg.mongo.db;

  // Connect and wait for autoIndex to complete
  await mongoose.connect(mongoUrl, cfg.mongo.options);
  await (Software as any).init(); // @types/mongoose@4.7.39 does not include this method!
  await (SWInstall as any).init(); // @types/mongoose@4.7.39 does not include this method!
  info('Connected to database: mongodb://%s:%s/%s', cfg.mongo.addr, cfg.mongo.port, cfg.mongo.db);

  // Clean DB before saving data
  await mongoose.connection.db.dropDatabase();

  const updatedBy = auth.formatRole(auth.RoleScheme.SYS, 'IMPORTXLSX');

  for (const doc of swDataDoc) {
    try {
      await doc.saveWithHistory(updatedBy);
    } catch (err) {
      error(err);
    }
  }
  info('Software documents saved with history: %s', swDataDoc.length);

  for (const doc of instDataDoc) {
    try {
      await doc.saveWithHistory(updatedBy);
    } catch (err) {
      error(err);
    }
  }
  info('Installation documents saved with history: %s', instDataDoc.length);

  await mongoose.disconnect();
}

/**
 * convert data in xlsx to json format, each sheet will be handled
 * @param fileName
 * @returns {Array}
 */
function getXlsxJson(fileName: string, cfg: Config) {
  // Read data from sheet
  const workbook = XLSX.readFile(fileName);
  const swDataArray: SWDataRow[] = [];
  const instDataArray: InstDataRow[] = [];

  for (const sheet of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheet];
    info('Looking at sheet %s', sheet);
    if (!worksheet) {
      error('Cannot read data from sheet ' + sheet + ', please check the config file.');
      process.exit(1);
    }
    const combinedData = XLSX.utils.sheet_to_json(worksheet);
    if (combinedData.length === 0) {
      error('Cannot convert data to json for worksheet ' + sheet);
      process.exit(1);
    }
    if (cfg.statusDate && !cfg.statusDate[sheet]) {
      error('No Status Date available for sheet %s', sheet);
      process.exit(1);
    }
    for (const row of combinedData) {
      if (!row[COL_NAME]) {
        continue;
      }

      const keyStr: string = row[COL_NAME_1] + '-' + row[COL_VERSION];

      const vvApprovalDate =  row[COL_VV_APRDATE] ? String(row[COL_VV_APRDATE]) : undefined;
      const statusDate = vvApprovalDate || String(cfg.statusDate[sheet]);

      if (swKeyList.get(keyStr)) {
        // Duplicate exists
        for (const data of swDataArray) {
          // Find the original row to which this row is a duplicate of
          if (data._id === swKeyList.get(keyStr)) {
            // Check if rest of the fields match
            if (data.owner !== cfg.owner[row[COL_OWNER]]) {
              error('Duplicate found for SW %s version %s, but owners do not match !!!',
              row[COL_NAME_1], row[COL_VERSION]);
            }
            if (data.engineer !== cfg.engineer[row[COL_ENGINEER]]) {
              error('Duplicate found for SW %s version %s, but engineers do not match !!!',
              row[COL_NAME_1], row[COL_VERSION]);
            }
            if (data.levelOfCare !== (String(row[COL_LOC])).toUpperCase()) {
              error('Duplicate found for SW %s version %s, but levels of care do not match !!!',
              row[COL_NAME_1], row[COL_VERSION]);
            }
            if (data.platforms !== row[COL_PLATFORMS]) {
              error('Duplicate found for SW %s version %s, but platforms do not match !!!',
              row[COL_NAME_1], row[COL_VERSION]);
            }
            if (data.versionControl !== String(cfg.vcs[row[COL_VCS_TYPE]])) {
              error('Duplicate found for SW %s version %s, but version control types do not match !!!',
              row[COL_NAME_1], row[COL_VERSION]);
            }
            if (data.versionControlLoc !== row[COL_VCS_LOCATION]) {
              error('Duplicate found for SW %s version %s, but version control locations do not match !!!',
              row[COL_NAME_1], row[COL_VERSION]);
            }
          }
        }
        info('Found existing swName: %s version %s skipping add', row[COL_NAME_1], row[COL_VERSION]);
      } else {
        swKeyList.set(keyStr, mongoose.Types.ObjectId());
        if (cfg.owner && !cfg.owner[row[COL_OWNER]]) {
          error('Unknown Owner Name %s', row[COL_OWNER]);
          process.exit(1);
        }
        if (cfg.engineer && !cfg.engineer[row[COL_ENGINEER]]) {
          error('Unknown Engineer Name %s', row[COL_ENGINEER]);
          process.exit(1);
        }
        if (!cfg.vcs[row[COL_VCS_TYPE]]) {
          error('Unknown VCS Name %s', row[COL_VCS_TYPE]);
          process.exit(1);
        }
        const swData: SWDataRow = {
          swName: row[COL_NAME_1],
          desc: row[COL_DESCRIPTION],
          status: 'RDY_INST',
          version: row[COL_VERSION],
          owner: String(cfg.owner[row[COL_OWNER]]),
          engineer: String(cfg.engineer[row[COL_ENGINEER]]),
          levelOfCare: (String(row[COL_LOC])).toUpperCase(),
          platforms: row[COL_PLATFORMS],
          versionControl: String(cfg.vcs[row[COL_VCS_TYPE]]),
          versionControlLoc: row[COL_VCS_LOCATION],
          _id: swKeyList.get(keyStr),
          statusDate: statusDate,
        };
        swDataArray.push(swData);
      }
      if (row[COL_HOST]) {
        const hosts: string[] = row[COL_HOST].split(',');
        for (const host of hosts) {
          const instKeyStr = host + '-' + row[COL_NAME] + '-' + swKeyList.get(keyStr);
          if (instKeyList.get(instKeyStr)) {
            info('Found existing installation %s, exiting !!', instKeyStr);
            process.exit(1);
          } else {
            instKeyList.set(instKeyStr, true);
            if ((cfg.area && !cfg.area[row[COL_AREA]])) {
              error('Unknown Area Name %s', row[COL_AREA]);
              process.exit(1);
            }
            if ((cfg.status && !cfg.status[row[COL_STATUS]])) {
              error('Unknown Status Name %s', row[COL_STATUS]);
              process.exit(1);
            }
            const instData: InstDataRow = {
              host: host,
              name: row[COL_NAME],
              area: String(cfg.area[row[COL_AREA]]),
              status: String(cfg.status[row[COL_STATUS]]),
              statusDate: statusDate,
              vvResultsLoc: String(row[COL_VV_RESULTS]),
              vvApprovalDate: vvApprovalDate,
              software: swKeyList.get(keyStr),
              drrs: sheet,
            };
            instDataArray.push(instData);
          }
        }
      }
    }
  }
  return ({ swData: swDataArray, instData: instDataArray });
}

main().catch(error);
