var appController = angular.module('appController', ['datatables', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ngCookies', 'ui.select']);

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
      let url = $window.location.origin;
      url = url + "/api/v1/swdb/";
      // $http.get($scope.props.apiUrl).then(function(result) {
      $http.get(url).then(function (result) {
        defer.resolve(result.data);
      });
      return defer.promise;
    })
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
      .withTitle('Status date').withOption('defaultContent', "")
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
        // if (table.column(colIdx).searchable) {
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
            console.log("searching column " + colIdx);
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


appController.controller('DetailsController', DetailsPromiseCtrl);
function DetailsPromiseCtrl($scope, $http, $routeParams, $window, $location, configService, userService, recService) {
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

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  //update document fields with existing data
  let url = $window.location.origin;
  url = url + "/api/v1/swdb/" + $routeParams.itemId;

  // $http.get($scope.props.apiUrl+$routeParams.itemId).success(function(data) {
  $http.get(url).success(function (data) {
    $scope.formData = data;
    $scope.whichItem = $routeParams.itemId;
  });

  // get history
  url = "/api/v1/swdb/hist/" + $routeParams.itemId;
  $http.get(url).then(function (data) {
    $scope.history = data.data;
    console.log("Got history: " + JSON.stringify($scope.history, null, 2));
  });
}


appController.controller('NewController', NewPromiseCtrl);
function NewPromiseCtrl($scope, $http, $window, $location, configService, userService, swService, forgUserService, forgGroupService, recService) {

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

  $scope.bckBtnClk = function () {
    $location.path("/list");
  };

  $scope.datePicker = (function () {
    var method = {};
    method.instances = [];

    method.open = function ($event, instance) {
      $event.preventDefault();
      $event.stopPropagation();

      method.instances[instance] = true;
    };

    method.options = {
      'show-weeks': false,
      startingDay: 0
    };

    var formats = ['MM/dd/yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    method.format = formats[2];

    return method;
  }());

  $scope.newItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      $scope.formData.vvProcLoc.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.push("");
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      $scope.formData.vvProcLoc.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    }
  };

  $scope.processForm = function () {
    delete $scope.formData.__v;
    if (!$scope.formData.version) {
      // $scope.formData.version="";
    }
    if ($scope.inputForm.$valid) {
      let url = $window.location.origin;
      url = url + "/api/v1/swdb/";
      $http({
        method: 'POST',
        // url: $scope.props.apiUrl,
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          // sw just updated, refresh the service list
          swService.refreshSwList();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            $location.path('/details/' + id);
          }
        }, function error(response) {
          let headers = response.headers();
          $scope.swdbParams.error = { message: response.statusText + response.data, status: response.status };
          $scope.swdbParams.formErr = "Error: " + $scope.swdbParams.error.message + "(" + response.status + ")";
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;
        });
    } else {
      $scope.swdbParams.formErr = "Error: clear errors before submission";
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  getEnums = function () {
    $scope.formData.levelOfCare = "NONE";
    $scope.formData.status = "DEVEL";
    $scope.formData.versionControl = "Other";
  };

  // set the engineer field to the selected user
  $scope.onEngineerSelect = function ($item, $model, $label) {
    $scope.formData.engineer = $model;
  };
  // set the owner field to the selected user
  $scope.onOwnerSelect = function ($item, $model, $label) {
    $scope.formData.owner = $model;
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  forgUserService.promise.then(function(){
    $scope.forgUsersList = forgUserService.getUsers().data;
    //console.log("forgUsersList promise updated just now");
  });

  forgGroupService.promise.then(function(){
    $scope.forgGroupsList = forgGroupService.getGroups().data;
    //console.log("forgGroupsList promise updated just now");
  });

  $scope.itemArray = $scope.props.validSwNamesGUIList;

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  // initialize this record
  $scope.formData = {
    vvProcLoc: [],
    vvResultsLoc: [],
  };
  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };
  getEnums();

  // expect recService to provide ID and formdata
  let updateRec = recService.getRec();
  if (updateRec) {
    console.log("Found update record, setting defaults: " + JSON.stringify(updateRec,null,2));
    let updateRedID = updateRec.updateRecId;
    $scope.formData.swName = updateRec.formData.swName;
    $scope.formData.desc = updateRec.formData.desc;
    $scope.formData.owner = updateRec.formData.owner;
    $scope.ownerSelected = updateRec.formData.owner;
    $scope.formData.engineer = updateRec.formData.engineer;
    $scope.engineerSelected = updateRec.formData.engineer;
    $scope.formData.levelOfCare = updateRec.formData.levelOfCare;
    $scope.formData.status = "DEVEL";
    $scope.formData.statusDate = new Date();
    $scope.formData.platforms = updateRec.formData.platforms;
    $scope.formData.designDescDocLoc = updateRec.formData.designDescDocLoc;
    $scope.formData.descDocLoc = updateRec.formData.descDocLoc;
    $scope.formData.vvProcLoc = updateRec.formData.vvProcLoc;
    $scope.formData.versionControl = updateRec.formData.versionControl;
    $scope.formData.versionControlLoc = updateRec.formData.versionControlLoc;
    $scope.formData.recertFreq = updateRec.formData.recertFreq;
    $scope.formData.previous = updateRedID;

    // got the new data, now clear the service for next time.
    recService.setRec(null);
  };
}


