/*
 * update controller for swdb
 */

appController.controller('UpdateController', UpdatePromiseCtrl);
function UpdatePromiseCtrl($scope, $http, $routeParams, $window, $location, configService, userService,
   swService, instService, forgUserService, forgGroupService) {
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
    // Go back to details
    $location.path("/details/" + $scope.formData._id);
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
    if ($scope.inputForm.$valid) {
    // Prep any selected owner
    if ($scope.formData.owner) {
      $scope.formData.owner = $scope.ownerSelected.item.uid;
    }
    // Prep any selected engineer
    if ($scope.formData.engineer) {
      $scope.formData.engineer = $scope.engineerSelected.item.uid;
    }
      delete $scope.formData.__v;
      let url = $window.location.origin;
      url = url + "/api/v1/swdb/" + $scope.formData._id;
      $http({
        method: 'PUT',
        // url: $scope.props.apiUrl+$scope.formData._id,
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document updates successfully posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          // sw just updated, refresh the service list
          swService.refreshSwList();
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            $location.path('/details/' + id);
          }
        }, function error(response) {
          let headers = response.headers();
          $scope.swdbParams.error = { message: response.statusText + response.data, status: response.status };
          $scope.swdbParams.formErr = "Error: " + $scope.swdbParams.error.message + "(" + response.status + ")";
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;
        });
    } else {
      $scope.swdbParams.formErr = "Error: clear errors before submission";
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  // set the engineer field to the selected user
  $scope.onEngineerSelect = function ($item, $model, $label) {
    $scope.formData.engineer = $model;
  };
  // set the owner field to the selected user
  $scope.onOwnerSelect = function ($item, $model, $label) {
    $scope.formData.owner = $model;
  };

  $scope.onStatusChange = function ($item, $model, $label) {
    if ($scope.formData.status === $scope.props.statusLabels[2]) {
      $scope.branchDisabled = true;
      $scope.versionDisabled = true;
      $scope.branchMouseover = "Branch cannot change when status is '" +
        $scope.props.statusLabels[2] + "'";
      $scope.versionMouseover = "Version cannot change when status is '" +
        $scope.props.statusLabels[2] + "'";
    }
    else {
      $scope.branchDisabled = false;
      $scope.versionDisabled = false;
      $scope.branchMouseover = "";
      $scope.versionMouseover = "";
    }
  }

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  forgUserService.promise.then(function(){
    $scope.forgUsersList = forgUserService.getUsers().data;
  });
  forgGroupService.promise.then(function(){
    $scope.forgGroupsList = forgGroupService.getGroups().data;
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  //initialize selected owner and engineer
  $scope.ownerSelected = {item: {}};
  $scope.engineerSelected = {item: {}};

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };

  //update document fields with existing data
  swService.promise.then(function () {
    let data = swService.getSwById($routeParams.itemId);    
    // console.log('update data for ' + $routeParams.itemId + ' is now ' + JSON.stringify(data));
    $scope.itemArray = $scope.props.validSwNamesGUIList;
    $scope.formData = data;
    $scope.whichItem = $routeParams.itemId;

    // Setup field display based on status
    $scope.onStatusChange();

    // make a Date object from this string
    if ($scope.formData.statusDate) {
      $scope.formData.statusDate = new Date($scope.formData.statusDate);
    }
    if ($scope.formData.recertDate) {
      $scope.formData.recertDate = new Date($scope.formData.recertDate);
    }
    // set selctor to current swName value
    $scope.selectedItem = { name: $scope.formData.swName };
    // convert the retreived record owner
    forgGroupService.promise.then(function(){
      $scope.ownerSelected.item =  forgGroupService.groupUidsToObjects([$scope.formData.owner])[0];
    })
    // convert the retreived record engineer
    forgUserService.promise.then(function(){
      $scope.engineerSelected.item =  forgUserService.userUidsToObjects([$scope.formData.engineer])[0];
    })

    // disable status field if there are installations referring to this sw
    instService.promise.then(() => {
      let instsReferring = instService.getInstsBySw($routeParams.itemId);
      // console.log('instsReferring: ' + JSON.stringify(instsReferring));
      if ((instsReferring.length >= 1) && (instsReferring !== [null])) {
        $scope.statusDisabled = true;
      } else {
        $scope.statusDisabled = false;
      }

    });
  });
}
