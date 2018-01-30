var app = angular.module('app', [
    'ngRoute',
    'appController',
    'ngMessages'
]);


// Service to get config data to controllers
app.service('configService', function($http) {
    var configData = null;

    var promise = 	$http({url: '/api/v1/swdb/config', method: "GET"}).success(function(data) {
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

    var promise = 	$http({url: '/api/v1/swdb/user',method: "GET"}).success(function(data) {
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
    var slotData = null;

    var promise = 	$http({
      url: '/api/v1/swdb/slot',
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    }).success(function(data) {
        slotData = data;
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

// Service to get sw data to controllers
app.service('swService', function($http) {
    var swData = null;

    var promise = 	$http({url: '/api/v1/swdb/',method: "GET"}).success(function(data) {
        swData = data;
    });

    return {
      promise: promise,
      getSwList: function () {
          return swData;
        },
      refreshSwList: function () {
        $http({ url: '/api/v1/swdb/', method: "GET" }).success(function (data) {
           swData = data;
           });
        }
    };
});
// Service to get FORG user data to controllers
app.service('forgUserService', function($http) {
    var userData = null;

    var promise = 	$http({url: '/api/v1/swdb/forgUsers', method: "GET"}).then(function(data) {
        userData = data;
        //console.log("userData set to " + JSON.stringify(userData, null, 2));
    });

    return {
        promise: promise,
        getUsers: function () {
          //console.log("forgUserService.getUsers() returning " + JSON.stringify(userData));  
          return userData;
        },
      refreshUsersList: function () {
        $http({ url: '/api/v1/swdb/forgUsers', method: "GET" }).then(function (data) {
           userData = data;
           return userData;
           //console.log("forgUserService.refreshUsersList() returning");  
           });
        }
    };
});

app.filter('swFilt', function () {
  // custom filter for sw records  
  return function (swIn, srchTxt) {
    swOut = [];
    if (typeof srchTxt === 'string' || srchTxt instanceof String) {
      // make sure we have a real search string
      let re = new RegExp(srchTxt, 'gi'); // precompile regex first
      swIn.forEach((element) => {
        if (!element.branch) {
          // set branch to empty string if it does not exist
          element.branch = "";
        }
        if (element.swName.match(re) || element.branch.match(re) || element.version.match(re)) {
          // console.log("Match " + JSON.stringify(element) + " " + srchTxt);
          swOut.push(element);
        } else {
          // console.log("No match " + JSON.stringify(element) + " " + srchTxt);
          return false;
        }
      });
      return swOut;
    }
    else {
      return srchTxt;
    }
  };
});

app.filter('engNopromiseFilter', function () {
  return function (forgUserIn, srchTxt) {
    //console.log("engFilter got " + srchTxt + JSON.stringify(forgUserIn));
    let re = new RegExp(srchTxt, 'i');
    filtered = forgUserIn.filter(function (element, idx, arr) {
      // console.log("searching " + srchTxt + JSON.stringify(element.uid));
      if (element.uid.match(re)) {
        // console.log("matched " + JSON.stringify(element));
        return element;
      }
    });
    return filtered;
  };
});

app.filter('engFilter', function() {
  return function (forgUserIn, srchTxt) {
    //console.log("engFilter got " + srchTxt + JSON.stringify(forgUserIn));
    return forgUserIn.then(function(forgUserIn) {
      let re = new RegExp(srchTxt, 'i');
      filtered = forgUserIn.filter(function(element, idx, arr) {
        // console.log("searching " + srchTxt + JSON.stringify(element.uid));
        if (element.uid.match(re)) {
          // console.log("matched " + JSON.stringify(element));
          return element;
        }
      });
      return filtered;
    });
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
                //'swServiceData': function(swService){
                    //return swService.promise;
                //},
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
                'swServiceData': function(swService){
                    return swService.promise;
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
                },
                'slotServiceData': function(slotService){
                    return slotService.promise;
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
