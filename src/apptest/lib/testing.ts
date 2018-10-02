/**
 * Utility to check history (consider adding to shared)
 */

import * as _ from 'lodash';

import { Update } from '../../app/shared/history';
import * as models from '../../app/shared/models';


/**
 * Search history for id as an rid field. Sort that list by date and take the latest.
 * Take the original object data as canonical, compare each field to the history,
 * removing each found field from canonCheckList. If empty when done, all is well.
 *
 * Be mindful of object types here. For instance Date object may need to be checked
 * using a string representation. Others may be more complex.
 *
 * @params sdebug Description Debugger channel to report on.
 * @params canonObj Desription The object submitted to the db.
 * @params id Description The db id returned from the object submission.
 */
export async function checkHistory(sdebug: debug.IDebugger, canonObj: {[key: string]: string | Date}, id: number) {
  const canonCheckList = canonObj;
  const cursor = await Update.find({ rid: models.ObjectId(id) }).sort({at: -1}).limit(1).exec();
  // let cursor = Be.Db.swDoc.db.collections.history.find();
  let msg = '';
  try {
    for (const doc of cursor) {
      sdebug('Got history ' + doc._id + ' with  rid ' + id + JSON.stringify(doc));
      for (const canonKey of Object.keys(canonObj)) {
        // we should find an paths array object where name: "name" and value: value
        for (const item of doc.paths) {
          // sdebug('searching element ' + JSON.stringify(item) + ' for ' + canonKey);
          const keyName = 'name';
          if (item[keyName] === canonKey) {
            const val = 'value';
            if (_.isEqual(item[val], canonObj[canonKey])) {
              sdebug('Found name = ' + canonKey + ' AND value = ' + canonObj[canonKey]);
              delete canonCheckList[canonKey];
            } else {
              const val2 = 'value';
              msg = 'History item ' + canonKey + ': ' + item[val2] + ' does not match ' + canonObj[canonKey];
              sdebug(msg);
            }
          }
        }
      }
      if (Object.keys(canonCheckList).length === 0) {
        sdebug('history entry is good ' + JSON.stringify(canonCheckList));
        return('History record matches');
      } else {
        sdebug('Cannot find ' + JSON.stringify(canonCheckList) + ' in history');
        sdebug(Object.keys(canonCheckList));
        return(msg);
      }
    }
  } catch (err) {
    sdebug(err);
  }
}
