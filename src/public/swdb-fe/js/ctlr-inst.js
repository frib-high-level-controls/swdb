
appController.controller('InstListController', InstListPromiseCtrl);
function InstListPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q, $scope, $cookies, $window, configService, userService, swService) {

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

  // get initialization info
  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  var vm = this;
  // set the options. Note that installations promise fires
  // first then inner promise uses installation data to get
  // sw metadata. Only after inner promise sets the data is outer
  // promise resolved.
  vm.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
    var defer = $q.defer();
    let url = $window.location.origin;
    url = url + "/api/v1/inst/";
    // $http.get($scope.props.instApiUrl).then(function (result) {
    $http.get(url).then(function (result) {
      var innerDefer = $q.defer();
      var swIds = result.data.map(function (r) { return r.software; });
      let url = $window.location.origin;
      url = url + "/api/v1/swdb/list";
      $http({
        url: url,
        // url: $scope.props.apiUrl + "list",
        method: "POST",
        data: JSON.stringify(swIds)
      }).then(function (innerResult) {
        $scope.swMeta = innerResult.data;
        innerDefer.resolve(innerResult.data);
        defer.resolve(result.data);
      });
    });
    return defer.promise;
  })
    .withPaginationType('full_numbers')
    .withDOM('<"row"<"col-sm-8"l><"col-sm-4"B>>rtip');
  vm.dtOptions.searching = true;

  // Build the column specs 
  // Set the titles to include search input field
  // later attach to search actions
  vm.dtColumns = [
    DTColumnBuilder.newColumn('host')
      .withTitle('Host').withOption('defaultContent', '')
      .renderWith(function (data, type, full, meta) {
        return '<a href="#/inst/details/' + full._id + '">' + full.host + '</a>';
      }),
    DTColumnBuilder.newColumn('name')
      .withTitle('Name').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('software')
      .withTitle('Software').withOption('defaultContent', '')
      .renderWith(function (data, type, full, meta) {
        if (!$scope.swMeta[full.software].branch) {
          $scope.swMeta[full.software].branch = "";
        }
        if (!$scope.swMeta[full.software].version) {
          $scope.swMeta[full.software].version = "";
        }
        return '<a href="#/details/' + full.software + '" >' +
          $scope.swMeta[full.software].swName +
          ' / ' + $scope.swMeta[full.software].branch +
          ' / ' + $scope.swMeta[full.software].version +
          '</a>';
      }),
    DTColumnBuilder.newColumn('area')
      .withTitle('Area').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('drrs')
      .withTitle('DRR').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('status')
      .withTitle('Status').withOption('defaultContent', ''),
    DTColumnBuilder.newColumn('statusDate')
      .withTitle('Status Date').withOption('defaultContent', '')
  ];

  angular.element('#instList').on('init.dt', function (event, loadedDT) {
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
        // if (table.column(colIdx).searching) {
        // append column search with id derived from column init data
        th.append('<input id="' + table.settings().init().aoColumns[colIdx].mData + "Srch" + '" type="text" placeholder="' + (table.column(colIdx).placeholder || '')
          // th.append('<input type="text" placeholder="' + (table.column(colIdx).placeholder || '')
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
        // }
      });
    }
  });
}

appController.controller('InstDetailsController', InstDetailsPromiseCtrl);
function InstDetailsPromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {
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
  let url = $window.location.origin;
  url = url + "/api/v1/inst/" + $routeParams.itemId;
  // $http.get($scope.props.instApiUrl+$routeParams.itemId).success(function(data) {
  $http.get(url).success(function (data) {
    $scope.formData = data;
    $scope.whichItem = $routeParams.itemId;
  });
  // get history
  url = "/api/v1/swdb/hist/" + $routeParams.itemId;
  $http.get(url).then(function (data) {
    $scope.rawHistory = data.data;
    console.log("Got history: " + JSON.stringify(data.data, null, 2));
    //console.log('rawHistory now: ' + $scope.rawHistory);
  });
}


