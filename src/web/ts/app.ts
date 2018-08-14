let app = angular.module('app', [
    'ngRoute',
    'appController',
    'ngMessages',
]);

// record xfer service
// for transferring records between routes
app.service('recService', () => {
    let recData: webapi.ISwdb | null = null;

    return {
        setRec: (data: webapi.ISwdb) => {
            recData = data;
        },
        getRec: () => {
            return recData;
        },
    };
});

// Service to get config data to controllers
app.service('configService', ($http: ng.IHttpService) => {
    let configData: IConfigProps | null = null;

    const promise = $http({url: basePath + '/api/v1/swdb/config', method: 'GET'})
    .then((data: {data: IConfigProps} & angular.IHttpResponse<any>) => {
        configData = data.data;
    });

    return {
        promise: promise,
        setData: (data: IConfigProps) => {
            configData = data;
        },
        getConfig:  () => {
            return configData;
        },
    };
});

// Service to get user data to controllers
app.service('userService', ($http: ng.IHttpService) => {
    let userData: IForgUser | null = null;

    const promise = $http({url: basePath + '/api/v1/swdb/user', method: 'GET'})
      .then( (data: {data: IForgUser} & angular.IHttpResponse<any>) => {
        userData = data.data;
    });

    return {
        promise: promise,
        setData: (data: IForgUser) => {
            userData = data;
        },
        getUser: () => {
            return userData;
        },
    };
});

