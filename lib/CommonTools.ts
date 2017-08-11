import rc = require('rc');
import fs = require('fs');

export class CommonTools {
  constructor () {}

  getConfiguration = function () {
    // acquire configuration
    let props = {};
    if (fs.existsSync('./config/swdbrc')) {
      let stripJSON = require('strip-json-comments');
      props = JSON.parse(stripJSON(fs.readFileSync('./config/swdbrc', 'utf8')));
    }
    let rcw = rc("swdb", props);
    return rcw;
  }

}