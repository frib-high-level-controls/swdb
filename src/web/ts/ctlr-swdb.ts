/*
 * This is the top-level controller for swdb
 */

interface IAppRootScopeService extends ng.IRootScopeService {
  title?: string;
}

interface IAppRoute extends ng.route.IRoute {
  title: string;
}

interface IConfigProps {
  webUrl: string;
  StatusEnum: { [key: string]: string | undefined };
}

interface IConfigService {
  getConfig(): IConfigProps;
}

interface IUserService {
  getUser(): {};
}

let appController = angular.module('appController', [
  'datatables',
  'datatables.bootstrap',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ngCookies',
  'ui.select',
]);

appController.run(['$rootScope', '$route', '$http', '$routeParams', '$location', 'configService',
  function (
    $rootScope: IAppRootScopeService,
    $route: ng.route.IRouteService,
    $http: ng.IHttpService,
    $routeParams: ng.route.IRouteParamsService,
    $location: ng.ILocationService,
    configService: {},
    slotService: {},
  ) {
    $rootScope.$on('$routeChangeSuccess', function (event, currentRoute: IAppRoute) {
      // Change page title, based on Route information
      $rootScope.title = currentRoute.title;

    });
  },
]);

// expose system status to all controllers via service.
appController.factory('StatusService', function () {
  return {
    dbConnected: 'false',
  };
});

interface IListControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  usrBtnTxt?: string;
  usrBtnClk(): void;
};

appController.controller('ListController', ListPromiseCtrl);
function ListPromiseCtrl(
  this: { dtOptions: {}, dtColumns: {} },
  DTOptionsBuilder: ng.datatables.DTOptionsBuilderService,
  DTColumnBuilder: ng.datatables.DTColumnBuilderService,
  $http: ng.IHttpService,
  $q: ng.IQService,
  $scope: IListControllerScope,
  $cookies: {},
  $window: ng.IWindowService,
  configService: IConfigService,
  userService: IUserService,
) {
  $scope.$watch(function () {
    return $scope.session;
  }, function () {
    // prep for login button
    if ($scope.session && $scope.session.user) {
      $scope.usrBtnTxt = '';
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
  let vm = this;
  vm.dtOptions = DTOptionsBuilder
    .fromFnPromise(function () {
      let defer = $q.defer();
      let url = basePath + '/api/v1/swdb';
      $http.get<{data: {}}>(url).then(function (result) {
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
      .withTitle('Owner').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('engineer')
      .withTitle('Engineer').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('status')
      .withTitle('Status')
      .renderWith(function (data, type, full, meta) {
        return $scope.props.StatusEnum[data] || '';
      }),
    DTColumnBuilder.newColumn('statusDate')
      .withTitle('Status date (m/d/y)')
      .renderWith(function (data, type, full, meta) {
        let thisDate = new Date(full.statusDate);
        let month = thisDate.getMonth() + 1;
        let day = thisDate.getDate();
        let year = thisDate.getFullYear();
        return month + '/' + day + '/' + year;
      }),
  ];

  angular.element('#swdbList').on('init.dt', function (event, loadedDT) {
    // wait for the init event from the datatable
    // (then it is done loading)
    // Handle multiple init notifications
    let id = '#' + $(event.target).attr('id');
    let num = $(id).find('thead').find('tr').length;
    if (num === 1) {
      let table = $(id).DataTable();
      let tr = $('<tr/>').appendTo($(id).find('thead'));

      // Apply the search
      table.columns().eq(0).each(function (colIdx) {
        let th = $('<th></th>').appendTo(tr);
        let column = table.column(colIdx);
        if (true) {
          // append column search with id derived from column init data
          th.append('<input class="swdbTableHeaderSearch" id="' + column.dataSrc() + 'Srch'
            + '" type="text" placeholder="' + ((table.column(colIdx) as any).placeholder || '')
            + '" style="width:80%;" autocomplete="off">');
          th.on('keyup', 'input', function (evt) {
            let elem = evt.target;
            if (elem instanceof HTMLInputElement) {
              table.column(colIdx).search(elem.value).draw();
            }
          });

          // Now apply filter routines to each column
          $('input', table.column(colIdx).header()).on('keyup change', function (evt) {
            let v = $(evt.target).val();
            table
              .column(colIdx)
              .search(v ? String(v) : '')
              .draw();
          });
        }
      });
    }
  });
}