appController.controller('UpdateController', UpdatePromiseCtrl);
function UpdatePromiseCtrl($scope, $http, $routeParams, $window, $location, configService, userService, swService, forgUserService, forgGroupService) {
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

  $scope.bckBtnClk = function () {
    // Go back to details
    $location.path("/details/" + $scope.formData._id);
  };

  $scope.datePicker = (function () {
    var method = {};
    method.instances = [];

    method.open = function ($event, instance) {
      $event.preventDefault();
      $event.stopPropagation();

      method.instances[instance] = true;
    };

    method.options = {
      'show-weeks': false,
      startingDay: 0
    };

    var formats = ['MM/dd/yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    method.format = formats[2];

    return method;
  }());

  $scope.newItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      $scope.formData.vvProcLoc.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.push("");
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'vvProcLoc') {
      $scope.formData.vvProcLoc.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    }
  };

  $scope.processForm = function () {
    if ($scope.inputForm.$valid) {
      delete $scope.formData.__v;
      let url = $window.location.origin;
      url = url + "/api/v1/swdb/" + $scope.formData._id;
      $http({
        method: 'PUT',
        // url: $scope.props.apiUrl+$scope.formData._id,
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document updates successfully posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          // sw just updated, refresh the service list
          swService.refreshSwList();
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            $location.path('/details/' + id);
          }
        }, function error(response) {
          let headers = response.headers();
          $scope.swdbParams.error = { message: response.statusText + response.data, status: response.status };
          $scope.swdbParams.formErr = "Error: " + $scope.swdbParams.error.message + "(" + response.status + ")";
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;
        });
    } else {
      $scope.swdbParams.formErr = "Error: clear errors before submission";
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  // set the engineer field to the selected user
  $scope.onEngineerSelect = function ($item, $model, $label) {
    $scope.formData.engineer = $model;
  };
  // set the owner field to the selected user
  $scope.onOwnerSelect = function ($item, $model, $label) {
    $scope.formData.owner = $model;
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  forgUserService.promise.then(function(){
    $scope.forgUsersList = forgUserService.getUsers().data;
    //console.log("forgUsersList promise updated just now");
  });
  forgGroupService.promise.then(function(){
    $scope.forgGroupsList = forgGroupService.getGroups().data;
    //console.log("forgGroupsList promise updated just now");
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };

  //update document fields with existing data
  let url = $window.location.origin;
  url = url + "/api/v1/swdb/" + $routeParams.itemId;

  // $http.get($scope.props.apiUrl+$routeParams.itemId).success(function(data) {
  $http.get(url).success(function (data) {
    $scope.itemArray = $scope.props.validSwNamesGUIList;
    $scope.formData = data;
    $scope.whichItem = $routeParams.itemId;

    // make a Date object from this string
    $scope.formData.statusDate = new Date($scope.formData.statusDate);
    // set selctor to current swName value
    $scope.selectedItem = { name: $scope.formData.swName };
  });

}

