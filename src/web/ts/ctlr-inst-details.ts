/*
 * This is the Angular details controller for installations
 */

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

interface IRouteParams extends ng.route.IRouteParamsService {
  itemId: string;
}

interface IInstService {
  refreshInstList(): ng.IPromise<void>;
  getInstById(id: string): webapi.Inst;
}

interface ISwService {
  promise: ng.IPromise<void>;
  swIdsToObjects(id: string): webapi.ISwdb;
}

appController.controller('InstDetailsController', InstDetailsPromiseCtrl);
function InstDetailsPromiseCtrl(
  $scope: IInstDetailsControllerScope,
  $http: ng.IHttpService,
  $routeParams: IRouteParams,
  $window: ng.IWindowService,
  $location: ng.ILocationService,
  configService: IConfigService,
  userService: IUserService,
  swService: ISwService,
  instService: IInstService) {
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
      $window.location.href = $scope.props.webUrl + 'logout';
    } else {
      $window.location.href = $scope.props.webUrl + 'login';
    }
  };

  $scope.updateBtnClk =  () => {
    // set the sw back to the id
    $scope.formData.software = $scope.swSelected.id;
    $location.path('/inst/update/' + $scope.formData.id);
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  // update document fields with existing data
  instService.refreshInstList().then( () => {
    let data = instService.getInstById($routeParams.itemId);
    $scope.formData = data;
    $scope.statusDisplay = $scope.props.InstStatusEnum[data.status];
    // format dates for display
    if (data.statusDate) {
      let thisDate: Date = new Date(data.statusDate);
      let month = thisDate.getMonth() + 1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.statusDateDisplay =  month + '/' + day + '/' + year;
    }
    if (data.vvApprovalDate) {
      let thisDate = new Date(data.vvApprovalDate);
      let month = thisDate.getMonth() + 1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.vvApprovalDateDisplay =  month + '/' + day + '/' + year;
    }

    // convert the retreived record software
    swService.promise.then(() => {
      let obj = swService.swIdsToObjects($scope.formData.software);
      $scope.swSelected =  obj;
      if (typeof $scope.swSelected.branch === 'undefined') {
        $scope.swSelected.branch = '';
      }
      if (typeof $scope.swSelected.version === 'undefined') {
        $scope.swSelected.version = '';
      }

      let software = $scope.swSelected.swName;
      if ($scope.swSelected.branch) {
        software += ' / ' + $scope.swSelected.branch + ' / ' + $scope.swSelected.version;
      } else {
        software += ' / / ' + $scope.swSelected.version;
      }
      $scope.formData.software = software;
    });
  });
  // get history
  let url = basePath + '/api/v1/swdb/hist/' + $routeParams.itemId;
  $http.get(url).then( (data) => {
    $scope.rawHistory = data.data;
  });
}
