/*
 * This is the Angular details controller for installations
 */

appController.controller('InstDetailsController', InstDetailsPromiseCtrl);
function InstDetailsPromiseCtrl($scope, $http, $routeParams, $window, configService, userService,
  instService) {
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

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  //update document fields with existing data
  instService.refreshInstList().then(function () {
    let data = instService.getInstById($routeParams.itemId);    
    $scope.formData = data;
    // format dates for display
    if (data.statusDate) {
      let thisDate = new Date(data.statusDate);
      let month = thisDate.getMonth()+1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.formData.statusDate =  month + '/' + day + '/' + year;
    }
    $scope.whichItem = $routeParams.itemId;
  });
  // get history
  let url = "/api/v1/swdb/hist/" + $routeParams.itemId;
  $http.get(url).then(function (data) {
    $scope.rawHistory = data.data;
  });
}
