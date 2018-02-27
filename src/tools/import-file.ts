/**
 * Import data from a xls file to the database.
 */
//import * as fs from 'fs';
import * as path from 'path';

import * as dbg from 'debug';
import rc = require('rc');
import mongoose = require('mongoose');
import XLSX = require('xlsx');

//import * as history from '../app/shared/history';

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
};

// interface CombinedDataRow {
//   name: string;
//   description: string;
//   name_1: string;
//   host: string;
//   status: string;
//   version: string;
//   area: string;
//   owner: string;
//   engineer: string;
//   level_of_care: string;
//   platforms: string;
//   vcs_type: string;
//   vcs_location: string;
//   build_tools: string;
//   vv_results: string;
//   vv_date: string;
// };

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
  _id: mongoose.Types.ObjectId;
}

interface InstDataRow {
  host: string;
  name: string;
  area: string;
  status: string;
  statusDate: string;
  vvResultsLoc: string;
  software: mongoose.Types.ObjectId;
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
  
  for (let filePath of cfg._) {
    let absFilePath = path.resolve(String(filePath));
    let name = path.basename(absFilePath, '.xlsx');
    console.log('filename %s', name);
    // Convert xlsx to json
    let combinedData: CombinedJson = getXlsxJson(name);
    console.log('swData %s \n\n', JSON.stringify(combinedData.swData));
    console.log('instData %s', JSON.stringify(combinedData.instData));
  }
  
    // let valid = true;
  
    // let documents = new Map<string, mongoose.Document[]>();
  
    // for (let [filePath, Model] of models.entries()) {
    //   let docs = documents.get(filePath);
    //   if (!docs) {
    //     documents.set(filePath, docs = []);
    //   }
  
    //   let data = await new Promise<Array<{}>>((resolve, reject) => {
    //     debug('Read and parse file: %s', filePath);
    //     fs.readFile(filePath, 'UTF-8', (err, json) => {
    //       if (err) {
    //         reject(err);
    //         return;
    //       }
    //       let d;
    //       try {
    //         d = JSON.parse(json);
    //       } catch (err) {
    //         reject(err);
    //         return;
    //       }
    //       if (!Array.isArray(d)) {
    //         reject(new Error('Array of documents expected'));
    //         return;
    //       }
    //       resolve(d);
    //     });
    //   });
    //   debug('Total data records read: %s', data.length);
  
    //   for (let d of data) {
    //     info('Create %s and validate: %s', Model.modelName, JSON.stringify(d));
    //     let doc = new Model(d);
    //     try {
    //       await doc.validate();
    //     } catch (err) {
    //       valid = false;
    //       error(err);
    //     }
    //     docs.push(doc);
    //   }
    // }
  
    // if (!valid) {
    //   return;
    // }
  
    if (cfg.dryrun !== false && cfg.dryrun !== 'false') {
      info('DRYRUN DONE');
      return;
    }
  
    // // Configure Mongoose (MongoDB)
    // let mongoUrl = 'mongodb://';
    // if (cfg.mongo.user) {
    //   mongoUrl += encodeURIComponent(String(cfg.mongo.user));
    //   if (cfg.mongo.pass) {
    //     mongoUrl += ':' + encodeURIComponent(String(cfg.mongo.pass));
    //   }
    //   mongoUrl += '@';
    // }
    // mongoUrl += cfg.mongo.addr + ':' + cfg.mongo.port + '/' + cfg.mongo.db;
  
    // await mongoose.connect(mongoUrl, cfg.mongo.options);
  
    // const updatedBy = cfg.user ? String(cfg.user) : 'system';
  
    // for (let [_, docs] of documents.entries()) {
    //   for (let doc of docs) {
    //     try {
    //       if (typeof (<HistoryDocument> doc).saveWithHistory === 'function') {
    //         await (<HistoryDocument> doc).saveWithHistory(updatedBy);
    //       } else {
    //         await doc.save();
    //       }
    //     } catch (err) {
    //       error(err);
    //     }
    //   }
    // }
  
    // await mongoose.disconnect();
};

/**
 * convert data in xlsx to json format, each sheet will be handled
 * @param fileName
 * @returns {Array}
 */
function getXlsxJson(fileName: any) {
    // Read data from sheet
    let workbook = XLSX.readFile(fileName);
    let worksheet = workbook.Sheets['DRR01-03'];
    let swDataArray: SWDataRow[] = [];
    let instDataArray: InstDataRow[] = [];
    let lineId = 0;

    if (!worksheet) {
        console.error('Cannot read data from sheet ' + worksheet + ', please check the config file.');
        process.exit(1);
      }
    let combinedData = XLSX.utils.sheet_to_json(worksheet);
    if (combinedData.length === 0) {
      console.error('Cannot convert data to valid json list, please check the config file.');
      process.exit(1);
    }

    for (let row of combinedData) {
      lineId++;
      let parseRow = JSON.parse(JSON.stringify(row));
      let swData: SWDataRow = {swName: 'Undefined', desc: 'Undefined', status: 'RDY_INSTALL', version: 'Undefined',
                              owner: 'Undefined', engineer: 'Undefined', levelOfCare: 'NONE',
                              platforms: 'Undefined', versionControl: 'Other', versionControlLoc: 'Undefined',
                              _id: new mongoose.Types.ObjectId(), statusDate: 'Undefined'};
      swData.swName = parseRow["Name_1"];
      swData.desc = parseRow["Description"];
      swData.status = 'RDY_INSTALL';
      swData.statusDate = parseRow["V&V Date"];
      swData.version = parseRow["Version"]
      swData.owner = parseRow["Owner"];
      swData.engineer = parseRow["Engineer"];
      swData.levelOfCare = parseRow["Level Of Care"];
      swData.platforms = parseRow["Platforms"];
      swData.versionControl = parseRow["VCS Type"];
      swData.versionControlLoc = parseRow["VCS Location"];
      swData._id = mongoose.Types.ObjectId(lineId);

      swDataArray.push(swData);

      if (parseRow["Host"]) {
        let hosts = parseRow["Host"].split(';');
        for (let host of hosts) {
          let instData: InstDataRow = {
            host: 'Undefined', name: 'Undefined', area: 'Undefined', status: 'RDY_INSTALL',
            statusDate: 'Undefined', vvResultsLoc: 'Undefined', software: new mongoose.Types.ObjectId(), drrs: 'Undefined'
          };
          instData.host = host;
          instData.name = swData.swName;
          instData.area = parseRow["Area"];
          instData.status = 'RDY_INSTALL';
          instData.statusDate = swData.statusDate;
          instData.vvResultsLoc = swData.versionControlLoc;
          instData.software = mongoose.Types.ObjectId(lineId);
          instData.drrs = 'DRR01-03';

          instDataArray.push(instData);
        }
      }
    }
    return ({swData: swDataArray, instData: instDataArray});
  }

  main().catch(error);