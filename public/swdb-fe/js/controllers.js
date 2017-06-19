var appController = angular.module('appController', ['datatables','ngAnimate','ngSanitize','ui.bootstrap','ngCookies','ui.select']);

appController.run(['$rootScope','$route','$http','$routeParams','$location','configService', function($rootScope,$route,$http,$routeParams,$location, configService, slotService) {

    $rootScope.$on("$routeChangeSuccess", function(currentRoute, previousRoute){
        //Change page title, based on Route information
        $rootScope.title = $route.current.title;

    });
}]);

// expose system status to all controllers via service.
appController.factory('StatusService', function() {
    return {
        dbConnected : 'false'
    };
});

appController.controller('ListController', ListPromiseCtrl);
function ListPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q, $scope, $cookies, $window, configService, userService) {

    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "(click to logout)";
        } else {
            $scope.usrBtnTxt = '(click to login)';
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

    // get intitialization info
    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    var vm = this;
    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        $http.get($scope.props.apiUrl).then(function(result) {
            defer.resolve(result.data);
        });
        return defer.promise;
    }).withPaginationType('full_numbers');

    vm.dtColumns = [
        DTColumnBuilder.newColumn('swName').withTitle('Software name')
        .renderWith(function(data, type, full, meta) {
            return '<a href="#/details/'+full._id+'" class="btn btn-default">' +
                full.swName + '</a>';
        }),
        DTColumnBuilder.newColumn('version').withTitle('SW version').withOption('defaultContent',''),
        DTColumnBuilder.newColumn('branch').withTitle('SW branch').withOption('defaultContent',''),
        DTColumnBuilder.newColumn('owner').withTitle('Owner').withOption('defaultContent',""),
        DTColumnBuilder.newColumn('levelOfCare').withTitle('Level of care').withOption('defaultContent',""),
        DTColumnBuilder.newColumn('status').withTitle('Status').withOption('defaultContent',""),
        DTColumnBuilder.newColumn('statusDate').withTitle('Status date').withOption('defaultContent',"")
    ];
}

appController.controller('InstListController', InstListPromiseCtrl);
function InstListPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q, $scope, $cookies, $window, configService, userService) {

    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "(click to logout)";
        } else {
            $scope.usrBtnTxt = '(click to login)';
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

    // get initialization info
    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    var vm = this;
    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        $http.get($scope.props.instApiUrl).then(function(result) {
            defer.resolve(result.data);
        });
        return defer.promise;
    }).withPaginationType('full_numbers');

  vm.dtColumns = [
    DTColumnBuilder.newColumn('host').withTitle('host')
    .renderWith(function(data, type, full, meta) {
      return '<a href="#/inst/details/'+full._id+'" class="btn btn-default">' +
      full.host + '</a>';
      //$http.get($scope.props.apiUrl+full.software).success(function(data) {
        //return '<a href="#/inst/details/'+full._id+'" class="btn btn-default">' +
          //full.host+data.revision + '</a>';
     //});
    }),
        DTColumnBuilder.newColumn('software').withTitle('Software').withOption('defaultContent','').withClass("center"),
        DTColumnBuilder.newColumn('area').withTitle('Area'),
        DTColumnBuilder.newColumn('slots').withTitle('Slots')
    ];
}


appController.controller('DetailsController', DetailsPromiseCtrl);
function DetailsPromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {
    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "(click to logout)";
        } else {
            $scope.usrBtnTxt = '(click to login)';
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

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    //update document fields with existing data
    $http.get($scope.props.apiUrl+$routeParams.itemId).success(function(data) {
        $scope.formData = data;
        $scope.whichItem = $routeParams.itemId;
    });
}

