
appController.controller('InstListController', InstListPromiseCtrl);
function InstListPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q, $scope, $cookies, $window, configService, userService, swService) {

  $scope.$watch(function () {
    return $scope.session;
  }, function () {
    // prep for login button
    if ($scope.session && $scope.session.username) {
      $scope.usrBtnTxt = '';
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  }, true);

  $scope.usrBtnClk = function () {
    if ($scope.session.username) {
      // logout if already logged in
      $http.get($scope.props.webUrl + 'logout').success(function (data) {
        $window.location.href = $scope.props.auth.cas + '/logout';
      });
    } else {
      //login
      $window.location.href =
        $scope.props.auth.cas + '/login?service=' +
        encodeURIComponent($scope.props.auth.login_service);
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
    $http.get($scope.props.instApiUrl).then(function (result) {
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
        if (!$scope.swMeta[full.software].branch){
          $scope.swMeta[full.software].branch = "";
        }
        if (!$scope.swMeta[full.software].version){
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
          th.append('<input id="' + table.settings().init().aoColumns[colIdx].mData + "Srch"+'" type="text" placeholder="' + (table.column(colIdx).placeholder || '')
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
    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = '';
        } else {
            $scope.usrBtnTxt = 'Log in';
        }
    },true);

    $scope.usrBtnClk = function(){
        if ($scope.session.username) {
            // logout if already logged in
            $http.get($scope.props.webUrl+'logout').success(function(data) {
                $window.location.href = $scope.props.auth.cas+'/logout';
            });
        } else {
            //login
            $window.location.href =
                $scope.props.auth.cas+'/login?service='+
                encodeURIComponent($scope.props.auth.login_service);
        }
    };

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    //update document fields with existing data
    $http.get($scope.props.instApiUrl+$routeParams.itemId).success(function(data) {
        $scope.formData = data;
        $scope.whichItem = $routeParams.itemId;
    });
}


appController.controller('InstNewController', InstNewPromiseCtrl);
function InstNewPromiseCtrl($scope, $http, $window, $location, configService, userService, slotService, swService) {

  $scope.$watch(function() {
    return $scope.session;
  }, function() {
    // prep for login button
    if ($scope.session && $scope.session.username) {
      $scope.usrBtnTxt = '';
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  },true);

  $scope.usrBtnClk = function(){
    if ($scope.session.username) {
      // logout if alredy logged in
      $http.get($scope.props.webUrl+'logout').success(function(data) {
        $window.location.href = $scope.props.auth.cas+'/logout';
      });
    } else {
      //login
      $window.location.href =
        $scope.props.auth.cas+'/login?service='+
        encodeURIComponent($scope.props.auth.login_service);
    }
  };

  $scope.slotSelect=function($item, $model, $label)
  {
    var index = $scope.slotsSelected.indexOf($model);
    if (index == -1){
      $scope.slotsSelected.unshift($model);
      $('#slots').focus();
    }
    else {
    }
  };

  $scope.removeSelectedSlot=function($item)
  {
    var index = $scope.slotsSelected.indexOf($item);
    if (index > -1){
      $scope.slotsSelected.splice(index,1);
    }
  };

  // get sw records from swdb api
  let url = $window.location.origin;
  url = url + "/api/v1/swdb/";

  $scope.getSw = function(val) {
    return $http.get(url).then(function(response){
    // return $http.get($scope.props.apiUrl).then(function(response){
      //console.log("Got sw list:"+JSON.stringify(response.data));
      return response.data.map(function(item){
        //console.log("looking at:"+JSON.stringify(item));
        return item;
      });
    });
  };

  $scope.swSelect=function($item, $model, $label)
  {
    $scope.formData.software=$item._id;
    //console.log("software is now:"+$scope.formData.software);
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



    $scope.processForm = function(){
        delete $scope.formData.__v;
        $scope.formData.slots = $scope.slotsSelected;
        console.log(JSON.stringify($scope.formData));

        if ($scope.inputForm.$valid){
            $http({
                method: 'POST',
                url: $scope.props.instApiUrl,
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
                  console.log("going to: /inst/details/"+id);
                  $location.path('/inst/details/' + id);
                }
              }, function error(response) {
                $scope.swdbParams.error = { message: response.statusText + response.data, status: response.status };
                $scope.swdbParams.formErr = "Error: " + $scope.swdbParams.error.message + "(" + response.status + ")";
                $scope.swdbParams.formShowStatus = false;
                $scope.swdbParams.formShowErr = true;
              });
        } else {
            $scope.swdbParams.formErr="Error: clear errors before submission";
            $scope.swdbParams.formShowStatus=false;
            $scope.swdbParams.formShowErr=true;
        }
    };

    $scope.newItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'slots'){
            $scope.formData.slots.push("");
        } else if (parts[1] === 'vvResultsLoc'){
            $scope.formData.vvResultsLoc.push("");
        }
    };

    $scope.removeItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'slots'){
            $scope.formData.slots.splice(parts[2],1);
        } else if (parts[1] === 'vvResultsLoc'){
            $scope.formData.vvResultsLoc.splice(parts[2],1);
        }
    };

    getEnums = function() {
        $scope.formData.status = "DEVEL";
        $scope.formData.area = "Global";
    };

    $scope.refreshSw = () => {
      $scope.swList = swService.getSwList();
    }

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    $scope.slots = slotService.getSlot();
    $scope.refreshSw();

    // check our user session and redirect if needed
    if (!$scope.session.username) {
        //go to cas
        $window.location.href = $scope.props.auth.cas+'/login?service='+encodeURIComponent($scope.props.auth.login_service);
    }

    // sw just updated, refresh the service list
    swService.refreshSwList();

    // initialize this record
    $scope.formData = {
        //versionControl: "",
        slots: [],
        vvResultLoc: [],
    };

    $scope.swdbParams = {
        formShowErr: false,
        formShowStatus: false,
        formStatus: "",
        formErr: ""
    };
    getEnums();
    $scope.slotsSelected = [];
}


appController.controller('InstUpdateController', InstUpdatePromiseCtrl);
function InstUpdatePromiseCtrl($scope, $http, $routeParams, $window, $location, configService, userService, swService) {

  $scope.$watch(function() {
    return $scope.session;
  }, function() {
    // prep for login button
    if ($scope.session && $scope.session.username) {
      $scope.usrBtnTxt = '';
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  },true);

  $scope.usrBtnClk = function(){
    if ($scope.session.username) {
      // logout if alredy logged in
      $http.get($scope.props.webUrl+'logout').success(function(data) {
        $window.location.href = $scope.props.auth.cas+'/logout';
      });
    } else {
      //login
      $window.location.href =
        $scope.props.auth.cas+'/login?service='+
        encodeURIComponent($scope.props.auth.login_service);
    }
  };

  // get sw records from swdb api
  let url = $window.location.origin;
  url = url + "/api/v1/swdb/";

  $scope.getSw = function(val) {
    return $http.get(url).then(function(response){
    // return $http.get($scope.props.apiUrl).then(function(response){
      //console.log("Got sw list:"+JSON.stringify(response.data));
      return response.data.map(function(item){
        //console.log("looking at:"+JSON.stringify(item));
        return item;
      });
    });
  };

  $scope.swSelect=function($item, $model, $label)
  {
    $scope.formData.software=$item._id;
    //console.log("software is now:"+$scope.formData.software);
  };

    $scope.processForm = function(){
        if ($scope.inputForm.$valid){
            delete $scope.formData.__v;
            $http({
                method: 'PUT',
                url: $scope.props.instApiUrl+$scope.formData._id,
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
            $scope.swdbParams.formErr="Error: clear errors before submission";
            $scope.swdbParams.formShowStatus=false;
            $scope.swdbParams.formShowErr=true;
        }
    };

    $scope.newItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'area'){
            $scope.formData.area.push("");
        } else if (parts[1] === 'slots'){
            $scope.formData.slots.push("");
        } else if (parts[1] === 'vvResultsLoc'){
            $scope.formData.vvResultsLoc.push("");
        } else if (parts[1] === 'drrs'){
            $scope.formData.drrs.push("");
        }
    };

    $scope.removeItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'area'){
            $scope.formData.area.splice(parts[2],1);
        } else if (parts[1] === 'slots'){
            $scope.formData.slots.splice(parts[2],1);
        } else if (parts[1] === 'vvResultsLoc'){
            $scope.formData.vvResultsLoc.splice(parts[2],1);
        } else if (parts[1] === 'drrs'){
            $scope.formData.drrs.splice(parts[2],1);
        }
    };

    // refresh the service list
    swService.refreshSwList();

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    $scope.swList = swService.getSwList();

    // check our user session and redirect if needed
    if (!$scope.session.username) {
        //go to cas
        $window.location.href = $scope.props.auth.cas+'/login?service='+encodeURIComponent($scope.props.auth.login_service);
    }

    $scope.swdbParams = {
        formShowErr: false,
        formShowStatus: false,
        formStatus: "",
        formErr: ""
    };

    //update document fields with existing data
    $http.get($scope.props.instApiUrl+$routeParams.itemId).success(function(data) {
        $scope.formData = data;
        $scope.whichItem = $routeParams.itemId;
        $scope.swSelected = data.software;

        // make a Date object from this string
        $scope.formData.statusDate = new Date($scope.formData.statusDate);
        $scope.formData.area.selected = data.area;
    });
}

