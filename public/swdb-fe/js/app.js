var app = angular.module('app', [
	'ngRoute',
	'appController',
	'ngMessages'
	]);

	// app.factory('Resolver', ['$http', '$rootScope', function($http, $rootScope){
	// 	return function(){
	// 		return $http({url: '/swdbserv/v1/config',method: "GET"}).then(function(data) {
	// 			console.log("completed config call"+JSON.stringify(data));
	// 			$rootScope.props=data;
	// 		});
	// 	}
	// }]);

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
			doStuff: function () {
				return configData;
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
			}
		}
	})
	.when('/details/:itemId', {
		templateUrl: 'swdb-fe/partials/details.html',
		controller: 'DetailsController',
		title: 'Details'
	})
	.when('/new', {
		templateUrl: 'swdb-fe/partials/new.html',
		controller: 'NewController',
		title: 'New'
	})
	.when('/update/:itemId', {
		templateUrl: 'swdb-fe/partials/new.html',
		controller: 'UpdateController',
		title: 'Update'
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
