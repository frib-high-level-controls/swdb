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
  {
    uid: 'DVM',
    fullname: 'Division Manager',
    roles: [ 'USR:DVM', 'GRP:ISF:LAB.DIV', 'GRP:ISF:LAB.DIV#LEADER' ],
  }, {
    uid: 'FEAM',
    fullname: 'FE Area Manager',
    roles: [ 'USR:FEAM', 'GRP:ADB:FRONT_END', 'GRP:ADB:FRONT_END#LEADER' ],
  }, {
    uid: 'FEDM',
    fullname: 'FE Dept Manager',
    roles: [ 'USR:FEDM', 'GRP:ISF:LAB.DIV.FE', 'GRP:ISF:LAB.DIV.FE#LEADER' ],
  }, {
    uid: 'EEDM',
    fullname: 'EE Dept Manager',
    roles: [ 'USR:EESME', 'GRP:ISF:LAB.DIV.EE', 'GRP:ISF:LAB.DIV.EE#LEADER' ],
  }, {
    uid: 'MEDM',
    fullname: 'ME Dept Manager',
    roles: [ 'USR:MESME', 'GRP:ISF:LAB.DIV.ME', 'GRP:ISF:LAB.DIV.ME#LEADER' ],
  }, {
    uid: 'CTRLDM',
    fullname: 'Controls Dept Manager',
    roles: [ 'USR:CTRLDM', 'GRP:ISF:LAB.DIV.CONTROLS', 'GRP:ISF:LAB.DIV.CONTROLS#LEADER' ],
  }, {
    uid: 'CTRLENG',
    fullname: 'Controls Engineer #1',
    roles: [ 'USR:CTRLENG', 'GRP:ISF:LAB.DIV.CONTROLS' ],
  }, {
    uid: 'CTRLENG2',
    fullname: 'Controls Engineer #2',
    roles: [ 'USR:CTRLENG2', 'GRP:ISF:LAB.DIV.CONTROLS' ],
  }, {
    uid: 'LSM',
    fullname: 'Laboratory Safety Manager',
    roles: [ 'USR:LSM' ],
  },
];

export const GROUPS: forgapi.Group[] = [
  {
    uid: 'ISF:LAB.DIV',
    fullname: 'Arbitrary Lab Division',
    leader: 'DVM',
    source: 'ISF',
    srcname: 'LAB.DIV',
    type: 'DIV',
  }, {
    uid: 'ISF:LAB.DIV.FE',
    fullname: 'Front End Department',
    leader: 'FEDM',
    source: 'ISF',
    srcname: 'LAB.DIV.FE',
    type: 'DEPT',
  }, {
    uid: 'ISF:LAB.DIV.EE',
    fullname: 'Electrical Engineering Department',
    leader: 'EEDM',
    source: 'ISF',
    srcname: 'LAB.DIV.EE',
    type: 'DEPT',
  }, {
    uid: 'ISF:LAB.DIV.ME',
    fullname: 'Mechanical Engineering Department',
    leader: 'MEDM',
    source: 'ISF',
    srcname: 'LAB.DIV.ME',
    type: 'DEPT',
  }, {
    uid: 'ISF:LAB.DIV.CONTROLS',
    fullname: 'Controls Department',
    leader: 'CTRLDM',
    source: 'ISF',
    srcname: 'LAB.DIV.CONTROLS',
    type: 'DEPT',
  }, {
    uid: 'ISF:LAB.DIV.CONTROLS.HLC',
    fullname: 'HL Controls Group',
    leader: 'CTRLDM',
    source: 'ISF',
    srcname: 'LAB.DIV.CONTROLS.HLC',
    type: 'GROUP',
  }, {
    uid: 'ADB:FRONT_END',
    fullname: 'Front End Area',
    leader: 'FEAM',
    source: 'ADB',
    srcname: 'FRONT_END',
    type: 'AREA',
  }, {
    uid: 'ADB:CRYO',
    fullname: 'Cryogenics Area',
    leader: 'CRYOAM',
    source: 'ADB',
    srcname: 'CRYO',
    type: 'AREA',
  }, {
    uid: 'ADB:TARGET',
    fullname: 'Target Area',
    leader: 'TARGAM',
    source: 'ADB',
    srcname: 'TARGET',
    type: 'AREA',
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
  forgapi.MockClient.getInstance().addGroup(GROUPS);

  for (const software of SOFTWARES) {
    await new Software(software).saveWithHistory('SYS:TEST');
  }

  for (const swinstall of SWINSTALLS) {
    await new SWInstall(swinstall).saveWithHistory('SYS:TEST');
  }
}
