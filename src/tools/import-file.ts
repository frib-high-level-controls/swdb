/**
 * Import data from a xls file to the database.
 */
//import * as fs from 'fs';
import * as path from 'path';

import * as dbg from 'debug';
import rc = require('rc');
import mongoose = require('mongoose');
import XLSX = require('xlsx');

import * as history from '../app/shared/history';
import { Db } from '../app/lib/Db';
import { InstDb } from '../app/lib/instDb';

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
  statusDate: Date;
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
  statusDate: Date;
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

  //let models = new Map<string, mongoose.Model<mongoose.Document>>();
  let combinedData: CombinedJson = {swData: [], instData: []};
  for (let filePath of cfg._) {
    let absFilePath = path.resolve(String(filePath));
    let name = path.basename(absFilePath);
    console.log('filename %s %s', name, absFilePath);
    // Convert xlsx to json
    let combinedDataLocal = getXlsxJson(name, cfg);
    for (let i =0; i < combinedDataLocal.swData.length; i++) {
      combinedData.swData.push(combinedDataLocal.swData[i]);
    }
    for (let i =0; i < combinedDataLocal.instData.length; i++) {
      combinedData.instData.push(combinedDataLocal.instData[i]);
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
  //console.log('swDataDoc %s', swDataDoc.toString());
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
  console.log('cfg.mongo.addr %s port %s db %s', cfg.mongo.addr, cfg.mongo.port, cfg.mongo.db)
  mongoUrl += cfg.mongo.addr + ':' + cfg.mongo.port + '/' + cfg.mongo.db;

  await mongoose.connect(mongoUrl, cfg.mongo.options);
  // Clean DB before saving data
  await mongoose.connection.db.dropDatabase();

  const updatedBy = cfg.user ? String(cfg.user) : 'system';

  for (let doc of swDataDoc) {
    try {
      if (typeof (<HistoryDocument>doc).saveWithHistory === 'function') {
        await (<HistoryDocument>doc).saveWithHistory(updatedBy);
      } else {
        await doc.save();
      }
    } catch (err) {
      error(err);
    }
  }

  for (let doc of instDataDoc) {
    try {
      if (typeof (<HistoryDocument>doc).saveWithHistory === 'function') {
        await (<HistoryDocument>doc).saveWithHistory(updatedBy);
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
function getXlsxJson(fileName: any, cfg: Config) {
  // Read data from sheet
  let workbook = XLSX.readFile(fileName);
  let swDataArray: SWDataRow[] = [];
  let instDataArray: InstDataRow[] = [];
  let swKeyList = new Map<string, mongoose.Types.ObjectId>();
  let instKeyList = new Map<string, boolean>();

  for (let i = 0; i < workbook.SheetNames.length; i++) {
    let sheetName = workbook.SheetNames[i];
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
      let parseRow = JSON.parse(JSON.stringify(row));

      if (!parseRow["Name"]) {
        continue;
      }

      let keyStr: string = parseRow["Name_1"] + '-' + parseRow["Version"];

      if (swKeyList.get(keyStr)) {
        info('Found existing swName: %s version %s skipping add', parseRow["Name_1"], parseRow["Version"]);
      } else {
        swKeyList.set(keyStr, mongoose.Types.ObjectId());
        let swData: SWDataRow = {
          swName: '', desc: '', status: 'RDY_INSTALL', version: '',
          owner: '', engineer: '', levelOfCare: 'NONE',
          platforms: '', versionControl: 'Other', versionControlLoc: '',
          _id: undefined, statusDate: new Date()
        };
        swData.swName = parseRow["Name_1"];
        swData.desc = parseRow["Description"];
        swData.status = 'RDY_INSTALL';
        //swData.statusDate = parseRow["V&V Date"];
        swData.statusDate = new Date();
        swData.version = parseRow["Version"]
        swData.owner = (cfg.owner && cfg.owner[parseRow["Owner"]]) ? cfg.owner[parseRow["Owner"]] : parseRow["Owner"];
        swData.engineer = (cfg.engineer && cfg.engineer[parseRow["Engineer"]]) ? cfg.engineer[parseRow["Engineer"]] : parseRow["Engineer"];
        swData.levelOfCare = (<string>parseRow["Level Of Care"]).toUpperCase();
        swData.platforms = parseRow["Platforms"];
        swData.versionControl = parseRow["VCS Type"] === 'Archive' ? 'Other' : (parseRow["VCS Type"] === 'AssetCenter' ? 'AssetCentre' : parseRow["VCS Type"]);
        swData.versionControlLoc = parseRow["VCS Location"];
        swData._id = swKeyList.get(keyStr);

        swDataArray.push(swData);
      }
      if (parseRow["Host"]) {
        let hosts: string[] = parseRow["Host"].split(',');
        for (let host of hosts) {
          let instKeyStr = host + '-' + parseRow["Name"] + '-' + swKeyList.get(keyStr);
          if (instKeyList.get(instKeyStr)) {
            info('Found existing installation %s skipping add', instKeyStr);
          } else {
            instKeyList.set(instKeyStr, true);
            let instData: InstDataRow = {
              host: '', name: '', area: '', status: 'RDY_INSTALL',
              statusDate: new Date(), vvResultsLoc: '', software: undefined, drrs: ''
            };
            instData.host = host;
            instData.name = parseRow["Name"];
            instData.area = (cfg.area && cfg.area[parseRow["Area"]]) ? cfg.area[parseRow["Area"]] : parseRow["Area"];
            instData.status = 'RDY_INSTALL';
            instData.statusDate = new Date();
            instData.vvResultsLoc = parseRow["VCS Location"];
            instData.software = swKeyList.get(keyStr);
            instData.drrs = sheetName;

            instDataArray.push(instData);
          }
        }
      }
    }
  }
  return ({ swData: swDataArray, instData: instDataArray });
}

main().catch(error);