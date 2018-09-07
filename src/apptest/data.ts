/* tslint:disable:line
/*
 * Utility for loading test data.
 */
import * as mongoose from 'mongoose';

// Get mock-forgapi module from application (not apptest!)
import * as forgapi from '../app/shared/mock-forgapi';

import {
  Software,
} from '../app/models/software';

import {
  SWInstall,
} from '../app/models/swinstall';

export const PROPS = {
  webUrl: 'http://localhost:3000/', // Maybe this should come from the application?
  test: {
    username: 'FEDM',
    password: 'pas5w0rd',
  },
};

export const USERS: forgapi.User[] = [
  { uid: 'FEAM',
    fullname: 'FE Area Manager',
    roles: [ 'USR:FEAM', 'GRP:ADB:FRONT_END', 'GRP:ADB:FRONT_END#LEADER' ],
  }, {
    uid: 'FEDM',
    fullname: 'FE Dept Manager',
    roles: [ 'USR:FEDM', 'GRP:ISF:LAB.DIV.FE', 'GRP:ISF:LAB.DIV.FE#LEADER' ],
  }, {
    uid: 'EESME',
    fullname: 'EE Subject Matter Expert',
    roles: [ 'USR:EESME', 'GRP:ISF:LAB.DIV.EE', 'GRP:ISF:LAB.DIV.EE#LEADER' ],
  }, {
    uid: 'MESME',
    fullname: 'ME Subject Matter Expert',
    roles: [ 'USR:MESME', 'GRP:ISF:LAB.DIV.ME', 'GRP:ISF:LAB.DIV.ME#LEADER' ],
  }, {
    uid: 'ALTSME',
    fullname: 'Alternative Subject Matter Expert',
    roles: [ 'USR:ALTSME', 'GRP:ISF:LAB.DIV.GRP' ],
  }, {
    uid: 'LSM',
    fullname: 'Laboratory Safety Manager',
    roles: [ 'USR:LSM' ],
  },
];


export const SOFTWARES: any = [
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'Test Record','version':'0.1','branch':'b1','comment':'EPICS Dictionary server'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'Test Record2','version':'0.2','branch':'b1','comment':'EPICS Dictionary server'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'Test Record3','version':'0.3','branch':'b1','comment':'EPICS Dictionary server'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'Test Record4','version':'0.4','branch':'b1','comment':'EPICS Dictionary server'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b2','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b3','_id':'5947589458a6aa0face9a553','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b4','_id':'5947589458a6aa0face9a554','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b5','_id':'5947589458a6aa0face9a555','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b6','_id':'5947589458a6aa0face9a556','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b7','_id':'5947589458a6aa0face9a557','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b8','_id':'5947589458a6aa0face9a558','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b9','_id':'5947589458a6aa0face9a559','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b10','_id':'5947589458a6aa0face9a510','_v':'0','comment':'alarm configuration binary'},
  {'status':'DEVEL','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b11','_id':'5947589458a6aa0face9a511','_v':'0','comment':'alarm configuration binary'},
  {'status':'RDY_INST','levelOfCare':'MEDIUM','statusDate':'1970-07-07T07:00:00.000Z','owner':'Berryman','swName':'BEAST','version':'0.2','branch':'b12','_id':'5947589458a6aa0face9a512','_v':'0','comment':'alarm configuration binary'},
];

export const SWINSTALLS: any =  [
  {
    'host':'host1',
    'name': 'Installation name1',
    'area':'FE',
    'slots':'slot1',
    'status':'RDY_INST',
    'statusDate':'9/21/2016',
    'software':'5947589458a6aa0face9a553',
    'vvResultsLoc':'vvResultsLoc1',
    'ddrs':'ddr1',
  }, {
    'host':'host2',
    'name': 'Installation name2',
    'area':'LS1','slots':'slot2',
    'status':'RDY_INST',
    'statusDate':'9/21/2016',
    'software':'5947589458a6aa0face9a554',
    'vvResultsLoc':'vvResultsLoc2',
    'vvApprovalDate':'9/22/2016',
    'ddrs':'ddr2',
  }, {
    'host':'host3',
    'name': 'Installation name3',
    'area':'Global',
    'slots':'slot3',
    'status':'RDY_INST',
    'statusDate':'9/21/2016',
    'software':'5947589458a6aa0face9a555',
    'vvResultsLoc':'vvResultsLoc3',
    'ddrs':'ddr3',
  },
];


export async function clear(): Promise<void> {
  forgapi.MockClient.getInstance().clear();
  await mongoose.connection.db.dropDatabase();
}

export async function initialize(): Promise<void> {
  // clear the database
  await clear();

  forgapi.MockClient.getInstance().addUser(USERS);
  // forgapi.MockClient.getInstance().addGroup();

  for (const software of SOFTWARES) {
    await new Software(software).saveWithHistory('SYS:TEST');
  }

  for (const swinstall of SWINSTALLS) {
    await new SWInstall(swinstall).saveWithHistory('SYS:TEST');
  }
}
