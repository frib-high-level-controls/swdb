var app = angular.module('app', [
    'ngRoute',
    'appController',
    'ngMessages'
]);

// record xfer service
// for transferring records between routes
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
        console.log('default swService load occurred: ' + JSON.stringify(data));
    });

    return {
      promise: promise,
      getSwList: function () {
          return swData;
        },
      refreshSwList: function () {
        promise = $http({ url: '/api/v1/swdb/', method: "GET" }).success(function (data) {
          swData = data;
          console.log('swService reload occurred: ' + JSON.stringify(data));
        });
        return promise;
      },
      /**
       * getSwById
       * @param swId id user ID string
       * @return matching sw objects
       */
      getSwById: function (swId) {
        return swData.find(function (item, idx){
          return item._id === swId;
        })
      },
      /**
       * userUidsToObjects
       * @param swIds array id user ID strings
       * @return array of sw objects from forg
       */
      swIdsToObjects: function(swIds) {
        swObj = swIds.map(function(item, idx, array){
          let node =  swData.find(function(elem) {
            return elem._id === item;
          });
          return node;
        }); 
        return swObj;
      }
    };
});

// Service to get inst data to controllers
app.service('instService', function($http) {
    var instData = null;

    var promise = 	$http({url: '/api/v1/inst/',method: "GET"}).then(function(data) {
        instData = data.data;
    });

    return {
      promise: promise,
      getInstList: function () {
          return instData;
        },
      refreshInstList: function () {
        promise = $http({ url: '/api/v1/inst/', method: "GET" }).then(function (data) {
          instData = data.data;
        });
        return promise;
      },
      /**
       * getInstById
       * @param instId installation ID string
       * @return matching inst object
       */
      getInstById: function (instId) {
        return instData.find(function (item, idx){
          return item._id === instId;
        })
      },
      /**
       * getInstBySw
       * @param swId software ID string
       * @return list of matching installation objects
       */
      getInstsBySw: function (swId) {
        let arr = instData.map(function (item, idx, arr){
          if (item.software === swId) {
            return item
          }
        });
        // map returns [null] if nothing matches. make it [].
        if (arr[0] == null) {
          return [];
        } else {
          return arr;
        }
      }
    }
});

// Service to get FORG user data to controllers
app.service('forgUserService', function ($http) {
  var userData = null;

  var promise = $http({ url: '/api/v1/swdb/forgUsers', method: "GET" }).then(function (data) {
    userData = data;
  });

  return {
    promise: promise,
    getUsers: function () {
      return userData;
    },
    refreshUsersList: function () {
      $http({ url: '/api/v1/swdb/forgUsers', method: "GET" }).then(function (data) {
        userData = data;
        return userData;
      });
    },
    /**
     * userUidsToObjects
     * @param userUids array id user UID strings
     * @return array of user objects from forg
     */
    userUidsToObjects: function(userUids) {
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
  });

  return {
    promise: promise,
    getGroups: function () {
      return groupData;
    },
    refreshGroupsList: function () {
      $http({ url: '/api/v1/swdb/forgGroups', method: "GET" }).then(function (data) {
        groupData = data;
        return groupData;
      });
    },
    /**
     * groupUidsToObjects
     * @param groupUids array id group UID strings
     * @return array of group objects from forg
     */
    groupUidsToObjects: function(groupUids) {
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
  });

  return {
    promise: promise,
    getAreas: function () {
      return areaData;
    },
    refreshAreasList: function () {
      $http({ url: '/api/v1/swdb/forgAreas', method: "GET" }).then(function (data) {
        areaData = data;
        return areaData;
      });
    },
    /**
     * areaUIidsToObjects
     * @param areaUids array id area UID strings
     * @return array of area objects from forg
     */
    areaUidsToObjects: function(areaUids) {
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
          swOut.push(element);
        } else {
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
    let re = new RegExp(srchTxt, 'i');
    filtered = forgUserIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('ownNopromiseFilter', function () {
  return function (forgGroupIn, srchTxt) {
    let re = new RegExp(srchTxt, 'i');
    filtered = forgGroupIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('engFilter', function() {
  return function (forgUserIn, srchTxt) {
    return forgUserIn.then(function(forgUserIn) {
      let re = new RegExp(srchTxt, 'i');
      filtered = forgUserIn.filter(function(element, idx, arr) {
        if (element.uid.match(re)) {
          return element;
        }
      });
      return filtered;
    });
  };
});

app.filter('areasNopromiseFilter', function () {
  return function (forgAreaIn, srchTxt) {
    let re = new RegExp(srchTxt, 'i');
    filtered = forgAreaIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
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
                },
                'swServiceData': function(swService){
                    return swService.promise;
                },
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
                },
                'instServiceData': function(instService){
                    return instService.promise;
                },
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
                },
                'swServiceData': function(swService){
                    return swService.promise;
                },
                'instServiceData': function(instService){
                    return instService.promise;
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
                },
                'swServiceData': function(swService){
                    return swService.promise;
                },
                'instServiceData': function(instService){
                    return instService.promise;
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
