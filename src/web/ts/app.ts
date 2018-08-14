var app = angular.module('app', [
    'ngRoute',
    'appController',
    'ngMessages'
]);

// record xfer service
// for transferring records between routes
app.service('recService', function() {
    var recData: webapi.ISwdb | null = null;

    return {
        setRec: function (data: webapi.ISwdb) {
            recData = data;
        },
        getRec: function () {
            return recData;
        }
    };
});

// Service to get config data to controllers
app.service('configService', function($http: ng.IHttpService) {
    var configData: IConfigProps | null = null;

    var promise = 	$http({url: basePath + '/api/v1/swdb/config', method: "GET"})
    .then(function(data: {data: IConfigProps} & angular.IHttpResponse<any>) {
        configData = data.data;
    });

    return {
        promise: promise,
        setData: function (data: IConfigProps) {
            configData = data;
        },
        getConfig: function () {
            return configData;
        }
    };
});

// Service to get user data to controllers
app.service('userService', function($http: ng.IHttpService) {
    var userData: IForgUser | null = null;

    var promise = 	$http({url: basePath + '/api/v1/swdb/user',method: "GET"})
      .then(function (data: {data: IForgUser} & angular.IHttpResponse<any>) {
        userData = data.data;
    });

    return {
        promise: promise,
        setData: function (data: IForgUser) {
            userData = data;
        },
        getUser: function () {
            return userData;
        }
    };
});

