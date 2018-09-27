/**
 * SWDB app loader
 */

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
      .then((res: angular.IHttpResponse<IConfigProps>) => {
        configData = res.data;
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


abstract class AbstractRESTService {
  protected $http: ng.IHttpService;

  constructor($http: ng.IHttpService) {
    this.$http = $http;
  }

  protected $get<T>(url: string, options?: ng.IRequestShortcutConfig) {
    return this.$http.get<T>(url, options);
  }
}

class SessionService extends AbstractRESTService {

  public promise: ng.IPromise<void>;

  private userData: ISession | null = null;

  constructor($http: ng.IHttpService) {
    super($http);
    this.initLegacy();
  }

  public async getSession(): Promise<ISession> {
    const res = await this.$get<ISession>(basePath + '/api/v1/swdb/user');
    // TODO: check response status
    return res.data;
  }

  // Legacy methods below!

  public setData(data: ISession) {
    this.userData = data;
  }

  public getUser() {
    return this.userData || {};
  }

  private initLegacy() {
    this.promise = this.$http({url: basePath + '/api/v1/swdb/user', method: 'GET'})
      .then((res: angular.IHttpResponse<ISession>) => {
        this.userData = res.data;
    });
  }
}
app.service('session', ['$http', SessionService]);

type IUserService = SessionService;
app.factory('userService', [ 'session', (session: SessionService) => (session)]);

// Service to get ccdb slots to controllers
// app.service('slotService', ($http: ng.IHttpService) => {
//     let slotData: IForgSlot | null = null;

//     const promise = 	$http({
//       url: basePath + '/api/v1/swdb/slot',
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     }).then((data: IForgSlot & angular.IHttpResponse<IForgSlot>) => {
//         slotData = data;
//     });

//     return {
//         promise: promise,
//         setData: (data: IForgSlot) => {
//             slotData = data;
//         },
//         getSlot: () => {
//             return slotData;
//         },
//     };
// });

/**
 * SoftwareService provides access to software data using the REST API.
 */
class SoftwareService {

  // Legacy
  public promise: ng.IPromise<void>;

  // Legacy
  private swData: webapi.ISwdb[] | null = null;

  private $http: ng.IHttpService;

  constructor($http: ng.IHttpService) {
    this.$http = $http;
    this.initLegacy();
  }

  public async getList(): Promise<webapi.Software[]> {
    const res = await this.$http.get<webapi.Software[]>(`${basePath}/api/v1/swdb`);
    // TODO: check status code for error
    return res.data;
  }

  public async getById(id: string): Promise<webapi.Software[]> {
    const res = await this.$http.get<webapi.Software[]>(`${basePath}/api/v1/swdb/${id}`);
    // TODO: check status code for error
    return res.data;
  }

  public getSwList() {
    return this.swData || [];
  }

  // Legacy methods below!

  public refreshSwList() {
    this.promise = this.$http({ url: basePath + '/api/v1/swdb', method: 'GET' })
      .then((res: ng.IHttpResponse<webapi.Software[]>) => {
        this.swData = res.data;
      });
    return this.promise;
  }

  /**
   * getSwById
   * @param swId id user ID string
   * @return matching sw objects
   */
  public getSwById(swId: string) {
    if (this.swData) {
      return this.swData.filter((item: webapi.ISwdb) => {
        return item._id === swId;
      });
    }
    return [];
  }

  /**
   * userUidsToObjects
   * @param swIds array id user ID strings
   * @return array of sw objects from forg
   */
  public swIdsToObjects(swIds: string[]) {
    const swObj = swIds.map((item, idx, array) => {
      if (this.swData) {
        const node = this.swData.filter((elem) => {
          return elem._id === item;
        });
        return node;
      } else {
        return [];
      }
    });
    return swObj[0];
  }

  private initLegacy() {
    this.promise = this.$http({url: basePath + '/api/v1/swdb', method: 'GET'})
      .then((res: angular.IHttpResponse<webapi.ISwdb[]>) => {
        this.swData = res.data;
      });
  }
}
app.service('software', ['$http', SoftwareService]);

type ISwService = SoftwareService;
app.factory('swService', ['software', (software: SoftwareService) => (software)]);

// Service to get inst data to controllers
app.service('instService', ($http: ng.IHttpService) => {
    let instData: webapi.Inst[] | null = null;

    let promise = 	$http({url: basePath + '/api/v1/inst', method: 'GET'})
      .then((res: ng.IHttpResponse<webapi.Inst[]>) => {
        instData = res.data;
      });

    return {
      promise: promise,
      getInstList: () => {
          return instData;
        },
      refreshInstList:  () => {
        promise = $http({ url: basePath + '/api/v1/inst', method: 'GET' })
          .then((res: ng.IHttpResponse<webapi.Inst[]>) => {
            instData = res.data;
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


class UsersService extends AbstractRESTService {

  // Legacy
  public promise: ng.IPromise<void>;

  // Legacy
  private userData: IForgUser[] = [];

  constructor($http: ng.IHttpService) {
    super($http);
    this.initLegacy();
  }

  public async getList() {
    const res = await this.$get<IForgUser[]>(`${basePath}/api/v1/swdb/forgUsers`);
    //  TODO: check response status
    return res.data;
  }

  // Legacy methods below!

  public getUsers() {
    return this.userData;
  }

  public refreshUsersList() {
    this.$http({ url: basePath + '/api/v1/swdb/forgUsers', method: 'GET' })
      .then((res: ng.IHttpResponse<IForgUser[]>) => {
        this.userData = res.data;
        return this.userData;
      });
  }

  /**
   * userUidsToObjects
   * @param userUids array id user UID strings
   * @return array of user objects from forg
   */
  public userUidsToObjects(userUids: string[]) {
    const forgObj = userUids.map((item, idx, array) => {
      if (this.userData) {
        return this.userData.filter((elem: IForgUser) => {
          return elem.uid === item;
        });
      }
    });
    return forgObj[0] || [];
  }

  private initLegacy() {
    this.promise = this.$http({ url: basePath + '/api/v1/swdb/forgUsers', method: 'GET' })
      .then((res: ng.IHttpResponse<IForgUser[]>) => {
        this.userData = res.data;
      });
  }
}
// Service to get FORG user data to controllers
app.service('users', ['$http', UsersService]);

// Legacy Support!
type IForgUserService = UsersService;
app.factory('forgUserService', ['users', (users: UsersService) => (users)]);

// Service to get FORG group data to controllers
class GroupsService extends AbstractRESTService {

  // Legacy
  public promise: ng.IPromise<void>;

  // Legacy
  private groupData: IForgGroup[] = [];

  constructor($http: ng.IHttpService) {
    super($http);
    this.initLegacy();
  }

  public async getList(): Promise<IForgGroup[]> {
    const res = await this.$get<IForgGroup[]>(`${basePath}/api/v1/swdb/forgGroups`);
    // TODO: check response status
    return res.data;
  }

  // Legacy methods below!
  public getGroups() {
    return this.groupData;
  }

  public refreshGroupsList() {
    this.$http({ url: basePath + '/api/v1/swdb/forgGroups', method: 'GET' })
      .then((res: angular.IHttpResponse<IForgGroup[]>) => {
        this.groupData = res.data;
        return this.groupData;
      });
  }

  /**
   * groupUidsToObjects
   * @param groupUids array id group UID strings
   * @return array of group objects from forg
   */
  public groupUidsToObjects(groupUids: string[]) {
    const forgObj = groupUids.map( (item, idx, array) => {
      if (this.groupData) {
        return this.groupData.filter((elem) => {
          return elem.uid === item;
        });
      }
    });
    return forgObj[0] || [];
  }

  private initLegacy() {
    this.promise = this.$http({ url: basePath + '/api/v1/swdb/forgGroups', method: 'GET' })
      .then((res: angular.IHttpResponse<IForgGroup[]>) => {
        this.groupData = res.data;
      });
  }
}
app.service('groups', ['$http', GroupsService]);

// Legacy Support!
type IForgGroupService = GroupsService;
app.factory('forgGroupService', ['groups', (groups: GroupsService) => (groups)]);

// Service to get FORG area data to controllers
class AreasService extends AbstractRESTService {

  // Legacy
  public promise: ng.IPromise<void>;

  // Legacy
  private areaData: IForgArea[] = [];

  constructor($http: ng.IHttpService) {
    super($http);
    this.initLegacy();
  }

  public async getList(): Promise<IForgArea[]> {
    const res = await this.$get<IForgArea[]>(`${basePath}/api/v1/swdb/forgAreas`);
    // TODO: check response status
    return res.data;
  }

  // Legacy methods below!
  public getAreas() {
    return this.areaData;
  }

  public refreshAreasList() {
    this.$http({ url: basePath + '/api/v1/swdb/forgAreas', method: 'GET' })
      .then((res: ng.IHttpResponse<IForgArea[]>) => {
        if (this.areaData) {
          this.areaData = res.data;
          return this.areaData;
        }
      });
  }

  /**
   * areaUIidsToObjects
   * @param areaUids array id area UID strings
   * @return array of area objects from forg
   */
  public areaUidsToObjects(areaUids: string[]) {
    let forgObj;
    if (areaUids) {
      if (this.areaData) {
        forgObj = areaUids.map((item, idx, array) => {
          return this.areaData.filter((elem) => {
            return elem.uid === item;
          })[0];
        });
      }
    } else {
      forgObj = null;
    }
    if (forgObj) {
      return forgObj;
    } else {
      return [];
    }
  }

  private initLegacy() {
    this.promise = this.$http({ url: basePath + '/api/v1/swdb/forgAreas', method: 'GET' })
      .then((res: ng.IHttpResponse<IForgArea[]>) => {
        this.areaData = res.data;
      });
  }
}
app.service('areas', ['$http', AreasService]);

type IForgAreaService = AreasService;
app.factory('forgAreaService', ['areas', (areas: AreasService) => (areas)]);

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
                softwareList: ['software', (software: SoftwareService) => {
                  return software.getList();
                }],
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


class DateUtil {

  /**
   * Convert Date object to ISO date string in UTC time.
   */
  public static toUTCDateISOString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  /**
   * Convert ISO date string to Date object in UTC time.
   */
  public static fromUTCDateISOString(s: string): Date {
    if (!s.match(/\d{4}-\d{2}-\d{2}/)) {
      return new Date(Number.NaN);
    }
    return new Date(s);
  }

  /**
   * Convert Date object to ISO date string in local time.
   */
  public static toLocalDateISOString(d: Date) {
    const year = String(d.getFullYear());
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert ISO date string to Date object in local time.
   */
  public static fromLocalDateISOString(s: string): Date {
    if (!s.match(/\d{4}-\d{2}-\d{2}/)) {
      return new Date(Number.NaN);
    }
    const ss = s.split('-');
    const year = Number(ss[0]);
    const month = Number(ss[1]) - 1;
    const day = Number(ss[2]);
    return new Date(year, month, day);
  }
}
