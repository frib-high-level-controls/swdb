/*
 * angular detail controller for swdb
 */

appController.controller('DetailsController', DetailsPromiseCtrl);
function DetailsPromiseCtrl($scope, $http, $routeParams, $window, $location, $sce, configService,
  swService, userService, recService) {
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
  
  $scope.bumpVerBtnClk = function () {
    // set the recService and then transfer to the new 
    console.log("got bumpVerBtnClk");
    recService.setRec({
      updateRecID: $routeParams.itemId,
      formData: $scope.formData,
    });
    $location.path("/new");
  };

  let mkHistTable = function (data){
    let table = '<table id="histTable" class="swdbHistTable">';
    data.map(function(elem, idx, arr){
      console.log("Parsing: " + JSON.stringify(elem));
      console.log("table now: " + table);
      table = table.concat('<tr class="swdbHistTr"><td class="swdbHistTdSection">'+
        new Date(elem.at) + '</td><td class="swdbHistTdSection">' + elem.by + '</td></tr>');
      elem.paths.map(function(pathElem, patIdx, pathArr){
        table = table.concat('<tr class="swdbHistTr"><td class="swdbHistTd">' +
          pathElem.name + '</td><td class="swdbHistTd">' + pathElem.value + '</td></tr>');
      });
    });
    table = table.concat("</table>");
    console.log("Returning table: " + table);
    return table;
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  //update document fields with existing data
  let url = $window.location.origin;
  url = url + "/api/v1/swdb/" + $routeParams.itemId;

  swService.refreshSwList().then(function () {
    let data = swService.getSwById($routeParams.itemId);    
    $scope.formData = data;
    console.log('swdb details got :' + JSON.stringify(data, null, 2));
    // format dates for display
    if (data.statusDate) {
      let thisDate = new Date(data.statusDate);
      let month = thisDate.getMonth()+1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.formData.statusDate =  month + '/' + day + '/' + year;
    }
    if (data.recertDate) {
      let thisDate = new Date(data.recertDate);
      let month = thisDate.getMonth()+1;
      let day = thisDate.getDate();
      let year = thisDate.getFullYear();
      $scope.formData.recertDate = month + '/' + day + '/' + year;
    }
    $scope.whichItem = $routeParams.itemId;
  });

  // get history
  url = "/api/v1/swdb/hist/" + $routeParams.itemId;
  $http.get(url).then(function (data) {
    $scope.rawHistory = data.data;
    $scope.rawHistory.map = function(elem, idx, arr) {
      elem.isCollapsed = true;
    }
    console.log("Got history: " + JSON.stringify(data.data, null, 2));
    $scope.isHistCollapsed = false;
    $scope.history = $sce.trustAsHtml(mkHistTable(data.data));
  });
}
