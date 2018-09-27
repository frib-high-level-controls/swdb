/*
 * update controller for swdb
 */

appController.controller('UpdateController', UpdatePromiseCtrl);
function UpdatePromiseCtrl(
  $scope: ISwdbUpdateControllerScope,
  $http: ng.IHttpService,
  $routeParams: ng.route.IRouteParamsService,
  $window: ng.IWindowService,
  $location: ng.ILocationService,
  configService: IConfigService,
  userService: IUserService,
  swService: ISwService,
  instService: IInstService,
  forgUserService: IForgUserService,
  forgGroupService: IForgGroupService,
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

  $scope.usrBtnClk =  () => {
    if ($scope.session.user) {
      $window.location.href = `${basePath}/logout`;
    } else {
      $window.location.href = `${basePath}/login`;
    }
  };

  $scope.bckBtnClk =  () => {
    // Go back to details
    $location.path('/details/' + $scope.formData._id);
  };

  $scope.datePicker = ( () => {
    const instances: { [key: string]: boolean | undefined } = {};

    const open =  ($event: ng.IAngularEvent, instance: string) => {
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

    return { instances, open, options, format };
  })();

  $scope.newItem =  (event: {currentTarget: HTMLInputElement}) => {
    const parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      if ($scope.formData.vvProcLoc) {
      $scope.formData.vvProcLoc.push('');
      }
    } else if (parts[1] === 'vvResultsLoc') {
      if ($scope.formData.vvResultsLoc) {
      $scope.formData.vvResultsLoc.push('');
    }
    }
  };

  $scope.removeItem =  (event) => {
    const parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      if ($scope.formData.vvProcLoc) {
        $scope.formData.vvProcLoc.splice(Number(parts[2]), 1);
      }
    } else if (parts[1] === 'vvResultsLoc') {
      if ($scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc.splice(Number(parts[2]), 1);
      }
    }
  };

  $scope.processForm =  () => {
    if ($scope.inputForm.$valid) {
      // Prep any selected owner
      if ($scope.ownerSelected.item) {
        $scope.formData.owner = $scope.ownerSelected.item.uid;
      }

      $scope.formData.statusDate = DateUtil.toLocalDateISOString($scope.statusDateDisplay);

      // Prep any selected engineer
      if ($scope.engineerSelected && $scope.engineerSelected.item && $scope.engineerSelected.item.uid) {
        $scope.formData.engineer = $scope.engineerSelected.item.uid;
      }
      const url = basePath + '/api/v1/swdb/' + $scope.formData._id;

      // update formData lovel of care with enum key
      $scope.formData.levelOfCare = Object.keys($scope.props.LevelOfCareEnum).filter((item) => {
          return $scope.levelOfCareDisplay === $scope.props.LevelOfCareEnum[item];
      })[0];
      $scope.formData.status = Object.keys($scope.props.StatusEnum).filter((item) => {
          return $scope.statusDisplay === $scope.props.StatusEnum[item];
      })[0];
      $scope.formData.versionControl = Object.keys($scope.props.RcsEnum).filter((item) => {
        return $scope.versionControlDisplay === $scope.props.RcsEnum[item];
      })[0];

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
          // sw just updated, refresh the service list
          swService.refreshSwList();
          const headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            const id = headers.location.split('/').pop();
            $location.path('/details/' + id);
          }
        }, function error(response) {
          if (response.data.match(/^Validation errors: /g)) {
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

  $scope.onStatusChange =  () => {
    if ($scope.statusDisplay === $scope.props.statusLabels[2]) {
      $scope.branchDisabled = true;
      $scope.versionDisabled = true;
      $scope.branchMouseover = "Branch cannot change when status is '" +
        $scope.props.statusLabels[2] + "'";
      $scope.versionMouseover = "Version cannot change when status is '" +
        $scope.props.statusLabels[2] + "'";
    } else {
      $scope.branchDisabled = false;
      $scope.versionDisabled = false;
      $scope.branchMouseover = '';
      $scope.versionMouseover = '';
    }
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  forgUserService.promise.then(() => {
    $scope.forgUsersList = forgUserService.getUsers();
  });
  forgGroupService.promise.then(() => {
    $scope.forgGroupsList = forgGroupService.getGroups();
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    // go to cas
    $window.location.href = `${basePath}/login`;
  }

  // initialize selected owner and engineer
  $scope.ownerSelected = {item: undefined};
  $scope.engineerSelected = {item: undefined};

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: '',
    formErr: '',
  };

  // update document fields with existing data
  swService.promise.then( () => {
    const data = swService.getSwById($routeParams.itemId)[0];
    $scope.formData = data;

    // convert enums to value
    if (data.levelOfCare) {
      $scope.levelOfCareDisplay = $scope.props.LevelOfCareEnum[data.levelOfCare];
    }
    if (data.status) {
      $scope.statusDisplay = $scope.props.StatusEnum[data.status];
    }
    if (data.versionControl) {
      $scope.versionControlDisplay = $scope.props.RcsEnum[data.versionControl];
    }

    // Setup field display based on status
    $scope.onStatusChange();

    // make a Date object from this string
    if ($scope.formData.statusDate) {
      $scope.statusDateDisplay = DateUtil.fromLocalDateISOString($scope.formData.statusDate);
    }
    // set selctor to current swName value
    $scope.selectedItem = { name: $scope.formData.swName };
    // convert the retreived record owner
    forgGroupService.promise.then(() => {
      if ($scope.formData.owner) {
        const thisOwner = [$scope.formData.owner];
        const objsArray = forgGroupService.groupUidsToObjects(thisOwner);
        const forgObjs = objsArray[0];
        $scope.ownerSelected = { item: forgObjs };
      }
    });
    // convert the retreived record engineer
    forgUserService.promise.then(() => {
      if ($scope.formData.engineer) {
        const thisEngineer = [$scope.formData.engineer];
        const forgObjs = forgUserService.userUidsToObjects(thisEngineer)[0];
        $scope.engineerSelected = { item: forgObjs };
      }
    });

    // disable status field if there are installations referring to this sw
    instService.promise.then(() => {
      const instsReferring = instService.getInstsBySw($routeParams.itemId);
      if ((instsReferring.length >= 1) && (instsReferring !== null)) {
        $scope.statusDisabled = true;
      } else {
        $scope.statusDisabled = false;
      }

    });
  });
}
