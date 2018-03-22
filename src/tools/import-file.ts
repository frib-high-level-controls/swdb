/**
 * Import data from a xls file to the database.
 */
import * as path from 'path';

import * as dbg from 'debug';
import rc = require('rc');
import mongoose = require('mongoose');
import XLSX = require('xlsx');

import { Db } from '../app/lib/Db';
import { InstDb } from '../app/lib/instDb';
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

interface HistoryDocument extends history.Document<HistoryDocument> {};

interface Config {
  configs?: string[];
  h?: {};
  help?: {};
  user?: {};
  dryrun?: {};
  _?: Array<{}>;
  engineer: {[key: string]: string };
  area: {[key: string]: string };
  owner: {[key: string]: string };
  statusDate: {[key: string]: string };
};

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

let swKeyList = new Map<string, mongoose.Types.ObjectId>();
let instKeyList = new Map<string, boolean>();

async function main() {
  let cfg: Config = {
    engineer: {},
    area: {},
    owner: {},
    statusDate: {},
  };

  rc('import-file', cfg);
  if (cfg.configs) {
    for (let file of cfg.configs) {
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

  let combinedData: CombinedJson = {swData: [], instData: []};
  for (let filePath of cfg._) {
    let absFilePath = path.resolve(String(filePath));
    info('filepath %s', absFilePath);
    // Convert xlsx to json
    let combinedDataLocal = getXlsxJson(absFilePath, cfg);
    combinedData.swData.push(...combinedDataLocal.swData);
    combinedData.instData.push(...combinedDataLocal.instData);
  }

  let connected = new Promise((resolve, reject) => {
    mongoose.connection.once('error', reject);
    mongoose.connection.once('connected', resolve);
  });
  
  let valid = true;
  let swDataDoc: HistoryDocument[] = [];
  new Db(); // tslint:disable-line
  for (let d of combinedData.swData) {
    info('Create swDb and validate: %s', JSON.stringify(d));
    let doc: HistoryDocument = new Db.swDoc(d);
    try {
      await doc.validate();
    } catch (err) {
      valid = false;
      error(err);
    }
    swDataDoc.push(doc);
  }

  let instDataDoc: HistoryDocument[] = [];
  new InstDb(); // tslint:disable-line
  for (let d of combinedData.instData) {
    info('Create instDB and validate: %s', JSON.stringify(d));
    let doc: HistoryDocument = new InstDb.instDoc(d);
    try {
      await doc.validate();
    } catch (err) {
      valid = false;
      error(err);
    }
    instDataDoc.push(doc);
  }

  if (!valid) {
    await mongoose.disconnect();
    return;
  }

  await connected; // wait for the connection
  await Db.swDoc.init(); // wait for the createIndex
  await InstDb.instDoc.init(); // wait for the createIndex
  
  if (cfg.dryrun !== false && cfg.dryrun !== 'false') {
    info('DRYRUN DONE');
    await mongoose.disconnect();
    return;
  }

  // Clean DB before saving data
  await mongoose.connection.db.dropDatabase();

  const updatedBy = 'system';

  for (let doc of swDataDoc) {
    try {
      await doc.saveWithHistory(updatedBy);
    } catch (err) {
      error(err);
    }
  }

  for (let doc of instDataDoc) {
    try {
      await doc.saveWithHistory(updatedBy);
    } catch (err) {
      error(err);
    }
  }

  await mongoose.disconnect();
};

/**
 * convert data in xlsx to json format, each sheet will be handled
 * @param fileName
 * @returns {Array}
 */
function getXlsxJson(fileName: string, cfg: Config) {
  // Read data from sheet
  let workbook = XLSX.readFile(fileName);
  let swDataArray: SWDataRow[] = [];
  let instDataArray: InstDataRow[] = [];

  for (let sheet of workbook.SheetNames) {
    let worksheet = workbook.Sheets[sheet];
    info('Looking at sheet %s', sheet);
    if (!worksheet) {
      error('Cannot read data from sheet ' + sheet + ', please check the config file.');
      process.exit(1);
    }
    let combinedData = XLSX.utils.sheet_to_json(worksheet);
    if (combinedData.length === 0) {
      error('Cannot convert data to json for worksheet ' + sheet);
      process.exit(1);
    }
    if (cfg.statusDate && !cfg.statusDate[sheet]) {
      error('No Status Date available for sheet %s', sheet);
      process.exit(1);
    }
    for (let row of combinedData) {
      if (!row[COL_NAME]) {
        continue;
      }

      let keyStr: string = row[COL_NAME_1] + '-' + row[COL_VERSION];

      if (swKeyList.get(keyStr)) {
        // Duplicate exists
        for (let data of swDataArray) {
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
            if (data.versionControl !== (row[COL_VCS_TYPE] === 'Archive' ? 'Other' : row[COL_VCS_TYPE])) {
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
        let swData: SWDataRow = {
          swName: row[COL_NAME_1],
          desc: row[COL_DESCRIPTION],
          status: 'Ready for install',
          version: row[COL_VERSION],
          owner: cfg.owner[row[COL_OWNER]],
          engineer: cfg.engineer[row[COL_ENGINEER]],
          levelOfCare: (String(row[COL_LOC])).toUpperCase(),
          platforms: row[COL_PLATFORMS],
          versionControl: row[COL_VCS_TYPE] === 'Archive' ? 'Other' : row[COL_VCS_TYPE],
          versionControlLoc: row[COL_VCS_LOCATION],
          _id: swKeyList.get(keyStr),
          statusDate: cfg.statusDate[sheet],
        };
        swDataArray.push(swData);
      }
      if (row[COL_HOST]) {
        let hosts: string[] = row[COL_HOST].split(',');
        for (let host of hosts) {
          let instKeyStr = host + '-' + row[COL_NAME] + '-' + swKeyList.get(keyStr);
          if (instKeyList.get(instKeyStr)) {
            info('Found existing installation %s, exiting !!', instKeyStr);
            process.exit(1);
          } else {
            instKeyList.set(instKeyStr, true);
            if ((cfg.area && !cfg.area[row[COL_AREA]])) {
              error('Unknown Area Name %s', row[COL_AREA]);
              process.exit(1);
            }
            let instData: InstDataRow = {
              host: host,
              name: row[COL_NAME],
              area: cfg.area[row[COL_AREA]],
              status: 'Ready for install',
              statusDate: cfg.statusDate[sheet],
              vvResultsLoc: row[COL_VCS_LOCATION],
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
