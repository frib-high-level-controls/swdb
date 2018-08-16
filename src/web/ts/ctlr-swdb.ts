/*
 * This is the top-level controller for swdb
 */

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
  (
    $rootScope: IAppRootScopeService,
    $route: ng.route.IRouteService,
    $http: ng.IHttpService,
    $routeParams: ng.route.IRouteParamsService,
    $location: ng.ILocationService,
    configService: {},
    slotService: {},
  ) => {
    $rootScope.$on('$routeChangeSuccess', (event, currentRoute: IAppRoute) => {
      // Change page title, based on Route information
      $rootScope.title = currentRoute.title;
    });
  },
]);

// expose system status to all controllers via service.
appController.factory('StatusService', () => {
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
}

appController.controller('ListController', function(
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
  $scope.$watch(() => {
    return $scope.session;
  },
  () => {
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

  // get intitialization info
  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  const vm = this;
  vm.dtOptions = DTOptionsBuilder
    .fromFnPromise(() => {
      const defer = $q.defer();
      const url = basePath + '/api/v1/swdb';
      $http.get<{data: {}}>(url).then((result) => {
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
      .renderWith((data, type, full, meta) => {
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
      .renderWith((data, type, full, meta) => {
        return $scope.props.StatusEnum[data] || '';
      }),
    DTColumnBuilder.newColumn('statusDate')
      .withTitle('Status date (m/d/y)')
      .renderWith((data, type, full, meta) => {
        const thisDate = new Date(full.statusDate);
        const month = thisDate.getMonth() + 1;
        const day = thisDate.getDate();
        const year = thisDate.getFullYear();
        return month + '/' + day + '/' + year;
      }),
  ];

  angular.element('#swdbList').on('init.dt', (event, loadedDT) => {
    // wait for the init event from the datatable
    // (then it is done loading)
    // Handle multiple init notifications
    const id = '#' + $(event.target).attr('id');
    const num = $(id).find('thead').find('tr').length;
    if (num === 1) {
      const table = $(id).DataTable();
      const tr = $('<tr/>').appendTo($(id).find('thead'));

      // Apply the search
      table.columns().eq(0).each((colIdx) => {
        const th = $('<th></th>').appendTo(tr);
        const column = table.column(colIdx);
        if (true) {
          // append column search with id derived from column init data
          th.append('<input class="swdbTableHeaderSearch" id="' + column.dataSrc() + 'Srch'
            + '" type="text" placeholder="' + ((table.column(colIdx) as any).placeholder || '')
            + '" style="width:80%;" autocomplete="off">');
          th.on('keyup', 'input', (evt) => {
            const elem = evt.target;
            if (elem instanceof HTMLInputElement) {
              table.column(colIdx).search(elem.value).draw();
            }
          });

          // Now apply filter routines to each column
          $('input', table.column(colIdx).header()).on('keyup change', (evt) => {
            const v = $(evt.target).val();
            table
              .column(colIdx)
              .search(v ? String(v) : '')
              .draw();
          });
        }
      });
    }
  });
});
