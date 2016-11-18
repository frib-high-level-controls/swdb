var appController = angular.module('appController', ['datatables','ngAnimate','ngSanitize','ui.bootstrap']);

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

	$scope.today = function() {
     $scope.formData.statusDate = new Date();
   };
   $scope.clear = function() {
     $scope.dt = null;
   };
   $scope.inlineOptions = {
  	 //customClass: getDayClass,
     //minDate: new Date(),
     showWeeks: true
   };
   $scope.dateOptions = {
     //dateDisabled: disabled,
     formatYear: 'yy',
     //maxDate: new Date(2020, 5, 22),
     //minDate: new Date(),
     startingDay: 1
   };
   // Disable weekend selection
   function disabled(data) {
     var date = data.date,
       mode = data.mode;
     //return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
		 // all days valid
     return 0;
   }
  //  $scope.toggleMin = function() {
  //    $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
  //    $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
  //  };
   //$scope.toggleMin();
   $scope.open1 = function() {
     $scope.popup1.opened = true;
   };
   $scope.open2 = function() {
     $scope.popup2.opened = true;
   };
   $scope.setDate = function(year, month, day) {
     $scope.dt = new Date(year, month, day);
   };
   $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
   $scope.format = $scope.formats[1];
   $scope.altInputFormats = ['M!/d!/yyyy'];
   $scope.popup1 = {
     opened: false
   };
   $scope.popup2 = {
     opened: false
   };
  //  var tomorrow = new Date();
  //  tomorrow.setDate(tomorrow.getDate() + 1);
  //  var afterTomorrow = new Date();
  //  afterTomorrow.setDate(tomorrow.getDate() + 1);
  //  $scope.events = [
  //    {
  //      date: tomorrow,
  //      status: 'full'
  //    },
  //    {
  //      date: afterTomorrow,
  //      status: 'partially'
  //    }
  //  ];
  //  function getDayClass(data) {
  //    var date = data.date,
  //      mode = data.mode;
  //    if (mode === 'day') {
  //      var dayToCheck = new Date(date).setHours(0,0,0,0);
	 //
  //      for (var i = 0; i < $scope.events.length; i++) {
  //        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);
	 //
  //        if (dayToCheck === currentDay) {
  //          return $scope.events[i].status;
  //        }
  //      }
  //    }
	 //
	//  }

	$scope.processForm = function(){
		delete $scope.formData.__v;
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
				$scope.swdbParams.formErr="Error: "+$scope.swdbParams.error.message+"("+status+")";
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
		//console.log("adding blank entry to "+parts[1]);
	};
	$scope.removeItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.splice(parts[2],1);
			//console.log("removing auxsw idx "+parts[2]);
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.splice(parts[2],1);
			//console.log("removing swDescDoc idx "+parts[2]);
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.splice(parts[2],1);
			//console.log("removing validationDoc idx "+parts[2]);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.splice(parts[2],1);
			//console.log("removing verificationDoc idx "+parts[2]);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.splice(parts[2],1);
			//console.log("removing comment idx "+parts[2]);
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
		//revisionControl: "",
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
		//console.log("validation: "+$scope.inputForm.$valid);
		if ($scope.inputForm.$valid){
			delete $scope.formData.__v;
			$http({
				method: 'PUT',
				url: 'http://localhost:3000/swdbserv/v1/'+$scope.formData._id,
				data: $scope.formData,
				headers: { 'Content-Type': 'application/json' }
			})
			.success(function(data){
				$scope.swdbParams.formStatus="Document updates successfully posted";
				$scope.swdbParams.formShowErr=false;
				$scope.swdbParams.formShowStatus=true;
				console.log("sent "+data);
			})
			.error(function(error, status){
				$scope.swdbParams.error = {message: error, status: status};
				$scope.swdbParams.formErr="Error: "+$scope.swdbParams.error.message+"("+status+")";
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
		//console.log("adding blank entry to "+parts[1]);
	};


	$scope.removeItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.splice(parts[2],1);
			//console.log("removing auxsw idx "+parts[2]);
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.splice(parts[2],1);
			//console.log("removing swDescDoc idx "+parts[2]);
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.splice(parts[2],1);
			//console.log("removing validationDoc idx "+parts[2]);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.splice(parts[2],1);
			//console.log("removing verificationDoc idx "+parts[2]);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.splice(parts[2],1);
			//console.log("removing comment idx "+parts[2]);
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
		
		// make a Date object from this string
		console.log($scope.formData);
		$scope.formData.statusDate = new Date($scope.formData.statusDate);
	});

}]);
