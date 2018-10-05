/*
 * new controller for installations
 */

appController.controller('InstNewController', InstNewPromiseCtrl);
function InstNewPromiseCtrl(
  $scope: IInstNewControllerScope,
  $http: ng.IHttpService,
  $window: ng.IWindowService,
  $location: ng.ILocationService,
  configService: IConfigService,
  userService: IUserService,
  swService: ISwService,
  forgAreaService: IForgAreaService) {

  $scope.$watch( () => {
    return $scope.session;
  },  () => {
    // prep for login button
    if ($scope.session && $scope.session.user) {
      $scope.usrBtnTxt = '';
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  }, true);

  $scope.usrBtnClk =  () => {
    if ($scope.session.user) {
      $window.location.href = `${basePath}/logout`;
    } else {
      $window.location.href = `${basePath}/login`;
    }
  };

  $scope.bckBtnClk =  () => {
    // Go back to details
    $location.path('/inst/list');
  };

  $scope.swSelect =  ($item) => {
    $scope.formData.software = $item.id || '';
  };

  $scope.datePicker = ( () => {
    const instances: { [key: string]: boolean | undefined } = {};

    const open =  ($event: ng.IAngularEvent, instance: string) => {
      // $event.stopPropagation(); // Is this needed?
      $event.preventDefault();
      instances[instance] = true;
    };

    const options = {
      'show-weeks': false,
      'startingDay': 0,
      'timezone': 'utc',
    };

    const format = 'M!/d!/yyyy';

    return { open, instances, options, format };
  })();

  $scope.processForm =  () => {
    //$scope.formData.slots = $scope.slotsSelected;

    // convert enum value to enum key
    $scope.formData.status = Object.keys($scope.props.InstStatusEnum).filter(
       (item: string) => {
        return $scope.statusDisplay === $scope.props.InstStatusEnum[item];
      })[0];

    const flattenedAreas = $scope.areasSelected.map((item: IForgArea) => {
      return item.uid;
    });
    $scope.formData.area = flattenedAreas;

    // prep form dates
    if ($scope.statusDateDisplay) {
      $scope.formData.statusDate = DateUtil.toLocalDateISOString($scope.statusDateDisplay);
    }
    if ($scope.vvApprovalDateDisplay) {
      $scope.formData.vvApprovalDate = DateUtil.toLocalDateISOString($scope.vvApprovalDateDisplay);
    }

    if ($scope.inputForm.$valid) {
      const url = basePath + '/api/v1/inst';
      $http({
        method: 'POST',
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' },
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = 'Document posted';
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          const headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            const id = headers.location.split('/').pop();
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
          if (response.data.message) {
            $scope.swdbParams.formErr = 'Error: ' + response.data.message + ' (' + response.status + ')';
          } else if (response.data.match(/^Validation errors: /g)) {
            // unpack the validation errors and print the first
            const parts = response.data.split('Validation errors: ');
            const errors = JSON.parse(parts[1]);
            $scope.swdbParams.formErr = 'Error: ' + errors[0].msg + ' (' + response.status + ')';
          } else {
            $scope.swdbParams.formErr = 'Error: ' + JSON.stringify(response.data) + ' (' + response.status + ')';
          }
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;

        });
    } else {
      $scope.swdbParams.formErr = 'Error: clear errors before submission';
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  $scope.newItem =  (event: {currentTarget: HTMLInputElement}) => {
    const parts = event.currentTarget.id.split('.');
    if (parts[1] === 'slots') {
      // $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.push('');
    } else if (parts[1] === 'area') {
      // check to see if area needs initialization
      if (!$scope.areasSelected) {
        $scope.areasSelected = [];
      }
      $scope.areasSelected.push({ uid: ''});
    }
  };

  $scope.removeItem =  (event: {currentTarget: HTMLInputElement}) => {
    const parts = event.currentTarget.id.split('.');
    if (parts[1] === 'slots') {
      // $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.splice(Number(parts[2]), 1);
    } else if (parts[1] === 'area') {
      $scope.areasSelected.splice(Number(parts[2]), 1);
    }
  };

  $scope.refreshSw = () => {
    $scope.swList = swService.getSwList().filter((item, index, arr) => {
      // filter for software that is in the "Ready for Install" state
      return item.status === 'RDY_INST';
    });
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  // $scope.slots = slotService.getSlot();
  $scope.refreshSw();

  forgAreaService.promise.then( () => {
    $scope.forgAreasList = forgAreaService.getAreas();
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    // go to cas
    $window.location.href = `${basePath}/login`;
  }

  // initialize this record
  $scope.formData = {
    host: '',
    name: '',
    area: [],
    status: 'RDY_INST',
    statusDate: '',
    vvResultsLoc: [],
    vvApprovalDate: '',
    software: '',
    drrs: '',
    //slots: [],
  };

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: '',
    formErr: '',
  };
  $scope.slotsSelected = [];
  $scope.areasSelected = [];

  $scope.statusDisplay = 'Ready for install';
  

  $scope.statusDateDisplay = new Date();
}
