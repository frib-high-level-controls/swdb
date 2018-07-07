/*
 * This is the Angular details controller for installations
 */
import { IPromise } from 'angular';
import { IInstModel } from '../../app/lib/instDb';

interface IInstDetailsControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: IInstModel;
  swSelected: IInstModel;
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
  refreshInstList(): IPromise<void>;
  getInstById(id: string): IInstModel;
}

interface ISwService {
  promise: IPromise<void>;
  swIdsToObjects(id: string): IInstModel;
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
    $scope.formData.software = $scope.swSelected.item._id;
    $location.path('/inst/update/' + $scope.formData._id);
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
      let thisDate: Date = new Date(data.statusDate.getVarDate());
      let month = thisDate.getMonth() + 1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.statusDateDisplay =  month + '/' + day + '/' + year;
    }
    if (data.vvApprovalDate) {
      let thisDate = new Date(data.vvApprovalDate.getVarDate());
      let month = thisDate.getMonth() + 1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.vvApprovalDateDisplay =  month + '/' + day + '/' + year;
    }

    // convert the retreived record software
    swService.promise.then(() => {
      let obj = swService.swIdsToObjects($scope.formData.software);
      $scope.swSelected =  obj;
      if (typeof $scope.swSelected.item.branch === 'undefined') {
        $scope.swSelected.item.branch = '';
      }
      if (typeof $scope.swSelected.item.version === 'undefined') {
        $scope.swSelected.item.version = '';
      }

      let software = $scope.swSelected.item.swName;
      if ($scope.swSelected.item.branch) {
        software += ' / ' + $scope.swSelected.item.branch + ' / ' + $scope.swSelected.item.version;
      } else {
        software += ' / / ' + $scope.swSelected.item.version;
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