appController.controller('InstDetailsController', InstDetailsPromiseCtrl);
function InstDetailsPromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {
    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "(click to logout)";
        } else {
            $scope.usrBtnTxt = '(click to login)';
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


appController.controller('NewController', NewPromiseCtrl);
function NewPromiseCtrl($scope, $http, $window, configService, userService) {

    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "(click to logout)";
        } else {
            $scope.usrBtnTxt = '(click to login)';
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

        if ($scope.inputForm.$valid){
            // handle swName
            $scope.formData.swName = $scope.selectedItem.name;
            $http({
                method: 'POST',
                url: $scope.props.apiUrl,
                data: $scope.formData,
                headers: { 'Content-Type': 'application/json' }
            })
                .success(function(data){
                    $scope.swdbParams.formStatus="Document posted";
                    $scope.swdbParams.formShowErr=false;
                    $scope.swdbParams.formShowStatus=true;
                })
                .error(function(error, status){
                    $scope.swdbParams.error = {message: error, status: status};
                    $scope.swdbParams.formErr="Error: "+$scope.swdbParams.error.message+"("+status+")";
                    $scope.swdbParams.formShowStatus=false;
                    $scope.swdbParams.formShowErr=true;
                });
        } else {
            $scope.swdbParams.formErr="Error: clear errors before submission";
            $scope.swdbParams.formShowStatus=false;
            $scope.swdbParams.formShowErr=true;
        }
    };

    $scope.newItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'comment'){
            $scope.formData.comment.push("");
        }
    };

    $scope.removeItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'comment'){
            $scope.formData.comment.splice(parts[2],1);
        }
    };

    getEnums = function() {
        $scope.levelOfCareEnums = $scope.props.levelOfCareEnums;
        $scope.formData.levelOfCare = "NONE";

        $scope.statusEnums = $scope.props.statusEnums;
        $scope.formData.status = "DEVEL";

        $scope.rcsEnums = $scope.props.rcsEnums;
        $scope.formData.versionControl = "Other";
    };

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();

    $scope.itemArray = $scope.props.validSwNamesGUIList;

    // check our user session and redirect if needed
    if (!$scope.session.username) {
        //go to cas
        $window.location.href = $scope.props.auth.cas+'/login?service='+encodeURIComponent($scope.props.auth.login_service);
    }

    // initialize this record
    $scope.formData = {
        comment: []
    };
    $scope.swdbParams = {
        formShowErr: false,
        formShowStatus: false,
        formStatus: "",
        formErr: ""
    };
    getEnums();
}


