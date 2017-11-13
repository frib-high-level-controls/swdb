import fs = require('fs');
import rc = require('rc');
import {LevelOfCareEnum} from './swdbEnums';
import {StatusEnum} from './swdbEnums';
import {InstStatusEnum} from './swdbEnums';
import {RcsEnum} from './swdbEnums';
import {AreaEnum} from './swdbEnums';

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
      rcw.AreaEnum = AreaEnum;

      // Add the enum labels
      rcw.levelOfCareLabels = [];
      // Go through the enums and filter names for the select labels
      for (const key in rcw.LevelOfCareEnum) {
        if (!key.match(/^\d+/)) {
          rcw.levelOfCareLabels.push(key);
        }
      }
      rcw.statusLabels = [];
      // Go through the enums and filter names for the select labels
      for (const key in rcw.StatusEnum) {
        if (!key.match(/^\d+/)) {
          rcw.statusLabels.push(key);
        }
      }
      rcw.instStatusLabels = [];
      // Go through the enums and filter names for the select labels
      for (const key in rcw.InstStatusEnum) {
        if (!key.match(/^\d+/)) {
          rcw.instStatusLabels.push(key);
        }
      }
      rcw.rcsLabels = [];
      for (const key in rcw.RcsEnum) {
        if (!key.match(/^\d+/)) {
          rcw.rcsLabels.push(key);
        }
      }
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
    return CommonTools.props;
  }
}

interface IProps {
  apiUrl: string;
  instApiUrl: string;
  ccdbApiUrl: string;
  slotsDataSource: {
    useSource: string;
    test: string;
    production: string;
  };
  restPort: string;
  webUrl: string;
  webUrlProxy: string;
  webPort: string;
  mongodbUrl: string;
  auth: {
    cas: string;
    service: string;
    login_service: string;
  };
  CORS: {
    oringin: string;
    method: string;
    headers: string;
  };
  test: {
    swTestDataFile: string;
    instTestDataFile: string;
  };

  levelOfCareLabels: [string];
  statusLabels: [string];
  instStatusLabels: [string];
  rcsLabels: [string];
  areaLabels: [string];
}