var app = angular.module('app', [
    'ngRoute',
    'appController',
    'ngMessages'
]);

// Service to get config data to controllers
app.service('configService', function($http) {
    var configData = null;

    var promise = 	$http({url: '/swdbserv/v1/config',method: "GET"}).success(function(data) {
        configData = data;
    });

    return {
        promise: promise,
        setData: function (data) {
            configData = data;
        },
        getConfig: function () {
            return configData;
        }
    };
});

// Service to get user data to controllers
app.service('userService', function($http) {
    var userData = null;

    var promise = 	$http({url: '/swdbserv/v1/user',method: "GET"}).success(function(data) {
        userData = data;
    });

    return {
        promise: promise,
        setData: function (data) {
            userData = data;
        },
        getUser: function () {
            return userData;
        }
    };
});

// Service to get ccdb slots to controllers
app.service('slotService', function($http) {
    //$scope.props = configService.getConfig();
    var slotData = null;

    //var promise = 	$http({url: config.ccdbApiUrl+'slot',method: "GET"}).success(function(data) {
    var promise = 	$http({
      url: '/instserv/v1/slot',
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    }).success(function(data) {
        slotData = data;
        //console.log("in service");
        //console.log("service got:"+JSON.stringify(data));
    });

    return {
        promise: promise,
        setData: function (data) {
            slotData = data;
        },
        getSlot: function () {
            return slotData;
        }
    };
});

app.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/list', {
            templateUrl: 'swdb-fe/partials/list.html',
            controller: 'ListController',
            title: 'List',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                },
            }
        })
        .when('/inst/list', {
            templateUrl: 'swdb-fe/partials/instList.html',
            controller: 'InstListController',
            title: 'Installations List',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                },
            }
        })
        .when('/details/:itemId', {
            templateUrl: 'swdb-fe/partials/details.html',
            controller: 'DetailsController',
            title: 'Details',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                }
            }
        })
        .when('/inst/details/:itemId', {
            templateUrl: 'swdb-fe/partials/instDetails.html',
            controller: 'InstDetailsController',
            title: 'Installation Details',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                }
            }
        })
        .when('/new', {
            templateUrl: 'swdb-fe/partials/new.html',
            controller: 'NewController',
            title: 'New',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                }
            }
        })
        .when('/inst/new', {
            templateUrl: 'swdb-fe/partials/instNew.html',
            controller: 'InstNewController',
            title: 'New Installation',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                },
                'slotServiceData': function(slotService){
                    return slotService.promise;
                }
            }
        })
        .when('/update/:itemId', {
            templateUrl: 'swdb-fe/partials/new.html',
            controller: 'UpdateController',
            title: 'Update',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                }
            }
        })
        .when('/inst/update/:itemId', {
            templateUrl: 'swdb-fe/partials/instNew.html',
            controller: 'InstUpdateController',
            title: 'Update Installation',
            resolve:{
                'configServiceData': function(configService){
                    return configService.promise;
                },
                'userServiceData': function(userService){
                    return userService.promise;
                }
            }
        })
        .when('/del/:itemId', {
            templateUrl: 'swdb-fe/partials/del.html',
            controller: 'DelController',
            title: 'Delete'
        })
        .otherwise({
            redirectTo: '/list'
        });
}]);
