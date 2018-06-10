import fs = require('fs');
import rc = require('rc');
import {LevelOfCareEnum} from './swdbEnums';
import {StatusEnum} from './swdbEnums';
import {InstStatusEnum} from './swdbEnums';
import {RcsEnum} from './swdbEnums';
import forgapi = require('../shared/forgapi');
import dbg = require('debug');
const debug = dbg('swdb:CommonTools');

export class CommonTools {
  private static props: IProps;

  public constructor() {
    // Only populate props the first time we instantiate.
    // Other times just return the values we already have
    if (!CommonTools.props) {
      // acquire configuration
      const rcw = rc('swdb', CommonTools.props);

      // rc module holds the requested --config file in .config
      // and the loaded files in array .configs. Make sure the
      // requested file loaded or error
      if (!rcw.configs || (rcw.config !== rcw.configs[0])) {
        throw new Error('Config file ' + rcw.config + ' not loaded...');
      }

      // Add the enums
      rcw.LevelOfCareEnum = LevelOfCareEnum;
      rcw.StatusEnum = StatusEnum;
      rcw.InstStatusEnum = InstStatusEnum;
      rcw.RcsEnum = RcsEnum;

      // Add the enum labels
      // Go through the enums and filter names for the select labels
      rcw.levelOfCareKeys = Object.keys(LevelOfCareEnum);
      rcw.levelOfCareLabels = rcw.levelOfCareKeys.map(function (item: number) {
        return LevelOfCareEnum[item];
      });
      rcw.statusKeys = Object.keys(StatusEnum);
      rcw.statusLabels = rcw.statusKeys.map(function (item: number) {
        return StatusEnum[item];
      });
      rcw.instStatusKeys = Object.keys(InstStatusEnum);
      rcw.instStatusLabels = rcw.instStatusKeys.map(function (item: number) {
        return InstStatusEnum[item];
      });
      rcw.rcsKeys = Object.keys(RcsEnum);
      rcw.rcsLabels = rcw.rcsKeys.map(function (item: number) {
        return RcsEnum[item];
      });

      // Go through the enums and filter names for the select labels
      rcw.areaLabels = [];
      for (const key in rcw.AreaEnum) {
        if (!key.match(/^\d+/)) {
          rcw.areaLabels.push(key);
        }
      }
      CommonTools.props = rcw;
    } else {
      // we already have props loaded.
    }
  }

  public getConfiguration = () => {
    debug('Returning config...');
    return CommonTools.props;
  }

/**
 * getForgGroupsTestFile gets the specified file data as json
 */
  public getForgGroupsTestFile = (): forgapi.Group[] => {
    // Prepare the source location by looking at the properties useSource
    const source =
      CommonTools.props.forgGroupsDataSource[CommonTools.props.forgGroupsDataSource.useSource];
    // debug('forg group source is: ' + source);
    let groupdata: forgapi.Group[] = [];
    let raw = fs.readFileSync(source, { encoding: 'utf-8' });
    groupdata = JSON.parse(raw);
    // debug('forg group json data is: ' + JSON.stringify(groupdata));
    return groupdata;
  }

  /**
   * getForgUsersTestFile gets the specified file data as json
   */
  public getForgUsersTestFile = (): forgapi.User[] => {
    // Prepare the source location by looking at the properties useSource
    const source: string  = CommonTools.props.forgUsersDataSource[CommonTools.props.forgUsersDataSource.useSource];
    let userdata: forgapi.User[] = [];
    let raw = fs.readFileSync(source, { encoding: 'utf-8' });
    userdata = JSON.parse(raw);
    // debug('forg group json data is: ' + JSON.stringify(userdata));
    return userdata;
  }
}

export interface IProps {
  apiUrl: string;
  instApiUrl: string;
  ccdbApiUrl: string;
  slotsDataSource: {
    [index: string]: string;
    useSource: string;
    test: string;
    production: string;
  };
  forgGroupsDataSource: {
    [index: string]: string;
    useSource: string;
    testFile: string;
    production: string;
  };
  forgUsersDataSource: {
    [index: string]: string;
    useSource: string;
    testFile: string;
    production: string;
  };
  restPort: string;
  webUrl: string;
  webUrlProxy: string;
  webPort: string;
  mongodbUrl: string;
  auth: {
    cas: {
      append_path: boolean;
      version: string;
      cas_url: string;
      service_url: string;
    };
    forgapi: {
      url: string;
      agentOptions: {};
    };
  };
  CORS: {
    origin: string;
    methods: string;
    headers: string;
  };
  test: {
    testing: string;
    swTestDataFile: string;
    instTestDataFile: string;
    username: string;
    password: string;
    showLogs: string;
  };

  LevelOfCareEnum: {[index: string]: LevelOfCareEnum};
  StatusEnum: {[index: string]: StatusEnum};
  InstStatusEnum: {[index: string]: InstStatusEnum};
  RcsEnum: {[index: string]: RcsEnum};

  levelOfCareLabels: [string];
  statusLabels: [string];
  instStatusLabels: [string];
  rcsLabels: [string];
  areaLabels: [string];
}
