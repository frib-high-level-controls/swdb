/*
 * angular new controller for swdb
 */

appController.controller('NewController', NewPromiseCtrl);
function NewPromiseCtrl($scope, $http, $window, $location, configService, userService, swService, forgUserService, forgGroupService, recService) {

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
      $window.location.href = $scope.props.webUrl + 'logout';
    } else {
      $window.location.href = $scope.props.webUrl + 'login';
    }
  };

  $scope.bckBtnClk = function () {
    $location.path("/list");
  };

  $scope.datePicker = (function () {
    var method = {};
    method.instances = [];

    method.open = function ($event, instance) {
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

  $scope.newItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      $scope.formData.vvProcLoc.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.push("");
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      $scope.formData.vvProcLoc.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    }
  };

  $scope.processForm = function () {
    // Prep any selected owner
    $scope.formData.owner = $scope.ownerSelected.item.uid;
    // Prep any selected engineer
    if ($scope.engineerSelected.item) {
      $scope.formData.engineer = $scope.engineerSelected.item.uid;
    }

    if ($scope.formData.statusDate instanceof String) {
      $scope.formData.statusDate = new Date($scope.formData.statusDate);
    }
    if ($scope.formData.vvApprovalDate instanceof String) {
      $scope.formData.vvApprovalDate = new Date($scope.formData.vvApprovalDate);
    }

    // convert enum values to keys
    $scope.formData.levelOfCare = Object.keys($scope.props.LevelOfCareEnum).find( 
      function (item) { 
        return $scope.levelOfCareDisplay === $scope.props.LevelOfCareEnum[item];
      });
    $scope.formData.status = Object.keys($scope.props.StatusEnum).find( 
      function (item) { 
        return $scope.statusDisplay === $scope.props.StatusEnum[item];
      });
    $scope.formData.versionControl = Object.keys($scope.props.RcsEnum).find( 
      function (item) { 
        return $scope.versionControlDisplay === $scope.props.RcsEnum[item];
      });

    delete $scope.formData.__v;
    if (!$scope.formData.version) {
      // $scope.formData.version="";
    }
    if ($scope.inputForm.$valid) {
      let url = basePath + "/api/v1/swdb";
      $http({
        method: 'POST',
        // url: $scope.props.apiUrl,
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
          let headers = response.headers();
          $scope.swdbParams.error = { message: response.statusText + response.data, status: response.status };
          $scope.swdbParams.formErr = "Error: " + JSON.stringify($scope.swdbParams.error.message) + "(" + response.status + ")";
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

  // set the engineer field to the selected user
  $scope.onEngineerSelect = function ($item, $model, $label) {
    $scope.formData.engineer = $model;
  };
  // set the owner field to the selected user
  $scope.onOwnerSelect = function ($item, $model, $label) {
    $scope.formData.owner = $model;
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  forgUserService.promise.then(function(){
    $scope.forgUsersList = forgUserService.getUsers().data;
  });

  forgGroupService.promise.then(function(){
    $scope.forgGroupsList = forgGroupService.getGroups().data;
  });

  $scope.itemArray = $scope.props.validSwNamesGUIList;

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  //initialize selected owner and engineer
  $scope.ownerSelected = {item: {}};
  $scope.engineerSelected = {item: {}};

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
    let updateRedID = updateRec.updateRecId;
    $scope.formData.swName = updateRec.formData.swName;
    $scope.formData.desc = updateRec.formData.desc;
    $scope.formData.owner = updateRec.formData.owner;
    // $scope.ownerSelected = updateRec.formData.owner;
    $scope.formData.engineer = updateRec.formData.engineer;
    // $scope.engineerSelected = updateRec.formData.engineer;

    $scope.formData.levelOfCare = updateRec.formData.levelOfCare;
    $scope.levelOfCareDisplay = $scope.props.LevelOfCareEnum[updateRec.formData.levelOfCare];
    $scope.formData.status = 'DEVEL';
    $scope.statusDisplay = $scope.props.StatusEnum[$scope.formData.status];

    $scope.formData.statusDate = new Date();
    $scope.formData.platforms = updateRec.formData.platforms;
    $scope.formData.designDescDocLoc = updateRec.formData.designDescDocLoc;
    $scope.formData.descDocLoc = updateRec.formData.descDocLoc;
    $scope.formData.vvProcLoc = updateRec.formData.vvProcLoc;

    $scope.formData.versionControl = updateRec.formData.versionControl;
    $scope.versionControlDisplay = $scope.props.RcsEnum[updateRec.formData.versionControl];

    $scope.formData.versionControlLoc = updateRec.formData.versionControlLoc;
    $scope.formData.previous = updateRedID;

    // got the new data, now clear the service for next time.
    recService.setRec(null);
    // convert the retreived record owner
    forgGroupService.promise.then(function(){
      let thisOwner = [$scope.formData.owner];
      let forgObjs = forgGroupService.groupUidsToObjects(thisOwner)[0];
      $scope.ownerSelected.item = forgObjs;
    })
    // convert the retreived record engineer
    forgUserService.promise.then(function(){
      let thisEngineer = [$scope.formData.engineer];
      let forgObjs = forgUserService.userUidsToObjects(thisEngineer)[0];
      $scope.engineerSelected.item = forgObjs;
    })
  };
}
