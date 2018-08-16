/*
 * angular detail controller for swdb
 */

appController.controller('DetailsController', DetailsPromiseCtrl);
function DetailsPromiseCtrl(
  $scope: ISwdbDetailsControllerScope,
  $http: ng.IHttpService,
  $routeParams: IRouteParams,
  $window: ng.IWindowService,
  $location: ng.IWindowService,
  $sce: ng.ISCEService,
  configService: IConfigService,
  swService: ISwService,
  userService: IUserService,
  recService: IRecService,
) {
  $scope.$watch(() => {
    return $scope.session;
  }, () => {
    // prep for login button
    if ($scope.session && $scope.session.user) {
      $scope.usrBtnTxt = '';
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  }, true);

  $scope.usrBtnClk = () => {
    if ($scope.session.user) {
      $window.location.href = $scope.props.webUrl + 'logout';
    } else {
      $window.location.href = $scope.props.webUrl + 'login';
    }
  };

  $scope.bumpVerBtnClk = () => {
    // set the recService and then transfer to the new
    recService.setRec({
      updateRecID: $routeParams.itemId,
      formData: $scope.formData,
    });
    $location.path('/new');
  };

  const mkHistTable = (data: IHistory[]) => {
    let table = '<table id="histTable" class="swdbHistTable">';
    data.map((elem, idx, arr) => {
      table = table.concat('<tr class="swdbHistTr"><td class="swdbHistTdSection">' +
        new Date(elem.at) + '</td><td class="swdbHistTdSection">' + elem.by + '</td></tr>');
      elem.paths.map((pathElem, patIdx, pathArr) => {
        table = table.concat('<tr class="swdbHistTr"><td class="swdbHistTd">' +
          pathElem.name + '</td><td class="swdbHistTd">' + pathElem.value + '</td></tr>');
      });
    });
    table = table.concat('</table>');
    return table;
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  // update document fields with existing data
  let url = basePath + '/api/v1/swdb/' + $routeParams.itemId;

  swService.refreshSwList().then(() => {
    const data = swService.getSwById($routeParams.itemId)[0];
    $scope.formData = data;
    // convert level of care key to value
    if (data.levelOfCare) {
      $scope.levelOfCareDisplay = $scope.props.LevelOfCareEnum[data.levelOfCare];
    }
    if (data.status) {
      $scope.statusDisplay = $scope.props.StatusEnum[data.status];
    }
    if (data.versionControl) {
      $scope.versionControlDisplay = $scope.props.RcsEnum[data.versionControl];
    }
    // format dates for display
    if (data.statusDate) {
      const thisDate = new Date(data.statusDate);
      const month = thisDate.getMonth() + 1;
      const day = thisDate.getDate();
      const year = thisDate.getFullYear();
      $scope.formData.statusDate =  month + '/' + day + '/' + year;
    }
  });

  // get history
  url = basePath + '/api/v1/swdb/hist/' + $routeParams.itemId;
  $http.get(url).then((data) => {
    $scope.rawHistory = data.data as IHistory[];
    $scope.rawHistory.map((elem: IHistory, idx: number, arr: IHistory[]) => {
      elem.isCollapsed = true;
    });
    $scope.isHistCollapsed = false;
    $scope.history = $sce.trustAsHtml(mkHistTable(data.data as IHistory[]));
  });
}
