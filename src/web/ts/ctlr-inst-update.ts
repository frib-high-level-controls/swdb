/*
 * update controller for installations
 */

appController.controller('InstUpdateController', InstUpdatePromiseCtrl);

function InstUpdatePromiseCtrl(
  $scope: IInstUpdateControllerScope,
  $http: ng.IHttpService,
  $routeParams: ng.route.IRouteParamsService,
  $window: ng.IWindowService,
  $location: ng.ILocationService,
  configService: IConfigService,
  userService: IUserService,
  instService: IInstService,
  swService: ISwService,
  forgAreaService: IForgAreaService,
) {

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

  $scope.datePicker = (() => {
    const instances: { [key: string]: boolean | undefined } = {};

    const open = ($event: ng.IAngularEvent, instance: string) => {
      $event.preventDefault();
      // $event.stopPropagation(); // Is this needed?
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

  $scope.bckBtnClk =  () => {
    // Go back to details
    $location.path('/inst/details/' + $scope.formData._id);
  };

  $scope.usrBtnClk =  () => {
    if ($scope.session.user) {
      $window.location.href = `${basePath}/logout`;
    } else {
      $window.location.href = `${basePath}/login`;
    }
  };

  $scope.processForm = () => {
    // convert enum value to enum key
    $scope.formData.status = Object.keys($scope.props.InstStatusEnum).filter(
       (item: string) => {
        return $scope.statusDisplay === $scope.props.InstStatusEnum[item];
      })[0];

    // Prep any selected areas
    if ($scope.areasSelected) {
      const flattenedAreas = $scope.areasSelected.map( (item: IForgArea) => {
          return item.uid;
      });
      $scope.formData.area = flattenedAreas;
    }

    // prep form dates
    if ($scope.statusDateDisplay) {
      $scope.formData.statusDate = DateUtil.toLocalDateISOString($scope.statusDateDisplay);
    }
    if ($scope.vvApprovalDateDisplay) {
      $scope.formData.vvApprovalDate = DateUtil.toLocalDateISOString($scope.vvApprovalDateDisplay);
    } else {
      $scope.formData.vvApprovalDate = '';
    }

    if ($scope.inputForm.$valid) {
      const url = basePath + '/api/v1/inst/' + $scope.formData._id;

      $http({
        method: 'PUT',
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' },
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = 'Document updates successfully posted';
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          const headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            const id = headers.location.split('/').pop();
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
          $scope.swdbParams.error = { message: response.statusText + response.data, status: response.status };
          $scope.swdbParams.formErr = 'Error: ' + $scope.swdbParams.error.message + '(' + response.status + ')';
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;
        });
    } else {
      $scope.swdbParams.formErr = 'Error: clear errors before submission';
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  $scope.newItem =  (event) => {
    const parts = event.currentTarget.id.split('.');
    // console.log("got add: " + parts);
    if (parts[1] === 'area') {
      // check to see if area needs initialization
      if (!$scope.areasSelected) {
        $scope.areasSelected = [];
      }
      $scope.areasSelected.push({ uid: ''});
    } else if (parts[1] === 'slots') {
      // $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.push('');
    }
  };

  $scope.removeItem =  (event) => {
    const parts = event.currentTarget.id.split('.');
    if (parts[1] === 'area') {
      $scope.areasSelected.splice(Number(parts[2]), 1);
    } else if (parts[1] === 'slots') {
      // $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.splice(Number(parts[2]), 1);
    }
  };


  $scope.swSelect =  ($item) => {
    $scope.formData.software = $item._id;
  };

  // refresh the service list
  swService.refreshSwList();
  instService.refreshInstList();

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  $scope.swList = swService.getSwList().filter( (item, index, arr) => {
    // filter for software that is in the "Ready for Install" state
    return item.status === 'RDY_INST';
  });

  forgAreaService.promise.then( () => {
    $scope.forgAreasList = forgAreaService.getAreas().data;
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    // go to cas
    $window.location.href = `${basePath}/login`;
  }

  $scope.swdbParams = {
    error: {
      message: '',
      status: '',
    },
    formShowErr: false,
    formShowStatus: false,
    formStatus: '',
    formErr: '',
  };

  // update document fields with existing data
  instService.promise.then( () => {
    const data = instService.getInstById($routeParams.itemId)[0];
    $scope.formData = data;

    // set enum values from keys
    if (data.status) {
      $scope.statusDisplay = $scope.props.InstStatusEnum[data.status];
    }
    // set software field disable based on the given status
    const index = 'RDY_INST';
    if ($scope.statusDisplay !== $scope.props.InstStatusEnum[index]) {
      $scope.softwareDisabled = true;
      $scope.softwareMouseover = "Software can only change when the record status is '" +
        $scope.props.instStatusLabels[0] + "'";
    }

    // convert the retreived record areas
    forgAreaService.promise.then(() => {
      if ($scope.formData.area) {
        $scope.areasSelected = forgAreaService.areaUidsToObjects($scope.formData.area);
      }
    });

    // make a Date object from this string
    if ($scope.formData.statusDate) {
      $scope.statusDateDisplay = DateUtil.fromLocalDateISOString($scope.formData.statusDate);
    }
    if (($scope.formData.vvApprovalDate) && ($scope.formData.vvApprovalDate !== '')) {
      $scope.vvApprovalDateDisplay = DateUtil.fromLocalDateISOString($scope.formData.vvApprovalDate);
    }

    // convert the retreived record software
    swService.promise.then(() => {

      if ($scope.formData.software) {
        $scope.swSelected = {item: swService.swIdsToObjects([$scope.formData.software])[0]};
      }
    });

  });
}
