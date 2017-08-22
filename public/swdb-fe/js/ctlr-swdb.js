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
            $scope.usrBtnTxt = "";
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
            return '<a href="#/details/'+full._id+'">' +
                full.swName + '</a>';
        }),
        DTColumnBuilder.newColumn('version').withTitle('SW version').withOption('defaultContent',''),
        DTColumnBuilder.newColumn('branch').withTitle('SW branch').withOption('defaultContent',''),
        DTColumnBuilder.newColumn('owner').withTitle('Owner').withOption('defaultContent',""),
        DTColumnBuilder.newColumn('engineer').withTitle('Engineer').withOption('defaultContent',""),
        DTColumnBuilder.newColumn('status').withTitle('Status').withOption('defaultContent',""),
        DTColumnBuilder.newColumn('statusDate').withTitle('Status date').withOption('defaultContent',"")
    ];
}


appController.controller('DetailsController', DetailsPromiseCtrl);
function DetailsPromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {
    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "";
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

    $scope.props = configService.getConfig();
    $scope.session = userService.getUser();
    //update document fields with existing data
    $http.get($scope.props.apiUrl+$routeParams.itemId).success(function(data) {
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
            $scope.usrBtnTxt = "";
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
    };
    $scope.swdbParams = {
        formShowErr: false,
        formShowStatus: false,
        formStatus: "",
        formErr: ""
    };
    getEnums();
}


appController.controller('UpdateController', UpdatePromiseCtrl);
function UpdatePromiseCtrl($scope, $http, $routeParams, $window, configService, userService) {

    $scope.$watch(function() {
        return $scope.session;
    }, function() {
        // prep for login button
        if ($scope.session && $scope.session.username) {
            $scope.usrBtnTxt = "";
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


    getEnums = function() {
        // Set the enumerated values for this scope
        $scope.levelOfCareEnums = $scope.props.levelOfCareEnums;
        //$scope.formData.levelOfCare = "NONE";

        $scope.statusEnums = $scope.props.statusEnums;
        //$scope.formData.status = "DEVEL";

        $scope.rcsEnums = $scope.props.rcsEnums;
        //$scope.formData.versionControl = "Other";
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
        $scope.formData = data;
        $scope.whichItem = $routeParams.itemId;

        // make a Date object from this string
        $scope.formData.statusDate = new Date($scope.formData.statusDate);
        // set selctor to current swName value
        $scope.selectedItem = {name: $scope.formData.swName};
    });

}

