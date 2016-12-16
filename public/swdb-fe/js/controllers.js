var appController = angular.module('appController', ['datatables','ngAnimate','ngSanitize','ui.bootstrap','ngCookies']);

appController.run(['$rootScope','$route','$http','$routeParams','$location', function($rootScope,$route,$http,$routeParams,$location) {
  $rootScope.$on("$routeChangeSuccess", function(currentRoute, previousRoute){
    //Change page title, based on Route information
    $rootScope.title = $route.current.title;

    if (!$rootScope.props){
      // first start
      $http.get($location.protocol()+"://"+
          $location.host()+":"+$location.port()+"/swdbserv/v1/config").success(function(data) {
        $rootScope.props = data;
        console.log('initial props'+JSON.stringify($rootScope.props));
        $rootScope.clientProps = {"port": $location.port()};
        $http({
          method: 'GET',
          url: $rootScope.props.apiUrl+'user',
          headers: { 'Content-Type': 'application/json' }
        })
        .success(function(data){
          $rootScope.session = data;
          //console.log("got ident "+JSON.stringify(data));
        })
        .error(function(error, status){
          $scope.swdbParams.error = {message: error, status: status};
        });
      });
      //TODO This needs to be removed once there is a solution for making
      // sure the props data is populated before the controllers are up!
      $rootScope.props = {
        "levelOfCareEnums": ["NONE","LOW","MEDIUM","HIGH"],
        "statusEnums": ["DEVEL","RDY_INSTALL","RDY_INT_TEST","RDY_BEAM","RETIRED"],
        "apiUrl":"http://swdb-dev:3005/swdbserv/v1/",
        "restPort":"3005",
        "webUrl":"http://swdb-dev:3005/",
        "webPort":"3005",
        "mongodbUrl":"mongodb://localhost:27017/test",
        "auth":{
          "cas": "https://cas.nscl.msu.edu",
          "service": "swdb-dev:3005",
          "login_service": "http://swdb-dev:3005"
        }
      };

    } else {
      // all route changes after the first
      $http({
        method: 'GET',
        url: $rootScope.props.apiUrl+'user',
        headers: { 'Content-Type': 'application/json' }
      })
      .success(function(data){
        $rootScope.session = data;
        console.log('updated session'+JSON.stringify($rootScope.session));
      })
      .error(function(error, status){
        $scope.swdbParams.error = {message: error, status: status};
      });

    }
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

function WithPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q, $rootScope,$cookies) {
  //console.log("session in list: "+$rootScope.session);
  var vm = this;
	vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
		var defer = $q.defer();
		$http.get($rootScope.props.apiUrl).then(function(result) {
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
		DTColumnBuilder.newColumn('releasedVersion').withTitle('SW version').withOption('defaultContent','')
	];
}


appController.controller('DetailsController', ['$scope', '$http','$routeParams', '$rootScope', function ($scope, $http, $routeParams, $rootScope) {

	//update document fields with existing data
	$http.get($rootScope.props.apiUrl+$routeParams.itemId).success(function(data) {
		$scope.formData = data;
		$scope.whichItem = $routeParams.itemId;
	});
}]);

appController.controller('NewController', ['$scope', '$http','$rootScope', '$window', function ($scope, $http, $rootScope, $window) {
	$scope.datePicker = (function () {
		var method = {};
		method.instances = [];

		method.open = function ($event, instance) {
			$event.preventDefault();
			$event.stopPropagation();

			method.instances[instance] = true;
		};

		method.options = {
			'show-weeks': false,
			startingDay: 0
		};

		var formats = ['MM/dd/yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
		method.format = formats[2];

		return method;
	}());


	$scope.processForm = function(){
		delete $scope.formData.__v;
		if ($scope.inputForm.$valid){
			$http({
				method: 'POST',
				url: $rootScope.props.apiUrl,
				data: $scope.formData,
				headers: { 'Content-Type': 'application/json' }
			})
			.success(function(data){
				$scope.swdbParams.formStatus="Document posted";
				$scope.swdbParams.formShowErr=false;
				$scope.swdbParams.formShowStatus=true;
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
	};

	$scope.removeItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.splice(parts[2],1);
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.splice(parts[2],1);
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.splice(parts[2],1);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.splice(parts[2],1);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.splice(parts[2],1);
		}
	};

	getEnums = function() {
		$scope.levelOfCareEnums = ["NONE","LOW","MEDIUM","HIGH"];
		$scope.formData.levelOfCare = "NONE";
		$scope.statusEnums = ["DEVEL","RDY_INSTALL","RDY_INT_TEST","RDY_BEAM","RETIRED"];
		$scope.formData.status = "DEVEL";
	};

  if (!$rootScope.session || !$rootScope.session.username) {
    console.log("User not found!");
    console.log($rootScope.props.auth.cas+'/login?service='+encodeURIComponent($rootScope.props.auth.login_service));
    $window.location.href = $rootScope.props.auth.cas+'/login?service='+encodeURIComponent($rootScope.props.auth.login_service);
  } else {
    console.log("Found user: "+$rootScope.session.username);
  }

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

appController.controller('UpdateController', ['$scope', '$http', '$routeParams','$rootScope', '$window', function ($scope, $http, $routeParams, $rootScope, $window) {
	$scope.processForm = function(){
		if ($scope.inputForm.$valid){
			delete $scope.formData.__v;
			$http({
				method: 'PUT',
				url: $rootScope.props.apiUrl+$scope.formData._id,
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
	};


	$scope.removeItem = function(event) {
		var parts = event.currentTarget.id.split('.');
		if (parts[1] === 'auxSw'){
			$scope.formData.auxSw.splice(parts[2],1);
		} else if (parts[1] === 'swDescDoc'){
			$scope.formData.swDescDoc.splice(parts[2],1);
		} else if (parts[1] === 'validationDoc'){
			$scope.formData.validationDoc.splice(parts[2],1);
		} else if (parts[1] === 'verificationDoc'){
			$scope.formData.verificationDoc.splice(parts[2],1);
		} else if (parts[1] === 'comment'){
			$scope.formData.comment.splice(parts[2],1);
		}
	};

	getEnums = function() {
		$scope.levelOfCareEnums = ["NONE","LOW","MEDIUM","HIGH"];
		$scope.statusEnums = ["DEVEL","RDY_INSTALL","RDY_INT_TEST","RDY_BEAM","RETIRED"];
	};


  if (!$rootScope.session || !$rootScope.session.username) {
    console.log("User not found!");
    console.log($rootScope.props.auth.cas+'/login?service='+encodeURIComponent($rootScope.props.auth.login_service));
    $window.location.href = $rootScope.props.auth.cas+'/login?service='+encodeURIComponent($rootScope.props.auth.login_service);
  } else {
    console.log("Found user: "+$rootScope.session.username);
  }

	$scope.swdbParams = {
		formShowErr: false,
		formShowStatus: false,
		formStatus: "",
		formErr: ""
	};

	getEnums();

	//update document fields with existing data
	$http.get($rootScope.props.apiUrl+$routeParams.itemId).success(function(data) {
		$scope.formData = data;
		$scope.whichItem = $routeParams.itemId;

		// make a Date object from this string
		$scope.formData.statusDate = new Date($scope.formData.statusDate);
	});

}]);