appController.controller('InstNewController', InstNewPromiseCtrl);
function InstNewPromiseCtrl($scope, $http, $window, $location, configService, userService, slotService, swService, forgAreaService) {

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
    $location.path("/inst/list");
  };


  $scope.slotSelect = function ($item, $model, $label) {
    var index = $scope.slotsSelected.indexOf($model);
    if (index == -1) {
      $scope.slotsSelected.unshift($model);
      $('#slots').focus();
    }
    else {
    }
  };

  $scope.removeSelectedSlot = function ($item) {
    var index = $scope.slotsSelected.indexOf($item);
    if (index > -1) {
      $scope.slotsSelected.splice(index, 1);
    }
  };

  $scope.swSelect = function ($item, $model, $label) {
    $scope.formData.software = $item._id;
    // console.log("software is now:"+$scope.formData.software);
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


  $scope.processForm = function () {
    delete $scope.formData.__v;
    $scope.formData.slots = $scope.slotsSelected;

    // Prep any selected areas
    flattenedAreas = $scope.areasSelected.map(function(item, idx, array) {
      return item.uid;
    });
    $scope.formData.area = flattenedAreas;

    $scope.formData.software = $scope.swSelected.item._id;
    console.log('Got formData: ' + JSON.stringify($scope.formData, null, 2));
    // console.log('Got areasSelected: ' + JSON.stringify($scope.areasSelected, null, 2));

    if ($scope.inputForm.$valid) {
      let url = $window.location.origin;
      url = url + "/api/v1/inst/";
      $http({
        method: 'POST',
        url: url,
        // url: $scope.props.instApiUrl,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            // console.log("going to: /inst/details/"+id);
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
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

  $scope.newItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'slots') {
      $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.push("");
    } else if (parts[1] === 'area') {
      // check to see if area needs initialization
      if (!$scope.areasSelected) {
        $scope.areasSelected = [];
      }
      $scope.areasSelected.push("");
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'slots') {
      $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    } else if (parts[1] === 'area') {
      // $scope.formData.area.splice(parts[2], 1);
      $scope.areasSelected.splice(parts[2], 1);
      // console.log("after rm areasSelected now: " + JSON.stringify($scope.areasSelected));
    }
  };

  getEnums = function () {
    $scope.formData.status = "DEVEL";
    $scope.formData.area = "";
  };

  $scope.refreshSw = () => {
    $scope.swList = swService.getSwList();
    // console.log("swList is now "+JSON.stringify($scope.swList));
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  $scope.slots = slotService.getSlot();
  $scope.refreshSw();

  forgAreaService.promise.then(function () {
    $scope.forgAreasList = forgAreaService.getAreas().data;
    //console.log("forgUsersList promise updated just now");
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  // sw just updated, refresh the service list
  swService.refreshSwList();

  // initialize this record
  $scope.formData = {
    //versionControl: "",
    slots: [],
    vvResultLoc: [],
    area: [],
  };

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };
  getEnums();
  $scope.slotsSelected = [];
  $scope.areasSelected = [];
  $scope.swSelected = {item: {}};
  console.log("at init $scope.formData.area is :" + JSON.stringify($scope.formData.area));
}


appController.controller('InstUpdateController', InstUpdatePromiseCtrl);
function InstUpdatePromiseCtrl($scope, $http, $routeParams, $window, $location, configService, userService, swService, forgAreaService) {

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

  $scope.bckBtnClk = function () {
    // Go back to details
    $location.path("/inst/details/" + $scope.formData._id);
  };

  $scope.usrBtnClk = function () {
    if ($scope.session.user) {
      $window.location.href = $scope.props.webUrl + 'logout';
    } else {
      $window.location.href = $scope.props.webUrl + 'login';
    }
  };

  $scope.processForm = function () {
    // Prep any selected areas
    if ($scope.areasSelected) {
      flattenedAreas = $scope.areasSelected.map(function (item, idx, array) {
        if (item) {
          return item.uid;
        }
      });
      $scope.formData.area = flattenedAreas;
    }

    $scope.formData.software = $scope.swSelected.item._id;

    console.log('Got formData: ' + JSON.stringify($scope.formData, null, 2));
    console.log('Got selectedAreas: ' + JSON.stringify($scope.selectedAreas, null, 2));
    if ($scope.inputForm.$valid) {
      delete $scope.formData.__v;
      let url = $window.location.origin;
      url = url + "/api/v1/inst/" + $scope.formData._id;

      $http({
        method: 'PUT',
        // url: $scope.props.instApiUrl+$scope.formData._id,
        url: url,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document updates successfully posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            console.log('Got header.location: ' + headers.location);
            let id = headers.location.split('/').pop();
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
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

  $scope.newItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    console.log("got add: " + parts);
    if (parts[1] === 'area') {
      $scope.areasSelected.push("");
    } else if (parts[1] === 'slots') {
      $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.push("");
    } else if (parts[1] === 'drrs') {
      $scope.formData.drrs.push("");
    } else if (parts[1] === 'area') {
      // check to see if area needs initialization
      if (!$scope.areasSelected) {
        $scope.areasSelected = [];
      }
      $scope.areasSelected.push("");
    }
  };

  $scope.removeItem = function (event) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'area') {
      $scope.areasSelected.splice(parts[2], 1);
    } else if (parts[1] === 'slots') {
      $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      $scope.formData.vvResultsLoc.splice(parts[2], 1);
    } else if (parts[1] === 'drrs') {
      $scope.formData.drrs.splice(parts[2], 1);
    } else if (parts[1] === 'area') {
      $scope.formData.area.splice(parts[2], 1);
    }
  };

  $scope.onStatusChange = function ($item, $model, $label) {
    if ($scope.formData.status !== $scope.props.instStatusLabels[0]) {
      $scope.softwareDisabled = true;
      $scope.softwareMouseover = "Software can only change when status is '" + 
        $scope.props.instStatusLabels[0] + "'";
    }
    else {
      $scope.softwareDisabled = false;
      $scope.softwareMouseover = "";
    }
  }

  // refresh the service list
  swService.refreshSwList();

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  $scope.swList = swService.getSwList();

  forgAreaService.promise.then(function () {
    $scope.forgAreasList = forgAreaService.getAreas().data;
    //console.log("forgUsersList promise updated just now");
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
  url = url + "/api/v1/inst/" + $routeParams.itemId;
  // $http.get($scope.props.instApiUrl+$routeParams.itemId).success(function(data) {
  $http.get(url).success(function (data) {
    $scope.formData = data;
    // set software field diable based on the given status
    $scope.onStatusChange();

    $scope.whichItem = $routeParams.itemId;
    // convert the retreived record areas
    forgAreaService.promise.then(function(){
      $scope.areasSelected =  forgAreaService.areaUidsToObjects($scope.formData.area);
    })
    // make a Date object from this string
    $scope.formData.statusDate = new Date($scope.formData.statusDate);

    // convert the retreived record software
    swService.promise.then(function(){
      let obj = swService.swIdsToObjects([$scope.formData.software])[0];
      // console.log('Got initial obj: ' + JSON.stringify(obj, null, 2));
      $scope.swSelected = {item: obj};
      // console.log('Got initial swSelected: ' + JSON.stringify($scope.swSelected, null, 2));
    });

  });
}

