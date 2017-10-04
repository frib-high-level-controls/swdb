import fs = require('fs');
import rc = require('rc');
import {LevelOfCareEnum} from '../../../config/swdbEnums';
import {StatusEnum} from '../../../config/swdbEnums';
import {InstStatusEnum} from '../../../config/swdbEnums';
import {RcsEnum} from '../../../config/swdbEnums';
import {AreaEnum} from '../../../config/swdbEnums';

export class CommonTools {

  public getConfiguration = () => {
    // acquire configuration
    let props = null;
    if (fs.existsSync('/home/deployer/swdb/config/swdbrc')) {
      const stripJSON = require('strip-json-comments');
      props = JSON.parse(stripJSON(fs.readFileSync('/home/deployer/swdb/config/swdbrc', 'utf8')));
    }
    const rcw = rc('swdb', props);

    // Add the enums
    rcw.LevelOfCare = LevelOfCareEnum;
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

    return rcw;
  }
}
