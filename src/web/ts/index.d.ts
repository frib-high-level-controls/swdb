/**
 * All external type declarations should be referenced here.
 */
/* tslint:disable:no-reference */
/// <reference path="../../app/webapi.d.ts" />

declare let basePath: string;

interface IRouteParams extends ng.route.IRouteParamsService {
  itemId: string;
}

interface IInstService {
  promise: ng.IPromise<void>;
  refreshInstList(): ng.IPromise<void>;
  getInstById(id: string): webapi.Inst[];
  getInstsBySw(id: string): webapi.Inst[];
}

interface IForgArea {
  uid: string;
}
interface SWInst {
  software: string;
}

interface Software {
  swName: string;
  branch?: string;
  version?: string;
}

interface SWMeta {
  [key: string]: Software | undefined;
}

interface IForgUser {
    uid: string;
}

interface IForgSlot {
    uid: string;
}

interface IForgGroup {
    uid: string;
}

interface IAppRoute extends ng.route.IRoute {
  title: string;
}

interface IConfigProps {
  StatusEnum: { [key: string]: string | undefined };
  InstStatusEnum: { [key: string]: string | undefined };
  LevelOfCareEnum: { [key: string]: string | undefined };
  RcsEnum: { [key: string]: string | undefined };
  VersionControlEnum: { [key: string]: string | undefined };
  instStatusLabels: string[];
  statusLabels: string[];
}

interface IConfigService {
  promise: Promise<void>;
  getConfig(): IConfigProps;
}

interface ISession {
  user?: {};
}

interface IRecData {
  updateRecID: string;
  formData: webapi.ISwdb;
}

interface IRecService {
  getRec(): IRecData;
  setRec(obj: IRecData | null ): void;
}

interface IHistory {
  at: string;
  by: string;
  isCollapsed: boolean;
  paths: Array<
  {
    name: string;
    value: string;
  }>;
}

/**
 * Angular controller interfaces
 */

interface IAppRootScopeService extends ng.IRootScopeService {
  title?: string;
}

interface ISwdbDetailsControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.ISwdb;
  statusDisplay: string | undefined;
  statusDateDisplay: string | undefined;
  levelOfCareDisplay: string | undefined;
  versionControlDisplay: string | undefined;
  rawHistory: IHistory[];
  isHistCollapsed: boolean;
  history: string;
  usrBtnClk(): void;
  updateBtnClk(): void;
  bumpVerBtnClk(): void;
}

interface ISwdbNewControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.ISwdb;
  inputForm: any;
  datePicker: any;
  ownerSelected: { item: IForgGroup | undefined };
  engineerSelected: { item: IForgUser | undefined };
  forgUsersList: IForgUser[];
  forgGroupsList: IForgGroup[];
  statusDisplay: string | undefined;
  statusDateDisplay: Date | null;
  levelOfCareDisplay: string | undefined;
  versionControlDisplay: string | undefined;
  rawHistory: IHistory[];
  isHistCollapsed: boolean;
  history: string;
  swdbParams: {
    formStatus: string,
    formErr: string,
    formShowErr: boolean,
    formShowStatus: boolean,
  };
  newItem(event: {currentTarget: HTMLInputElement}): void;
  removeItem(event: {currentTarget: HTMLInputElement}): void;
  usrBtnClk(): void;
  bckBtnClk(): void;
  processForm(): void;
  updateBtnClk(): void;
  bumpVerBtnClk(): void;
}

interface ISwdbUpdateControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.ISwdb;
  inputForm: any;
  datePicker: any;
  ownerSelected: { item: IForgGroup | undefined };
  engineerSelected: { item: IForgUser | undefined };
  selectedItem: { name: string | undefined };
  forgUsersList: IForgUser[];
  forgGroupsList: IForgGroup[];
  statusDisplay: string | undefined;
  statusDateDisplay: Date;
  levelOfCareDisplay: string | undefined;
  versionControlDisplay: string | undefined;
  rawHistory: IHistory[];
  isHistCollapsed: boolean;
  statusDisabled: boolean;
  branchDisabled: boolean;
  versionDisabled: boolean;
  branchMouseover: string;
  versionMouseover: string;
  history: string;
  swdbParams: {
    formStatus: string,
    formErr: string,
    formShowErr: boolean,
    formShowStatus: boolean,
  };
  newItem(event: {currentTarget: HTMLInputElement}): void;
  removeItem(event: {currentTarget: HTMLInputElement}): void;
  onStatusChange(): void;
  usrBtnClk(): void;
  bckBtnClk(): void;
  processForm(): void;
  updateBtnClk(): void;
  bumpVerBtnClk(): void;
}

interface IInstListControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  usrBtnClk(): void;
}

interface IInstDetailsControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.Inst;
  swSelected: webapi.ISwdb;
  statusDisplay: string | undefined;
  statusDateDisplay: string;
  vvApprovalDateDisplay: string;
  rawHistory: {};
  usrBtnClk(): void;
  updateBtnClk(): void;
}

interface IInstNewControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.Inst;
  slotsSelected: string[];
  statusDisplay: string | undefined;
  areasSelected: IForgArea[];
  statusDateDisplay: Date;
  vvApprovalDateDisplay: Date;
  rawHistory: {};
  datePicker: any;
  inputForm: any;
  swList: webapi.ISwdb[];
  forgAreasList: IForgArea[];
  swdbParams: {
    formStatus: string,
    formErr: string,
    formShowErr: boolean,
    formShowStatus: boolean,
  };
  usrBtnClk(): void;
  updateBtnClk(): void;
  bckBtnClk(): void;
  swSelect(item: webapi.Inst): void;
  // formErrors(form: any): void;
  newItem(event: {currentTarget: HTMLInputElement}): void;
  removeItem(event: {currentTarget: HTMLInputElement}): void;
  processForm(): void;
  refreshSw(): void;
}

interface IInstUpdateControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.Inst;
  slotsSelected: string[];
  statusDisplay: string | undefined;
  areasSelected: IForgArea[];
  swSelected: {item: webapi.ISwdb};
  statusDateDisplay: Date;
  vvApprovalDateDisplay: Date;
  rawHistory: {};
  datePicker: any;
  inputForm: any;
  swList: webapi.ISwdb[];
  forgAreasList: IForgArea[];
  softwareDisabled: boolean;
  softwareMouseover: string;
  swdbParams: {
    error: {
      message: string,
      status: string,
    }
    formStatus: string,
    formErr: string,
    formShowErr: boolean,
    formShowStatus: boolean,
  };
  usrBtnClk(): void;
  updateBtnClk(): void;
  bckBtnClk(): void;
  swSelect(item: webapi.Inst): void;
  // formErrors(form: any): void;
  newItem(event: { currentTarget: HTMLInputElement }): void;
  removeItem(event: { currentTarget: HTMLInputElement }): void;
  processForm(): void;
  refreshSw(): void;
}