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

interface HistoryDocument extends history.Document<HistoryDocument> {};

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
  user?: {};
  dryrun?: {};
  _?: Array<{}>;
  engineer?: {[key: string]: string };
  area?: {[key: string]: string };
  owner?: {[key: string]: string };
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
    mongo: {
      port: '27017',
      addr: 'localhost',
      db: 'swdb-dev',
      options: {
        // see http://mongoosejs.com/docs/connections.html
        useMongoClient: true,
      },
    },
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
    info(`Usage: import-file [ options ] data.json [ ... ]

    Options
        --help               display help information
        --config [rcfile]    load configuration from rcfile
        --user [username]    username to use when saving with history
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
    let name = path.basename(absFilePath);
    info('filename %s %s', name, absFilePath);
    // Convert xlsx to json
    let combinedDataLocal = getXlsxJson(name, cfg);
    for (let data of combinedDataLocal.swData) {
      combinedData.swData.push(data);
    }
    for (let data of combinedDataLocal.instData) {
      combinedData.instData.push(data);
    }
  }

  let valid = true;
  let swDataDoc: mongoose.Document[] = [];
  new Db();
  for (let d of combinedData.swData) {
    info('Create swDb and validate: %s', JSON.stringify(d));
    let doc = new Db.swDoc(d);
    try {
      await doc.validate();
    } catch (err) {
      valid = false;
      error(err);
    }
    swDataDoc.push(doc);
  }

  let instDataDoc: mongoose.Document[] = [];
  new InstDb();
  for (let d of combinedData.instData) {
    info('Create instDB and validate: %s', JSON.stringify(d));
    let doc = new InstDb.instDoc(d);
    try {
      await doc.validate();
    } catch (err) {
      valid = false;
      error(err);
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
  info('cfg.mongo.addr %s port %s db %s', cfg.mongo.addr, cfg.mongo.port, cfg.mongo.db);
  mongoUrl += cfg.mongo.addr + ':' + cfg.mongo.port + '/' + cfg.mongo.db;

  await mongoose.connect(mongoUrl, cfg.mongo.options);
  // Clean DB before saving data
  await mongoose.connection.db.dropDatabase();

  const updatedBy = cfg.user ? String(cfg.user) : 'system';

  for (let doc of swDataDoc) {
    try {
      if (typeof (<HistoryDocument> doc).saveWithHistory === 'function') {
        await (<HistoryDocument> doc).saveWithHistory(updatedBy);
      } else {
        await doc.save();
      }
    } catch (err) {
      error(err);
    }
  }

  for (let doc of instDataDoc) {
    try {
      if (typeof (<HistoryDocument> doc).saveWithHistory === 'function') {
        await (<HistoryDocument> doc).saveWithHistory(updatedBy);
      } else {
        await doc.save();
      }
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
    let sheetName = sheet;
    let worksheet = workbook.Sheets[sheetName];
    info('Looking at sheet %s', sheetName);
    if (!worksheet) {
      console.error('Cannot read data from sheet ' + sheetName + ', please check the config file.');
      process.exit(1);
    }
    let combinedData = XLSX.utils.sheet_to_json(worksheet);
    if (combinedData.length === 0) {
      console.error('Cannot convert data to json for worksheet ' + sheetName);
      process.exit(1);
    }

    for (let row of combinedData) {
      let parseRow = row;

      if (!parseRow['Name']) {
        continue;
      }

      let keyStr: string = parseRow['Name_1'] + '-' + parseRow['Version'];

      if (swKeyList.get(keyStr)) {
        info('Found existing swName: %s version %s skipping add', parseRow['Name_1'], parseRow['Version']);
      } else {
        swKeyList.set(keyStr, mongoose.Types.ObjectId());
        let swData: SWDataRow = {
          swName: parseRow['Name_1'],
          desc: parseRow['Description'],
          status: 'Ready for install',
          version: parseRow['Version'],
          owner: (cfg.owner && cfg.owner[parseRow['Owner']]) ? cfg.owner[parseRow['Owner']] : 'UNKNOWN OWNER',
          engineer: (cfg.engineer && cfg.engineer[parseRow['Engineer']]) ? cfg.engineer[parseRow['Engineer']] :
            'UNKNOWN ENGINEER',
          levelOfCare: (<string> parseRow['Level Of Care']).toUpperCase(),
          platforms: parseRow['Platforms'],
          versionControl: parseRow['VCS Type'] === 'Archive' ? 'Other' : (parseRow['VCS Type'] === 'AssetCenter' ?
            'AssetCentre' : parseRow['VCS Type']),
          versionControlLoc: parseRow['VCS Location'],
          _id: swKeyList.get(keyStr),
          statusDate: Date(),
        };
        swDataArray.push(swData);
      }
      if (parseRow['Host']) {
        let hosts: string[] = parseRow['Host'].split(',');
        for (let host of hosts) {
          let instKeyStr = host + '-' + parseRow['Name'] + '-' + swKeyList.get(keyStr);
          if (instKeyList.get(instKeyStr)) {
            info('Found existing installation %s skipping add', instKeyStr);
          } else {
            instKeyList.set(instKeyStr, true);
            let instData: InstDataRow = {
              host: host,
              name: parseRow['Name'],
              area: (cfg.area && cfg.area[parseRow['Area']]) ? cfg.area[parseRow['Area']] : 'UNKNOWN AREA',
              status: 'Ready for install',
              statusDate: Date(),
              vvResultsLoc: parseRow['VCS Location'],
              software: swKeyList.get(keyStr),
              drrs: sheetName,
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
