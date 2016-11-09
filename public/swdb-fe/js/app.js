var app = angular.module('app', [
	'ngRoute',
	'appController',
	'ngMessages'
	]);

app.config(['$routeProvider', function($routeProvider){
	$routeProvider.
	when('/list', {
		templateUrl: 'swdb-fe/partials/list.html',
		controller: 'ListController',
		title: 'List'
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
