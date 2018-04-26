/*
 * This is the Angular details controller for installations
 */

appController.controller('InstDetailsController', InstDetailsPromiseCtrl);
function InstDetailsPromiseCtrl($scope, $http, $routeParams, $window, $location, configService, userService,
  swService, instService) {
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

  $scope.updateBtnClk = function () {
    // set the sw back to the id
    $scope.formData.software = $scope.swSelected.item._id;
    $location.path('/inst/update/' + $scope.formData._id);
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  //update document fields with existing data
  instService.refreshInstList().then(function () {
    let data = instService.getInstById($routeParams.itemId);    
    $scope.formData = data;
    $scope.statusDisplay = $scope.props.InstStatusEnum[data.status];
    // format dates for display
    if (data.statusDate) {
      let thisDate = new Date(data.statusDate);
      let month = thisDate.getMonth()+1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.formData.statusDate =  month + '/' + day + '/' + year;
    }
    $scope.whichItem = $routeParams.itemId;

    // convert the retreived record software
    swService.promise.then(function(){
      let obj = swService.swIdsToObjects([$scope.formData.software])[0];
      $scope.swSelected = {item: obj};
      $scope.formData.software = $scope.swSelected.item.swName + '/' +
        $scope.swSelected.item.branch + '/' + $scope.swSelected.item.version;
    });
  });
  // get history
  let url = basePath + "/api/v1/swdb/hist/" + $routeParams.itemId;
  $http.get(url).then(function (data) {
    $scope.rawHistory = data.data;
  });
}
