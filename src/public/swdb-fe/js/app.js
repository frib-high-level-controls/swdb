var app = angular.module('app', [
    'ngRoute',
    'appController',
    'ngMessages'
]);

// record xfer service
app.service('recService', function() {
    var recData = null;

    return {
        setRec: function (data) {
            recData = data;
        },
        getRec: function () {
            return recData;
        }
    };
});

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
        console.log('set initial swData: ' + JSON.stringify(swData, null, 2));
    });

    return {
      promise: promise,
      getSwList: function () {
          return swData;
          console.log('sending swData: ' + JSON.stringify(swData, null, 2));
        },
      refreshSwList: function () {
        $http({ url: '/api/v1/swdb/', method: "GET" }).success(function (data) {
          swData = data;
          console.log('set another swData: ' + JSON.stringify(swData, null, 2));
           });
      },
      /**
       * userUidsToObjects
       * @param swIds array id user ID strings
       * @return array of sw objects from forg
       */
      swIdsToObjects: function(swIds) {
        console.log("sw ids: " + JSON.stringify(swIds));
        // console.log("swData: " + JSON.stringify(swData));
        swObj = swIds.map(function(item, idx, array){
          let node =  swData.find(function(elem) {
            return elem._id === item;
          });
          console.log("node found: "+JSON.stringify(node, null, 2));
          return node;
        }); 
        console.log("node swObj: "+JSON.stringify(swObj, null, 2));
        return swObj;
      }
    };
});

// Service to get FORG user data to controllers
app.service('forgUserService', function ($http) {
  var userData = null;

  var promise = $http({ url: '/api/v1/swdb/forgUsers', method: "GET" }).then(function (data) {
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
    },
    /**
     * userUidsToObjects
     * @param userUids array id user UID strings
     * @return array of user objects from forg
     */
    userUidsToObjects: function(userUids) {
      // console.log("users: " + JSON.stringify(userUids));
      // console.log("userData: " + JSON.stringify(userData));
      forgObj = userUids.map(function(item, idx, array){
        return userData.data.find(function(elem) {
          return elem.uid === item;
        })
      }) 
      return forgObj;
    }
  };
});

// Service to get FORG group data to controllers
app.service('forgGroupService', function ($http) {
  var groupData = null;

  var promise = $http({ url: '/api/v1/swdb/forgGroups', method: "GET" }).then(function (data) {
    groupData = data;
    //console.log("userData set to " + JSON.stringify(userData, null, 2));
  });

  return {
    promise: promise,
    getGroups: function () {
      //console.log("forgUserService.getUsers() returning " + JSON.stringify(userData));  
      return groupData;
    },
    refreshGroupsList: function () {
      $http({ url: '/api/v1/swdb/forgGroups', method: "GET" }).then(function (data) {
        groupData = data;
        return groupData;
        //console.log("forgUserService.refreshUsersList() returning");  
      });
    },
    /**
     * groupUidsToObjects
     * @param groupUids array id group UID strings
     * @return array of group objects from forg
     */
    groupUidsToObjects: function(groupUids) {
      // console.log("groups: " + JSON.stringify(groupUids));
      // console.log("groupData: " + JSON.stringify(groupData));
      forgObj = groupUids.map(function(item, idx, array){
        return groupData.data.find(function(elem) {
          return elem.uid === item;
        })
      }) 
      return forgObj;
    }
  };
});

// Service to get FORG area data to controllers
app.service('forgAreaService', function ($http) {
  var areaData = null;

  var promise = $http({ url: '/api/v1/swdb/forgAreas', method: "GET" }).then(function (data) {
    areaData = data;
    //console.log("userData set to " + JSON.stringify(userData, null, 2));
  });

  return {
    promise: promise,
    getAreas: function () {
      //console.log("forgUserService.getUsers() returning " + JSON.stringify(userData));  
      return areaData;
    },
    refreshAreasList: function () {
      $http({ url: '/api/v1/swdb/forgAreas', method: "GET" }).then(function (data) {
        areaData = data;
        return areaData;
        //console.log("forgUserService.refreshUsersList() returning");  
      });
    },
    /**
     * areaUIidsToObjects
     * @param areaUids array id area UID strings
     * @return array of area objects from forg
     */
    areaUidsToObjects: function(areaUids) {
      // console.log("areas: " + JSON.stringify(areaUids));
      // console.log("areaData: " + JSON.stringify(areaData));
      if (areaUids) {
        forgObj = areaUids.map(function (item, idx, array) {
          return areaData.data.find(function (elem) {
            return elem.uid === item;
          })
        })
      } else {
        forgObj = null;
      }
      return forgObj;
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

app.filter('ownNopromiseFilter', function () {
  return function (forgGroupIn, srchTxt) {
    //console.log("groupFilter got " + srchTxt + JSON.stringify(forgGroupIn));
    let re = new RegExp(srchTxt, 'i');
    filtered = forgGroupIn.filter(function (element, idx, arr) {
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

app.filter('areasNopromiseFilter', function () {
  return function (forgAreaIn, srchTxt) {
    //console.log("areaFilter got " + srchTxt + JSON.stringify(forgAreaIn));
    let re = new RegExp(srchTxt, 'i');
    filtered = forgAreaIn.filter(function (element, idx, arr) {
      // console.log("searching " + srchTxt + JSON.stringify(element.uid));
      if (element.uid.match(re)) {
        // console.log("matched " + JSON.stringify(element));
        return element;
      }
    });
    return filtered;
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
