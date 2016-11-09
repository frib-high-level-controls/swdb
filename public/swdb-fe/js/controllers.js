var appController = angular.module('appController', ['ui.tree','datatables']);

appController.run(['$rootScope','$route', function($rootScope,$route) {
	$rootScope.$on("$routeChangeSuccess", function(currentRoute, previousRoute){
    //Change page title, based on Route information
    $rootScope.title = $route.current.title;
  });
}]);

// expose system status to all controllers via service.
appController.factory('StatusService', function() {
	return {
		dbConnected : 'false'
		// apiConnected : 'false'
	};
});

appController.controller('ListController', WithPromiseCtrl);

function WithPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q) {
	var vm = this;
	vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
		var defer = $q.defer();
		$http.get('http://localhost:3000/swdbserv/v1').then(function(result) {
			defer.resolve(result.data);
		});
		return defer.promise;
	}).withPaginationType('full_numbers');

	vm.dtColumns = [
		DTColumnBuilder.newColumn('swName').withTitle('Software name')
		.renderWith(function(data, type, full, meta) {
			return '<a href="#/details/'+full._id+'" class="btn btn-default">' +
			full.swName + '</a>';
		}),
		DTColumnBuilder.newColumn('owner').withTitle('Owner'),
		DTColumnBuilder.newColumn('levelOfCare').withTitle('Level of care'),
		DTColumnBuilder.newColumn('status').withTitle('Status'),
		DTColumnBuilder.newColumn('statusDate').withTitle('Status date'),
		DTColumnBuilder.newColumn('releasedVersion').withTitle('SW version').notVisible()
	];
}


appController.controller('DetailsController', ['$scope', '$http','$routeParams', function ($scope, $http, $routeParams) {

	//update document fields with existing data
	$http.get('http://localhost:3000/swdbserv/v1/'+$routeParams.itemId).success(function(data) {
		$scope.formData = data;
		$scope.whichItem = $routeParams.itemId;
	});

	// use with details.html
	// $http.get('http://localhost:3000/swdbserv/v1/'+$routeParams.itemId).success(function(data) {
	// 	$scope.sws = data;
	// 	$scope.isArray = angular.isArray;
	// 	$scope.isObject = angular.isObject;
	// 	console.log("Got: "+JSON.stringify(data));
	// });
}]);

appController.controller('NewController', ['$scope', '$http', function ($scope, $http) {
	$scope.processForm = function(){
		if ($scope.inputForm.$valid){
			$http({
				method: 'POST',
				url: 'http://localhost:3000/swdbserv/v1',
				data: $scope.formData,
				headers: { 'Content-Type': 'application/json' }
			})
			.success(function(data){
				$scope.swdbParams.formStatus="Document posted";
				$scope.swdbParams.formShowErr=false;
				$scope.swdbParams.formShowStatus=true;
				console.log("sent "+data);
			})
			.error(function(error, status){
				$scope.swdbParams.error = {message: error, status: status};
				$scope.swdbParams.formErr="Error: "+error.message+"("+status+")";
				$scope.swdbParams.formShowStatus=false;
				$scope.swdbParams.formShowErr=true;
			});
		} else {
			$scope.swdbParams.formErr="Error: clear errors before submission";
			$scope.swdbParams.formShowStatus=false;
			$scope.swdbParams.formShowErr=true;
		}
	};
	$scope.newItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.push("");
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.push("");
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.push( {
				doc: "",
				date: ""
				}
			);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.push( {
				doc: "",
				date: ""
				}
			);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.push("");
		}
		console.log("adding blank entry to "+parts[1]);
	};
	$scope.removeItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.splice(parts[2],1);
			console.log("removing auxsw idx "+parts[2]);
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.splice(parts[2],1);
			console.log("removing swDescDoc idx "+parts[2]);
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.splice(parts[2],1);
			console.log("removing validationDoc idx "+parts[2]);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.splice(parts[2],1);
			console.log("removing verificationDoc idx "+parts[2]);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.splice(parts[2],1);
			console.log("removing comment idx "+parts[2]);
		}
	};

	getEnums = function() {
		$scope.levelOfCareEnums = ["NONE","LOW","MEDIUM","HIGH"];
		$scope.formData.levelOfCare = "NONE";
		$scope.statusEnums = ["DEVEL","RDY_INSTALL","RDY_INT_TEST","RDY_BEAM","RETIRED"];
		$scope.formData.status = "DEVEL";
	};

	// initialize this record
	$scope.formData = {
		auxSw: [],
		swDescDoc: [],
		validationDoc: [],
		verificationDoc: [],
		comment: []
	};
	$scope.swdbParams = {
		formShowErr: false,
		formShowStatus: false,
		formStatus: "",
		formErr: ""
	};
	getEnums();

}]);

appController.controller('UpdateController', ['$scope', '$http', '$routeParams', function ($scope, $http, $routeParams) {
	$scope.processForm = function(){
		console.log("validation: "+$scope.inputForm.$valid);
		if ($scope.inputForm.$valid){
			$http({
				method: 'PUT',
				url: 'http://localhost:3000/swdbserv/v1/'+$scope.formData._id,
				data: $scope.formData,
				headers: { 'Content-Type': 'application/json' }
			})
			.success(function(data){
				$scope.swdbParams.formStatus="Document updates sucessfully posted";
				$scope.swdbParams.formShowErr=false;
				$scope.swdbParams.formShowStatus=true;
				console.log("sent "+data);
			})
			.error(function(error, status){
				$scope.swdbParams.error = {message: error, status: status};
				$scope.swdbParams.formErr="Error: "+error.message+"("+status+")";
				$scope.swdbParams.formShowStatus=false;
				$scope.swdbParams.formShowErr=true;
			});
		} else {
				$scope.swdbParams.formErr="Error: clear errors before submission";
				$scope.swdbParams.formShowStatus=false;
				$scope.swdbParams.formShowErr=true;
		}
	};
	$scope.newItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.push("");
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.push("");
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.push( {
				doc: "",
				date: ""
				}
			);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.push( {
				doc: "",
				date: ""
				}
			);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.push("");
		}
		console.log("adding blank entry to "+parts[1]);
	};
	$scope.removeItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.splice(parts[2],1);
			console.log("removing auxsw idx "+parts[2]);
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.splice(parts[2],1);
			console.log("removing swDescDoc idx "+parts[2]);
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.splice(parts[2],1);
			console.log("removing validationDoc idx "+parts[2]);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.splice(parts[2],1);
			console.log("removing verificationDoc idx "+parts[2]);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.splice(parts[2],1);
			console.log("removing comment idx "+parts[2]);
		}
	};
	getEnums = function() {
		$scope.levelOfCareEnums = ["NONE","LOW","MEDIUM","HIGH"];
		$scope.statusEnums = ["DEVEL","RDY_INSTALL","RDY_INT_TEST","RDY_BEAM","RETIRED"];
	};

	$scope.swdbParams = {
		formShowErr: false,
		formShowStatus: false,
		formStatus: "",
		formErr: ""
	};

	getEnums();

	//update document fields with existing data
	$http.get('http://localhost:3000/swdbserv/v1/'+$routeParams.itemId).success(function(data) {
		$scope.formData = data;
		$scope.whichItem = $routeParams.itemId;
	});

}]);
