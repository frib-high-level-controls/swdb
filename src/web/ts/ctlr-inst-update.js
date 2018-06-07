/*
 * update controller for installations
 */

appController.controller('InstUpdateController', InstUpdatePromiseCtrl);
function InstUpdatePromiseCtrl($scope, $http, $routeParams, $window, $location, configService,
  userService, instService, swService, forgAreaService) {

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

    method.format = 'MM/dd/yyyy';

    return method;
  }());

  $scope.bckBtnClk = function () {
    // Go back to details
    $location.path("/inst/details/" + $scope.formData._id);
  };

  $scope.usrBtnClk = function () {
    if ($scope.session.user) {
      $window.location.href = $scope.props.webUrl + 'logout';
    } else {
      $window.location.href = $scope.props.webUrl + 'login';
    }
  };

  $scope.processForm = function () {
    // convert enum value to enum key
    $scope.formData.status = Object.keys($scope.props.InstStatusEnum).find( 
      function (item) { 
        return $scope.statusDisplay === $scope.props.InstStatusEnum[item];
      });

    // Prep any selected areas
    if ($scope.areasSelected) {
      let flattenedAreas = $scope.areasSelected.map(function (item, idx, array) {
        if (item) {
          return item.uid;
        }
      });
      $scope.formData.area = flattenedAreas;
    }

    $scope.formData.software = $scope.swSelected.item._id;

    // console.log('Got formData: ' + JSON.stringify($scope.formData, null, 2));
    // console.log('Got selectedAreas: ' + JSON.stringify($scope.selectedAreas, null, 2));
    if ($scope.inputForm.$valid) {
      delete $scope.formData.__v;
      let url = basePath + "/api/v1/inst/" + $scope.formData._id;

      $http({
        method: 'PUT',
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document updates successfully posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            // console.log('Got header.location: ' + headers.location);
            let id = headers.location.split('/').pop();
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
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

  $scope.newItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    // console.log("got add: " + parts);
    if (parts[1] === 'area') {
      $scope.areasSelected.push("");
    } else if (parts[1] === 'slots') {
      $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.push("");
    } else if (parts[1] === 'drrs') {
      $scope.formData.drrs.push("");
    } else if (parts[1] === 'area') {
      // check to see if area needs initialization
      if (!$scope.areasSelected) {
        $scope.areasSelected = [];
      }
      $scope.areasSelected.push("");
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'area') {
      $scope.areasSelected.splice(parts[2], 1);
    } else if (parts[1] === 'slots') {
      $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    } else if (parts[1] === 'drrs') {
      $scope.formData.drrs.splice(parts[2], 1);
    } else if (parts[1] === 'area') {
      $scope.formData.area.splice(parts[2], 1);
    }
  };

  $scope.onStatusChange = function ($item, $model, $label) {
    if ($scope.statusDisplay !== $scope.props.InstStatusEnum['RDY_INST']) {
      $scope.softwareDisabled = true;
      $scope.softwareMouseover = "Software can only change when status is '" + 
        $scope.props.instStatusLabels[0] + "'";
    }
    else {
      $scope.softwareDisabled = false;
      $scope.softwareMouseover = "";
    }
  }

  // refresh the service list
  swService.refreshSwList();
  instService.refreshInstList();

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  $scope.swList = swService.getSwList().filter(function (item, index, arr) {
    // filter for software that is in the "Ready for Install" state
    return item.status === 'RDY_INST';
  });

  forgAreaService.promise.then(function () {
    $scope.forgAreasList = forgAreaService.getAreas().data;
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };

  //update document fields with existing data
  instService.promise.then(function () {
    let data = instService.getInstById($routeParams.itemId);    
    $scope.formData = data;

    // set enum values from keys
    $scope.statusDisplay = $scope.props.InstStatusEnum[data.status];

    // set software field diable based on the given status
    $scope.onStatusChange();

    $scope.whichItem = $routeParams.itemId;
    // convert the retreived record areas
    forgAreaService.promise.then(function(){
      $scope.areasSelected =  forgAreaService.areaUidsToObjects($scope.formData.area);
    })
    // make a Date object from this string
    $scope.formData.statusDate = new Date($scope.formData.statusDate);
    if (($scope.formData.vvApprovalDate) && ($scope.formData.vvApprovalDate != "")){
      $scope.formData.vvApprovalDate = new Date($scope.formData.vvApprovalDate);
    }

    // convert the retreived record software
    swService.promise.then(function(){
      let obj = swService.swIdsToObjects([$scope.formData.software])[0];

      $scope.swSelected = {item: obj};
    });

  });
}
