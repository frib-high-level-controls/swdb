import fs = require('fs');
import rc = require('rc');
import {InstStatusEnum} from '../../../config/swdbEnums';
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
    rcw.InstStatusEnum = InstStatusEnum;
    rcw.AreaEnum = AreaEnum;
    return rcw;
  }
}