appController.controller('InstNewController', InstNewPromiseCtrl);
function InstNewPromiseCtrl($scope, $http, $window, configService, userService, slotService) {

  $scope.$watch(function() {
    return $scope.session;
  }, function() {
    // prep for login button
    if ($scope.session && $scope.session.username) {
      $scope.usrBtnTxt = "(click to logout)";
    } else {
      $scope.usrBtnTxt = '(click to login)';
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
    //console.log("Item:"+$item);
    //console.log("Model:"+$model);
    //console.log("Label:"+$label);
    var index = $scope.slotsSelected.indexOf($model);
    //console.log("index Item:"+index);
    if (index == -1){
      $scope.slotsSelected.unshift($model);
      $('#slots').focus();
      //console.log("slotsSelected now:"+$scope.slotsSelected);
    }
    else {
      //console.log("Duplicate Item:"+$model);
    }
  };

  $scope.removeSelectedSlot=function($item)
  {
    //console.log("Removing Item:"+$item);
    var index = $scope.slotsSelected.indexOf($item);
    if (index > -1){
      $scope.slotsSelected.splice(index,1);
    }
  };

  // get sw records from swdb api
  $scope.getSw = function(val) {
    return $http.get($scope.props.apiUrl).then(function(response){
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
                .success(function(data){
                    $scope.swdbParams.formStatus="Document posted";
                    $scope.swdbParams.formShowErr=false;
                    $scope.swdbParams.formShowStatus=true;
                })
                .error(function(error, status){
                    $scope.swdbParams.error = {message: error, status: status};
                    $scope.swdbParams.formErr="Error: "+$scope.swdbParams.error.message+"("+status+")";
                    $scope.swdbParams.formShowStatus=false;
                    $scope.swdbParams.formShowErr=true;
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
        $scope.statusEnums = $scope.props.statusEnums;
        $scope.formData.status = "DEVEL";
        $scope.areaEnums = $scope.props.areaEnums;
        $scope.formData.area = "Global";
    };

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    $scope.slots = slotService.getSlot();
    //console.log("slots: "+JSON.stringify($scope.slots));


    // check our user session and redirect if needed
    if (!$scope.session.username) {
        //go to cas
        $window.location.href = $scope.props.auth.cas+'/login?service='+encodeURIComponent($scope.props.auth.login_service);
    }

    // initialize this record
    $scope.formData = {
        //revisionControl: "",
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



appController.controller('UpdateController', UpdatePromiseCtrl);
function UpdatePromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {

    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "(click to logout)";
        } else {
            $scope.usrBtnTxt = '(click to login)';
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

    $scope.processForm = function(){
        if ($scope.inputForm.$valid){
            delete $scope.formData.__v;
            $http({
                method: 'PUT',
                url: $scope.props.apiUrl+$scope.formData._id,
                data: $scope.formData,
                headers: { 'Content-Type': 'application/json' }
            })
                .success(function(data){
                    $scope.swdbParams.formStatus="Document updates successfully posted";
                    $scope.swdbParams.formShowErr=false;
                    $scope.swdbParams.formShowStatus=true;
                })
                .error(function(error, status){
                    $scope.swdbParams.error = {message: error, status: status};
                    $scope.swdbParams.formErr="Error: "+$scope.swdbParams.error.message+"("+status+")";
                    $scope.swdbParams.formShowStatus=false;
                    $scope.swdbParams.formShowErr=true;
                });
        } else {
            $scope.swdbParams.formErr="Error: clear errors before submission";
            $scope.swdbParams.formShowStatus=false;
            $scope.swdbParams.formShowErr=true;
        }
    };

    $scope.newItem = function(event) {
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'auxSw'){
            $scope.formData.auxSw.push("");
        } else if (parts[1] === 'swDescDoc'){
            $scope.formData.swDescDoc.push("");
        } else if (parts[1] === 'validationDoc'){
            $scope.formData.validationDoc.push( {
                doc: "",
                date: ""
            }
            );
        } else if (parts[1] === 'verificationDoc'){
            $scope.formData.verificationDoc.push( {
                doc: "",
                date: ""
            }
            );
        } else if (parts[1] === 'comment'){
            $scope.formData.comment.push("");
        }
    };


    $scope.removeItem = function(event) {
        // handle removal of list items from the display
        var parts = event.currentTarget.id.split('.');
        if (parts[1] === 'auxSw'){
            $scope.formData.auxSw.splice(parts[2],1);
        } else if (parts[1] === 'swDescDoc'){
            $scope.formData.swDescDoc.splice(parts[2],1);
        } else if (parts[1] === 'validationDoc'){
            $scope.formData.validationDoc.splice(parts[2],1);
        } else if (parts[1] === 'verificationDoc'){
            $scope.formData.verificationDoc.splice(parts[2],1);
        } else if (parts[1] === 'comment'){
            $scope.formData.comment.splice(parts[2],1);
        }
    };

    getEnums = function() {
        // Set the enumerated values for this scope
        $scope.levelOfCareEnums = $scope.props.levelOfCareEnums;
        $scope.statusEnums = $scope.props.statusEnums;
    };

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
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

    getEnums();

    //update document fields with existing data
    $http.get($scope.props.apiUrl+$routeParams.itemId).success(function(data) {
        $scope.itemArray = $scope.props.validSwNamesGUIList;
        console.log("itemArray is now "+$scope.itemArray);
        $scope.formData = data;
        $scope.whichItem = $routeParams.itemId;

        // make a Date object from this string
        $scope.formData.statusDate = new Date($scope.formData.statusDate);
        // set selctor to current swName value
        $scope.selectedItem = {name: $scope.formData.swName};
        console.log("selectedItem.name is now "+$scope.selectedItem.name);
    });

}

appController.controller('InstUpdateController', InstUpdatePromiseCtrl);
function InstUpdatePromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {

  $scope.$watch(function() {
    return $scope.session;
  }, function() {
    // prep for login button
    if ($scope.session && $scope.session.username) {
      $scope.usrBtnTxt = "(click to logout)";
    } else {
      $scope.usrBtnTxt = '(click to login)';
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
  $scope.getSw = function(val) {
    return $http.get($scope.props.apiUrl).then(function(response){
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
                .success(function(data){
                    $scope.swdbParams.formStatus="Document updates successfully posted";
                    $scope.swdbParams.formShowErr=false;
                    $scope.swdbParams.formShowStatus=true;
                })
                .error(function(error, status){
                    $scope.swdbParams.error = {message: error, status: status};
                    $scope.swdbParams.formErr="Error: "+$scope.swdbParams.error.message+"("+status+")";
                    $scope.swdbParams.formShowStatus=false;
                    $scope.swdbParams.formShowErr=true;
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

    getEnums = function() {
        // Set the enumerated values for this scope
        $scope.statusEnums = $scope.props.statusEnums;
        $scope.areaEnums = $scope.props.areaEnums;
    };

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
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

    getEnums();

    //update document fields with existing data
    $http.get($scope.props.instApiUrl+$routeParams.itemId).success(function(data) {
        $scope.formData = data;
        $scope.whichItem = $routeParams.itemId;

        // make a Date object from this string
        $scope.formData.statusDate = new Date($scope.formData.statusDate);
        $scope.formData.area.selected = data.area;
    });
}