// Service to get ccdb slots to controllers
app.service('slotService', ($http: ng.IHttpService) => {
    let slotData: IForgSlot | null = null;

    const promise = 	$http({
      url: basePath + '/api/v1/swdb/slot',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((data: IForgSlot & angular.IHttpResponse<any>) => {
        slotData = data;
    });

    return {
        promise: promise,
        setData: (data: IForgSlot) => {
            slotData = data;
        },
        getSlot: () => {
            return slotData;
        },
    };
});

// Service to get sw data to controllers
app.service('swService', ($http: ng.IHttpService) => {
    let swData: webapi.ISwdb[] | null = null;
    let promise = $http({url: basePath + '/api/v1/swdb', method: 'GET'})
    .then((data: {data: webapi.ISwdb[]} & angular.IHttpResponse<any>) => {
        swData = data.data;
    });

    return {
      promise: promise,
      getSwList: () => {
          return swData;
        },
      refreshSwList: () => {
        promise = $http({ url: basePath + '/api/v1/swdb', method: 'GET' })
        .then( (data: {data: webapi.ISwdb[]} & angular.IHttpResponse<any>) => {
          swData = data.data;
        });
        return promise;
      },
      /**
       * getSwById
       * @param swId id user ID string
       * @return matching sw objects
       */
      getSwById: (swId: string) => {
        if (swData) {
          return swData.filter( (item: webapi.ISwdb) => {
            return item._id === swId;
          });
        }
      },
      /**
       * userUidsToObjects
       * @param swIds array id user ID strings
       * @return array of sw objects from forg
       */
      swIdsToObjects: (swIds: string[]) => {
        const swObj = swIds.map((item, idx, array) => {
          if (swData) {
            const node = swData.filter( (elem) => {
              return elem._id === item;
            });
            return node;
          } else {
            return [];
          }
        });
        return swObj[0];
      },
    };
});

// Service to get inst data to controllers
app.service('instService', ($http: ng.IHttpService) => {
    let instData: webapi.Inst[] | null = null;

    let promise = 	$http({url: basePath + '/api/v1/inst', method: 'GET'})
      .then( (data: {data: webapi.Inst[]} & angular.IHttpResponse<any>) => {
        instData = data.data;
      });

    return {
      promise: promise,
      getInstList: () => {
          return instData;
        },
      refreshInstList:  () => {
        promise = $http({ url: basePath + '/api/v1/inst', method: 'GET' })
          .then( (data: {data: webapi.Inst[]} & angular.IHttpResponse<any>) => {
            instData = data.data;
          });
        return promise;
      },
      /**
       * getInstById
       * @param instId installation ID string
       * @return matching inst object
       */
      getInstById: (instId: string) => {
        if (instData) {
          return instData.filter( (item, idx) => {
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
      getInstsBySw: (swId: string) => {
        let arr: Array<webapi.Inst| undefined> = [];
        if (instData) {
          arr = instData.map( (item) => {
            if (item.software === swId) {
              return item;
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
      },
    };
});

// Service to get FORG user data to controllers
app.service('forgUserService', ($http: ng.IHttpService) => {
  let userData: {data: IForgUser[]} | null = null;

  const promise = $http({ url: basePath + '/api/v1/swdb/forgUsers', method: 'GET' })
    .then( (data: IForgUser[] & angular.IHttpResponse<any>) => {
      userData = data;
    });

  return {
    promise: promise,
    getUsers: () => {
      return userData;
    },
    refreshUsersList: () => {
      $http({ url: basePath + '/api/v1/swdb/forgUsers', method: 'GET' })
        .then( (data: IForgUser[] & angular.IHttpResponse<any>) => {
          userData = data;
          return userData;
        });
    },
    /**
     * userUidsToObjects
     * @param userUids array id user UID strings
     * @return array of user objects from forg
     */
    userUidsToObjects: (userUids: string[]) => {
      const forgObj = userUids.map((item, idx, array) => {
        if (userData) {
          return userData.data.filter( (elem: IForgUser) => {
            return elem.uid === item;
          });
        }
      });
      return forgObj[0];
    },
  };
});

// Service to get FORG group data to controllers
app.service('forgGroupService', ($http: ng.IHttpService) => {
  let groupData: {data: IForgGroup[]} | null = null;

  const promise = $http({ url: basePath + '/api/v1/swdb/forgGroups', method: 'GET' })
    .then( (data: IForgGroup[] & angular.IHttpResponse<any>) => {
      groupData = data;
    });

  return {
    promise: promise,
    getGroups: () => {
      return groupData;
    },
    refreshGroupsList: () => {
      $http({ url: basePath + '/api/v1/swdb/forgGroups', method: 'GET' })
        .then( (data: IForgGroup[] & angular.IHttpResponse<any>) => {
        groupData = data;
        return groupData;
      });
    },
    /**
     * groupUidsToObjects
     * @param groupUids array id group UID strings
     * @return array of group objects from forg
     */
    groupUidsToObjects:  (groupUids: string[]) => {
      const forgObj = groupUids.map( (item, idx, array) => {
        if (groupData) {
          return groupData.data.filter( (elem) => {
            return elem.uid === item;
          });
        }
      });
      return forgObj[0];
    },
  };
});

// Service to get FORG area data to controllers
app.service('forgAreaService', ($http: ng.IHttpService) => {
  let areaData: {data: IForgArea[]} | null = null;

  const promise = $http({ url: basePath + '/api/v1/swdb/forgAreas', method: 'GET' })
    .then( (data: IForgArea[] & angular.IHttpResponse<any>) => {
      areaData = data;
    });

  return {
    promise: promise,
    getAreas: () => {
      return areaData;
    },
    refreshAreasList: () => {
      $http({ url: basePath + '/api/v1/swdb/forgAreas', method: 'GET' })
        .then( (data: IForgArea[] & angular.IHttpResponse<any>) => {
          if (areaData) {
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
    areaUidsToObjects: (areaUids: string[]) => {
      let forgObj;
      if (areaUids) {
        forgObj = areaUids.map( (item, idx, array) => {
          if (areaData) {
            return areaData.data.filter( (elem) => {
              return elem.uid === item;
            })[0];
          }
        });
      } else {
        forgObj = null;
      }
      if (forgObj) {
        return forgObj;
      } else {
        return [];
      }
    },
  };
});

app.filter('swFilt', () => {
  // custom filter for sw records
  return (swIn: webapi.ISwdb[], srchTxt: string) => {
    const swOut: webapi.ISwdb[] = [];
    if (typeof srchTxt === 'string') {
      // make sure we have a real search string
      const re = new RegExp(srchTxt, 'gi'); // precompile regex first
      swIn.forEach((element) => {
        if (!element.branch) {
          // set branch to empty string if it does not exist
          element.branch = '';
        }
        if (!element.swName) {
          // set branch to empty string if it does not exist
          element.swName = '';
        }
        if (!element.version) {
          // set branch to empty string if it does not exist
          element.version = '';
        }
        if (element.swName.match(re) || element.branch.match(re) || element.version.match(re)) {
          swOut.push(element);
        } else {
          return false;
        }
      });
      return swOut;
    } else {
      return srchTxt;
    }
  };
});

app.filter('engNopromiseFilter', () => {
  return (forgUserIn: IForgUser[], srchTxt: string) => {
    const re = new RegExp(srchTxt, 'i');
    const filtered = forgUserIn.filter( (element, idx, arr) => {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('ownNopromiseFilter', () => {
  return (forgGroupIn: IForgGroup[], srchTxt: string) => {
    const re = new RegExp(srchTxt, 'i');
    const filtered = forgGroupIn.filter( (element, idx, arr) => {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('engFilter', () => {
  return (forgUserIn: IForgUser[], srchTxt: string) => {
    const re = new RegExp(srchTxt, 'i');
    const filtered = forgUserIn.filter( (element, idx, arr) => {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.filter('areasNopromiseFilter', () => {
  return (forgAreaIn: IForgArea[], srchTxt: string) => {
    const re = new RegExp(srchTxt, 'i');
    const filtered = forgAreaIn.filter( (element, idx, arr) => {
      if (element.uid.match(re)) {
        return element;
      }
    });
    return filtered;
  };
});

app.config(['$routeProvider', ($routeProvider: ng.route.IRouteParamsService) => {
    $routeProvider.
        when('/list', {
            templateUrl: 'partials/list.html',
            controller: 'ListController',
            title: 'List',
            resolve: {
                configServiceData: (configService: IConfigService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
            },
        })
        .when('/inst/list', {
            templateUrl: 'partials/instList.html',
            controller: 'InstListController',
            title: 'Installations List',
            resolve: {
                configServiceData: (configService: IConfigService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
            },
        })
        .when('/details/:itemId', {
            templateUrl: 'partials/details.html',
            controller: 'DetailsController',
            title: 'Details',
            resolve: {
                configServiceData: (configService: IConfigService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
                swServiceData: (swService: ISwService) => {
                    return swService.promise;
                },
            },
        })
        .when('/inst/details/:itemId', {
            templateUrl: 'partials/instDetails.html',
            controller: 'InstDetailsController',
            title: 'Installation Details',
            resolve: {
                configServiceData: (configService: IConfigService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
                instServiceData: (instService: IInstService) => {
                    return instService.promise;
                },
            },
        })
        .when('/new', {
            templateUrl: 'partials/new.html',
            controller: 'NewController',
            title: 'New',
            resolve: {
                configServiceData: (configService: IConfigService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
            },
        })
        .when('/inst/new', {
            templateUrl: 'partials/instNew.html',
            controller: 'InstNewController',
            title: 'New Installation',
            resolve: {
                configServiceData: (configService: IUserService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
                swServiceData: (swService: ISwService) => {
                    return swService.promise;
                },
            },
        })
        .when('/update/:itemId', {
            templateUrl: 'partials/new.html',
            controller: 'UpdateController',
            title: 'Update',
            resolve: {
                configServiceData: (configService: IUserService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
                swServiceData: (swService: ISwService) => {
                    return swService.promise;
                },
                instServiceData: (instService: IInstService) => {
                    return instService.promise;
                },
            },
        })
        .when('/inst/update/:itemId', {
            templateUrl: 'partials/instNew.html',
            controller: 'InstUpdateController',
            title: 'Update Installation',
            resolve: {
                configServiceData: (configService: IConfigService) => {
                    return configService.promise;
                },
                userServiceData: (userService: IUserService) => {
                    return userService.promise;
                },
                swServiceData: (swService: ISwService) => {
                    return swService.promise;
                },
                instServiceData: (instService: IInstService) => {
                    return instService.promise;
                },
            },
        })
        .when('/del/:itemId', {
            templateUrl: 'partials/del.html',
            controller: 'DelController',
            title: 'Delete',
        })
        .otherwise({
            redirectTo: '/list',
        });
}]);
