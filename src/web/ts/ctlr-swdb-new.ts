/*
 * angular new controller for swdb
 */

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
  statusDateDisplay: Date;
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
  onEngineerSelect(item: webapi.ISwdb, model: IForgUser, array: any[]): void;
  onOwnerSelect(item: webapi.ISwdb, model: IForgGroup, array: any[]): void;
}

interface IForgUserService {
  promise: ng.IPromise<void>;
  getUsers(): any;
  userUidsToObjects(arr: string[]): IForgUser[];
}

interface IForgUser {
    uid: string;
}

interface IForgGroupService {
  promise: ng.IPromise<void>;
  getGroups(): any;
  groupUidsToObjects(arr: string[]): IForgGroup[];
}

interface IForgGroup {
    uid: string;
}

appController.controller('NewController', NewPromiseCtrl);
function NewPromiseCtrl(
  $scope: ISwdbNewControllerScope,
  $http: ng.IHttpService,
  $window: ng.IHttpService,
  $location: ng.ILocationService,
  configService: IConfigService,
  userService: IUserService,
  swService: ISwService,
  forgUserService: IForgUserService,
  forgGroupService: IForgGroupService,
  recService: IRecService,
) {

  $scope.$watch(function () {
    return $scope.session;
  }, function () {
    // prep for login button
    if ($scope.session && $scope.session.user) {
      $scope.usrBtnTxt = "";
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  }, true);

  $scope.usrBtnClk = function () {
    if ($scope.session.user) {
      // $window.location.href = $scope.props.webUrl + 'logout';
      $location.path($scope.props.webUrl + 'logout');
    } else {
      // $window.location.href = $scope.props.webUrl + 'login';
      $location.path($scope.props.webUrl + 'login');
    }
  };

  $scope.bckBtnClk = function () {
    $location.path("/list");
  };

  $scope.datePicker = (function () {
    var method: any = {};
    method.instances = [];

    method.open = function ($event: any, instance: any) {
      $event.preventDefault();
      $event.stopPropagation();
      method.instances[instance] = true;
    };

    method.options = {
      'show-weeks': false,
      startingDay: 0
    };

    method.format = 'M!/d!/yyyy';
    return method;
  }());

  $scope.newItem = function (event: {currentTarget: HTMLInputElement}) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      if ($scope.formData.vvProcLoc){
      $scope.formData.vvProcLoc.push("");
      }
    } else if (parts[1] === 'vvResultsLoc') {
      if ($scope.formData.vvResultsLoc){
      $scope.formData.vvResultsLoc.push("");
    }
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      if ($scope.formData.vvProcLoc){
        $scope.formData.vvProcLoc.splice(Number(parts[2]), 1);
      }
    } else if (parts[1] === 'vvResultsLoc') {
      if ($scope.formData.vvResultsLoc){
        $scope.formData.vvResultsLoc.splice(Number(parts[2]), 1);
      }
    }
  };

  $scope.processForm = function () {
    // Prep any selected owner
    if ($scope.ownerSelected.item) {
      $scope.formData.owner = $scope.ownerSelected.item.uid;
    }
    // Prep any selected engineer
    if (($scope.engineerSelected.item) && ($scope.engineerSelected.item.uid)) {
      $scope.formData.engineer = $scope.engineerSelected.item.uid;
    }

    $scope.formData.statusDate = $scope.statusDateDisplay.toISOString();

    // convert enum values to keys
    $scope.formData.levelOfCare = Object.keys($scope.props.LevelOfCareEnum).filter( 
      function (item) { 
        return $scope.levelOfCareDisplay === $scope.props.LevelOfCareEnum[item];
      })[0];
    $scope.formData.status = Object.keys($scope.props.StatusEnum).filter( 
      function (item) { 
        return $scope.statusDisplay === $scope.props.StatusEnum[item];
      })[0];
    $scope.formData.versionControl = Object.keys($scope.props.RcsEnum).filter( 
      function (item) { 
        return $scope.versionControlDisplay === $scope.props.RcsEnum[item];
      })[0];

    if (!$scope.formData.version) {
    }
    if ($scope.inputForm.$valid) {
      let url = basePath + "/api/v1/swdb";
      $http({
        method: 'POST',
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          // sw just updated, refresh the service list
          swService.refreshSwList();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            $location.path('/details/' + id);
          }
        }, function error(response) {
          if (response.data.match(/^Validation errors: /g)){
            // unpack the validation errors and print the first
            const parts = response.data.split('Validation errors: ')
            const errors = JSON.parse(parts[1]);
            $scope.swdbParams.formErr = "Error: " + errors[0].msg + " (" + response.status + ")";
          } else {
            $scope.swdbParams.formErr = "Error: " + JSON.stringify(response.data) + " (" + response.status + ")";
          }
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;
        });
    } else {
      $scope.swdbParams.formErr = "Error: clear errors before submission";
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  var getEnums = function () {
    $scope.levelOfCareDisplay = 'Low';
    $scope.formData.levelOfCare = 'LOW';
    $scope.statusDisplay = 'Development';
    $scope.formData.status = "DEVEL";
    $scope.formData.versionControl = "Other";
  };

  // // set the engineer field to the selected user
  // $scope.onEngineerSelect = function ($item, $model, $label) {
  //   $scope.formData.engineer = $model.uid;
  // };
  // // set the owner field to the selected user
  // $scope.onOwnerSelect = function ($item, $model, $label) {
  //   $scope.formData.owner = $model.uid;
  // };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  forgUserService.promise.then(function(){
    $scope.forgUsersList = forgUserService.getUsers().data;
  });

  forgGroupService.promise.then(function(){
    $scope.forgGroupsList = forgGroupService.getGroups().data;
  });

  // $scope.itemArray = $scope.props.validSwNamesGUIList;

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    // $window.location.href = $scope.props.webUrl + 'login';
    $location.path($scope.props.webUrl + 'login');
  }

  //initialize selected owner and engineer
  $scope.ownerSelected = {item: undefined};
  $scope.engineerSelected = {item: undefined};

  // initialize this record
  $scope.formData = {
    vvProcLoc: [],
    vvResultsLoc: [],
  };

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };
  getEnums();

  // expect recService to provide ID and formdata
  let updateRec = recService.getRec();
  if (updateRec) {
    let updateRedID = updateRec.updateRecID;
    $scope.formData.swName = updateRec.formData.swName;
    $scope.formData.desc = updateRec.formData.desc;
    $scope.formData.owner = updateRec.formData.owner;
    $scope.formData.engineer = updateRec.formData.engineer;

    $scope.formData.levelOfCare = updateRec.formData.levelOfCare;
    if (updateRec.formData.levelOfCare) {
    $scope.levelOfCareDisplay = $scope.props.LevelOfCareEnum[updateRec.formData.levelOfCare];
    }
    $scope.formData.status = 'DEVEL';
    $scope.statusDisplay = $scope.props.StatusEnum[$scope.formData.status];

    $scope.statusDateDisplay = new Date();
    $scope.formData.platforms = updateRec.formData.platforms;
    $scope.formData.designDescDocLoc = updateRec.formData.designDescDocLoc;
    $scope.formData.descDocLoc = updateRec.formData.descDocLoc;
    $scope.formData.vvProcLoc = updateRec.formData.vvProcLoc;

    $scope.formData.versionControl = updateRec.formData.versionControl;
    if (updateRec.formData.versionControl){
    $scope.versionControlDisplay = $scope.props.RcsEnum[updateRec.formData.versionControl];
    }

    $scope.formData.versionControlLoc = updateRec.formData.versionControlLoc;
    $scope.formData.previous = updateRedID;

    // got the new data, now clear the service for next time.
    recService.setRec(null);
    // convert the retreived record owner
    forgGroupService.promise.then(function(){
      if ($scope.formData.owner) {
      let thisOwner = [$scope.formData.owner];
      let forgObjs = forgGroupService.groupUidsToObjects(thisOwner)[0];
        $scope.ownerSelected = { item: forgObjs };
      }
    })
    // convert the retreived record engineer
    forgUserService.promise.then(function(){
      if ($scope.formData.engineer) {
      let thisEngineer = [$scope.formData.engineer];
      let forgObjs = forgUserService.userUidsToObjects(thisEngineer)[0];
        $scope.engineerSelected = { item: forgObjs };
      }
    })
  };
}