// Service to get ccdb slots to controllers
app.service('slotService', function($http: ng.IHttpService) {
    var slotData: IForgSlot | null = null;

    var promise = 	$http({
      url: basePath + '/api/v1/swdb/slot',
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function(data: IForgSlot & angular.IHttpResponse<any>) {
        slotData = data;
    });

    return {
        promise: promise,
        setData: function (data: IForgSlot) {
            slotData = data;
        },
        getSlot: function () {
            return slotData;
        }
    };
});

// Service to get sw data to controllers
app.service('swService', function($http: ng.IHttpService) {
    var swData: webapi.ISwdb[] | null = null;
    var promise = 	$http({url: basePath + '/api/v1/swdb',method: "GET"})
    .then(function(data: {data: webapi.ISwdb[]} & angular.IHttpResponse<any>) {
        swData = data.data;
    });

    return {
      promise: promise,
      getSwList: function () {
          return swData;
        },
      refreshSwList: function () {
        promise = $http({ url: basePath + '/api/v1/swdb', method: "GET" })
        .then(function (data: {data: webapi.ISwdb[]} & angular.IHttpResponse<any>) {
          swData = data.data;
        });
        return promise;
      },
      /**
       * getSwById
       * @param swId id user ID string
       * @return matching sw objects
       */
      getSwById: function (swId: string) {
        if (swData) {
          return swData.filter(function (item: webapi.ISwdb) {
            return item._id === swId;
          });
        }
      },
      /**
       * userUidsToObjects
       * @param swIds array id user ID strings
       * @return array of sw objects from forg
       */
      swIdsToObjects: function(swIds: string[]) {
        var swObj = swIds.map(function(item, idx, array){
          if (swData) {
            let node = swData.filter(function (elem) {
              return elem._id === item;
            });
            return node;
          } else {
            return [];
          }
        });
        return swObj[0];
      }
    };
});

// Service to get inst data to controllers
app.service('instService', function($http: ng.IHttpService) {
    var instData: webapi.Inst[] | null = null;

    var promise = 	$http({url: basePath + '/api/v1/inst',method: "GET"})
      .then(function (data: {data: webapi.Inst[]} & angular.IHttpResponse<any>) {
        instData = data.data;
      });

    return {
      promise: promise,
      getInstList: function () {
          return instData;
        },
      refreshInstList: function () {
        promise = $http({ url: basePath + '/api/v1/inst', method: "GET" })
          .then(function (data: {data: webapi.Inst[]} & angular.IHttpResponse<any>) {
            instData = data.data;
          });
        return promise;
      },
      /**
       * getInstById
       * @param instId installation ID string
       * @return matching inst object
       */
      getInstById: function (instId: string) {
        if (instData) {
          return instData.filter(function (item, idx) {
            if (item._id === instId) {
              return true;
            } else {
              //
            }
          });
        }
      },
      /**
       * getInstBySw
       * @param swId software ID string
       * @return list of matching installation objects
       */
      getInstsBySw: function (swId: string) {
        let arr: Array<webapi.Inst| undefined> = [];
        if (instData) {
          arr = instData.map(function (item) {
            if (item.software === swId) {
              return item
            }
          });
        } else {
          arr = [];
        }
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
app.service('forgUserService', function ($http: ng.IHttpService) {
  var userData: {data: IForgUser[]} | null = null;

  var promise = $http({ url: basePath + '/api/v1/swdb/forgUsers', method: "GET" })
    .then(function (data: IForgUser[] & angular.IHttpResponse<any>) {
      userData = data;
    });

  return {
    promise: promise,
    getUsers: function () {
      return userData;
    },
    refreshUsersList: function () {
      $http({ url: basePath + '/api/v1/swdb/forgUsers', method: "GET" })
        .then(function (data: IForgUser[] & angular.IHttpResponse<any>) {
          userData = data;
          return userData;
        });
    },
    /**
     * userUidsToObjects
     * @param userUids array id user UID strings
     * @return array of user objects from forg
     */
    userUidsToObjects: function(userUids: string[]) {
      var forgObj = userUids.map(function(item, idx, array){
        if (userData) {
          return userData.data.filter(function (elem: IForgUser) {
            return elem.uid === item;
          })
        }
      }) 
      return forgObj[0];
    }
  };
});

// Service to get FORG group data to controllers
app.service('forgGroupService', function ($http: ng.IHttpService) {
  var groupData: {data: IForgGroup[]} | null = null;

  var promise = $http({ url: basePath + '/api/v1/swdb/forgGroups', method: "GET" })
    .then(function (data: IForgGroup[] & angular.IHttpResponse<any>) {
      groupData = data;
    });

  return {
    promise: promise,
    getGroups: function () {
      return groupData;
    },
    refreshGroupsList: function () {
      $http({ url: basePath + '/api/v1/swdb/forgGroups', method: "GET" })
        .then(function (data: IForgGroup[] & angular.IHttpResponse<any>) {
        groupData = data;
        return groupData;
      });
    },
    /**
     * groupUidsToObjects
     * @param groupUids array id group UID strings
     * @return array of group objects from forg
     */
    groupUidsToObjects: function (groupUids: string[]) {
      var forgObj = groupUids.map(function (item, idx, array) {
        if (groupData) {
          return groupData.data.filter(function (elem) {
            return elem.uid === item;
          })
        }
      }) 
      return forgObj[0];
    }
  };
});

// Service to get FORG area data to controllers
app.service('forgAreaService', function ($http: ng.IHttpService) {
  var areaData: {data: IForgArea[]} | null = null;

  var promise = $http({ url: basePath + '/api/v1/swdb/forgAreas', method: "GET" })
    .then(function (data: IForgArea[] & angular.IHttpResponse<any>) {
      areaData = data;
    });

  return {
    promise: promise,
    getAreas: function () {
      return areaData;
    },
    refreshAreasList: function () {
      $http({ url: basePath + '/api/v1/swdb/forgAreas', method: "GET" })
        .then(function (data: IForgArea[] & angular.IHttpResponse<any>) {
          if (areaData){
            areaData = data;
            return areaData;
          }
        });
    },
    /**
     * areaUIidsToObjects
     * @param areaUids array id area UID strings
     * @return array of area objects from forg
     */
    areaUidsToObjects: function(areaUids: string[]) {
      var forgObj
      if (areaUids) {
        forgObj = areaUids.map(function (item, idx, array) {
          if (areaData) {
            return areaData.data.filter(function (elem) {
              return elem.uid === item;
            })[0]
          }
        })
      } else {
        forgObj = null;
      }
      if (forgObj){
        return forgObj;
      } else {
        return [];
      }
    }
  };
});

app.filter('swFilt', function () {
  // custom filter for sw records
  return function (swIn: webapi.ISwdb[], srchTxt: string) {
    let swOut: webapi.ISwdb[] = [];
    if (typeof srchTxt === 'string') {
      // make sure we have a real search string
      let re = new RegExp(srchTxt, 'gi'); // precompile regex first
      swIn.forEach((element) => {
        if (!element.branch) {
          // set branch to empty string if it does not exist
          element.branch = "";
        }
        if (!element.swName) {
          // set branch to empty string if it does not exist
          element.swName = "";
        }
        if (!element.version) {
          // set branch to empty string if it does not exist
          element.version = "";
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
  return function (forgUserIn: IForgUser[], srchTxt: string) {
    let re = new RegExp(srchTxt, 'i');
    const filtered = forgUserIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('ownNopromiseFilter', function () {
  return function (forgGroupIn: IForgGroup[], srchTxt: string) {
    let re = new RegExp(srchTxt, 'i');
    const filtered = forgGroupIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('engFilter', function() {
  return function (forgUserIn: IForgUser[], srchTxt: string) {
    let re = new RegExp(srchTxt, 'i');
    const filtered = forgUserIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('areasNopromiseFilter', function () {
  return function (forgAreaIn: IForgArea[], srchTxt: string) {
    let re = new RegExp(srchTxt, 'i');
    const filtered = forgAreaIn.filter(function (element, idx, arr) {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.config(['$routeProvider', function($routeProvider: ng.route.IRouteParamsService){
    $routeProvider.
        when('/list', {
            templateUrl: 'partials/list.html',
            controller: 'ListController',
            title: 'List',
            resolve:{
                'configServiceData': function(configService: IConfigService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
            }
        })
        .when('/inst/list', {
            templateUrl: 'partials/instList.html',
            controller: 'InstListController',
            title: 'Installations List',
            resolve:{
                'configServiceData': function(configService: IConfigService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
                //'swServiceData': function(swService){
                    //return swService.promise;
                //},
            }
        })
        .when('/details/:itemId', {
            templateUrl: 'partials/details.html',
            controller: 'DetailsController',
            title: 'Details',
            resolve:{
                'configServiceData': function(configService: IConfigService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
                'swServiceData': function(swService: ISwService){
                    return swService.promise;
                },
            }
        })
        .when('/inst/details/:itemId', {
            templateUrl: 'partials/instDetails.html',
            controller: 'InstDetailsController',
            title: 'Installation Details',
            resolve:{
                'configServiceData': function(configService: IConfigService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
                'instServiceData': function(instService: IInstService){
                    return instService.promise;
                },
            }
        })
        .when('/new', {
            templateUrl: 'partials/new.html',
            controller: 'NewController',
            title: 'New',
            resolve:{
                'configServiceData': function(configService: IConfigService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                }
            }
        })
        .when('/inst/new', {
            templateUrl: 'partials/instNew.html',
            controller: 'InstNewController',
            title: 'New Installation',
            resolve:{
                'configServiceData': function(configService: IUserService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
                'swServiceData': function(swService: ISwService){
                    return swService.promise;
                },
                // 'slotServiceData': function(slotService: ISlotService){
                //     return slotService.promise;
                // }
            }
        })
        .when('/update/:itemId', {
            templateUrl: 'partials/new.html',
            controller: 'UpdateController',
            title: 'Update',
            resolve:{
                'configServiceData': function(configService: IUserService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
                'swServiceData': function(swService: ISwService){
                    return swService.promise;
                },
                'instServiceData': function(instService: IInstService){
                    return instService.promise;
                }
            }
        })
        .when('/inst/update/:itemId', {
            templateUrl: 'partials/instNew.html',
            controller: 'InstUpdateController',
            title: 'Update Installation',
            resolve:{
                'configServiceData': function(configService: IConfigService){
                    return configService.promise;
                },
                'userServiceData': function(userService: IUserService){
                    return userService.promise;
                },
                // 'slotServiceData': function(slotService){
                //     return slotService.promise;
                // },
                'swServiceData': function(swService: ISwService){
                    return swService.promise;
                },
                'instServiceData': function(instService: IInstService){
                    return instService.promise;
                }
            }
        })
        .when('/del/:itemId', {
            templateUrl: 'partials/del.html',
            controller: 'DelController',
            title: 'Delete'
        })
        .otherwise({
            redirectTo: '/list'
        });
}]);
