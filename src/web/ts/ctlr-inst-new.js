/*
 * new controller for installations
 */

appController.controller('InstNewController', InstNewPromiseCtrl);
function InstNewPromiseCtrl($scope, $http, $window, $location, configService, userService, slotService, swService, forgAreaService) {

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
    $location.path("/inst/list");
  };


  $scope.slotSelect = function ($item, $model, $label) {
    var index = $scope.slotsSelected.indexOf($model);
    if (index == -1) {
      $scope.slotsSelected.unshift($model);
      $('#slots').focus();
    }
    else {
    }
  };

  $scope.removeSelectedSlot = function ($item) {
    var index = $scope.slotsSelected.indexOf($item);
    if (index > -1) {
      $scope.slotsSelected.splice(index, 1);
    }
  };

  $scope.swSelect = function ($item, $model, $label) {
    $scope.formData.software = $item._id;
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

  $scope.formErrors = function (form){
    var errors = [];
    for(var key in form.$error){
      errors.push(key + "=" + form.$error);
    }
    if(errors.length > 0){
      console.log("Form Has Errors");
      console.log(form.$error);
    }
  };


  $scope.processForm = function () {
    delete $scope.formData.__v;
    $scope.formData.slots = $scope.slotsSelected;

    // convert enum value to enum key
    $scope.formData.status = Object.keys($scope.props.InstStatusEnum).find( 
      function (item) { 
        return $scope.statusDisplay === $scope.props.InstStatusEnum[item];
      });

    let flattenedAreas = $scope.areasSelected.map(function(item, idx, array) {
      return item.uid;
    });
    $scope.formData.area = flattenedAreas;

    $scope.formData.software = $scope.swSelected.item._id;

    if ($scope.inputForm.$valid) {
      let url = basePath + "/api/v1/inst";
      $http({
        method: 'POST',
        url: url,
        // url: $scope.props.instApiUrl,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
          $scope.swdbParams.formErr = "Error: " + response.data.message + "(" + response.status + ")";
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
    if (parts[1] === 'slots') {
      $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.push("");
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
    if (parts[1] === 'slots') {
      $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    } else if (parts[1] === 'area') {
      // $scope.formData.area.splice(parts[2], 1);
      $scope.areasSelected.splice(parts[2], 1);
    }
  };

  var getEnums = function () {
    $scope.formData.status = "DEVEL";
    $scope.formData.area = "";
  };

  $scope.refreshSw = () => {
    $scope.swList = swService.getSwList().filter(function(item, index, arr){
      // filter for software that is in the "Ready for Install" state
      return item.status === 'RDY_INST';
    });
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  $scope.slots = slotService.getSlot();
  $scope.refreshSw();

  forgAreaService.promise.then(function () {
    $scope.forgAreasList = forgAreaService.getAreas().data;
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  // initialize this record
  $scope.formData = {
    //versionControl: "",
    slots: [],
    vvResultLoc: [],
    area: [],
  };

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };
  getEnums();
  $scope.slotsSelected = [];
  $scope.areasSelected = [];
  $scope.swSelected = {item: {}};

}
