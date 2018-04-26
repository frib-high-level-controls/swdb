/*
 * This is the top-level controller for swdb
 */

var appController = angular.module('appController', ['datatables', 'datatables.bootstrap', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ngCookies', 'ui.select']);

appController.run(['$rootScope', '$route', '$http', '$routeParams', '$location', 'configService', function ($rootScope, $route, $http, $routeParams, $location, configService, slotService) {

  $rootScope.$on("$routeChangeSuccess", function (currentRoute, previousRoute) {
    //Change page title, based on Route information
    $rootScope.title = $route.current.title;

  });
}]);

// expose system status to all controllers via service.
appController.factory('StatusService', function () {
  return {
    dbConnected: 'false'
  };
});

appController.controller('ListController', ListPromiseCtrl);
function ListPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q, $scope, $cookies, $window, configService, userService) {

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

  // get intitialization info
  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  var vm = this;
  vm.dtOptions = DTOptionsBuilder
    .fromFnPromise(function () {
      var defer = $q.defer();
      let url = basePath + "/api/v1/swdb";
      $http.get(url).then(function (result) {
        defer.resolve(result.data);
      });
      return defer.promise;
    })
    .withBootstrap()
    .withPaginationType('full_numbers')
    .withDOM('<"row"<"col-sm-8"l><"col-sm-4"B>>rtip');

  vm.dtColumns = [
    DTColumnBuilder.newColumn('swName')
      .withTitle('Software name')
      .renderWith(function (data, type, full, meta) {
        return '<a href="#/details/' + full._id + '">' +
          full.swName + '</a>';
      }),
    DTColumnBuilder.newColumn('branch')
      .withTitle('Branch').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('version')
      .withTitle('Version').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('owner')
      .withTitle('Owner').withOption('defaultContent', ""),
    DTColumnBuilder.newColumn('engineer')
      .withTitle('Engineer').withOption('defaultContent', ""),
    DTColumnBuilder.newColumn('status')
      .withTitle('Status').withOption('defaultContent', ""),
    DTColumnBuilder.newColumn('statusDate')
      .withTitle('Status date (m/d/y)')
      .renderWith(function (data, type, full, meta) {
        let thisDate = new Date(full.statusDate);
        let month = thisDate.getMonth()+1;
        let day = thisDate.getDate();
        let year = thisDate.getFullYear();
        return month + '/' + day + '/' + year;
      })
  ];

  angular.element('#swdbList').on('init.dt', function (event, loadedDT) {
    // wait for the init event from the datatable
    // (then it is done loading)
    // Handle multiple init notifications
    let id = '#' + event.target.id;
    let num = $(id).find('thead').find('tr').length;
    if (num == 1) {
      var table = $(id).DataTable();
      let tr = $('<tr/>').appendTo($(id).find('thead'));

      // Apply the search
      table.columns().eq(0).each(function (colIdx) {
        let th = $('<th></th>').appendTo(tr);
        if (true) {
          // append column search with id derived from column init data
          th.append('<input class="swdbTableHeaderSearch" id="' + table.settings().init().aoColumns[colIdx].mData + "Srch" + '" type="text" placeholder="' + (table.column(colIdx).placeholder || '')
            + '" style="width:80%;" autocomplete="off">');
          th.on('keyup', 'input', function () {
            let elem = this; // aids type inference to avoid cast
            if (elem instanceof HTMLInputElement) {
              table.column(colIdx).search(elem.value).draw();
            }
          });

          // Now apply filter routines to each column
          $('input', table.column(colIdx).header()).on('keyup change', function () {
            table
              .column(colIdx)
              .search(this.value)
              .draw();
          });
        }
      });
    }
  });
}

