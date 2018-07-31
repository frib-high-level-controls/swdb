/*
 * new controller for installations
 */

interface IInstNewControllerScope extends ng.IScope {
  session: {
    user?: {};
  };
  props: IConfigProps;
  swMeta: SWMeta;
  usrBtnTxt?: string;
  formData: webapi.Inst;
  // swSelected: webapi.ISwdb;
  slotsSelected: string[];
  statusDisplay: string | undefined;
  areasSelected: IForgArea[],
  statusDateDisplay: string;
  vvApprovalDateDisplay: string;
  rawHistory: {};
  datePicker: any;
  inputForm: any;
  swList: webapi.ISwdb[];
  forgAreasList: IForgArea[];
  swdbParams: {
    formStatus: string,
    formErr: string,
    formShowErr: boolean,
    formShowStatus: boolean,
  };
  usrBtnClk(): void;
  updateBtnClk(): void;
  bckBtnClk(): void;
  swSelect(item: webapi.Inst): void;
  formErrors(form: any): void;
  newItem(event: {currentTarget: HTMLInputElement}): void;
  removeItem(event: {currentTarget: HTMLInputElement}): void;
  processForm(): void;
  refreshSw(): void;
}
interface IForgAreaService {
  promise: ng.IPromise<void>;
  getAreas(): any;
}
interface IForgArea {
  uid: string;
}

appController.controller('InstNewController', InstNewPromiseCtrl);
function InstNewPromiseCtrl(
  $scope: IInstNewControllerScope,
  $http: ng.IHttpService,
  $window: ng.IWindowService,
  $location: ng.ILocationService,
  configService: IConfigService,
  userService: IUserService,
  swService: ISwService,
  forgAreaService: IForgAreaService) {

  $scope.$watch(function () {
    return $scope.session;
  }, function () {
    // prep for login button
    if ($scope.session && $scope.session.user) {
      $scope.usrBtnTxt = "";
    } else {
      $scope.usrBtnTxt = 'Log in';
    }
  }, true);

  $scope.usrBtnClk = function () {
    if ($scope.session.user) {
      $window.location.href = $scope.props.webUrl + 'logout';
    } else {
      $window.location.href = $scope.props.webUrl + 'login';
    }
  };

  $scope.bckBtnClk = function () {
    // Go back to details
    $location.path("/inst/list");
  };


  // $scope.slotSelect = function ($item, $model, $label) {
  //   var index = $scope.slotsSelected.indexOf($model);
  //   if (index == -1) {
  //     $scope.slotsSelected.unshift($model);
  //     $('#slots').focus();
  //   }
  //   else {
  //   }
  // };

  // $scope.removeSelectedSlot = function ($item) {
  //   var index = $scope.slotsSelected.indexOf($item);
  //   if (index > -1) {
  //     $scope.slotsSelected.splice(index, 1);
  //   }
  // };

  $scope.swSelect = function ($item) {
    $scope.formData.software = $item._id;
  };

  $scope.datePicker = (function () {
    var method: any = {};
    method.instances = [];

    method.open = function ($event: any, instance: any) {
      $event.preventDefault();
      $event.stopPropagation();

      method.instances[instance] = true;
    };

    method.options = {
      'show-weeks': false,
      startingDay: 0
    };

    method.format = 'M!/d!/yyyy';

    return method;
  }());

  $scope.formErrors = function (form){
    var errors = [];
    for(var key in form.$error){
      errors.push(key + "=" + form.$error);
    }
    if(errors.length > 0){
      console.log("Form Has Errors");
      console.log(form.$error);
    }
  };


  $scope.processForm = function () {
    // delete $scope.formData.__v;
    $scope.formData.slots = $scope.slotsSelected;

    // convert enum value to enum key
    $scope.formData.status = Object.keys($scope.props.InstStatusEnum).filter( 
      function (item: string) { 
        return $scope.statusDisplay === $scope.props.InstStatusEnum[item];
      })[0];

    let flattenedAreas = $scope.areasSelected.map(function(item: IForgArea) {
      return item.uid;
    });
    $scope.formData.area = flattenedAreas;

    if ($scope.inputForm.$valid) {
      let url = basePath + "/api/v1/inst";
      $http({
        method: 'POST',
        url: url,
        // url: $scope.props.instApiUrl,
        data: $scope.formData,
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function success(response) {
          $scope.swdbParams.formStatus = "Document posted";
          $scope.swdbParams.formShowErr = false;
          $scope.swdbParams.formShowStatus = true;
          let headers = response.headers();
          if (headers.location) {
            // if location header is present extract the id
            let id = headers.location.split('/').pop();
            $location.path('/inst/details/' + id);
          }
        }, function error(response) {
          if (response.data.message) {
            $scope.swdbParams.formErr = "Error: " + response.data.message + " (" + response.status + ")";
          } else if (response.data.match(/^Validation errors: /g)){
            // unpack the validation errors and print the first
            const parts = response.data.split('Validation errors: ')
            const errors = JSON.parse(parts[1]);
            $scope.swdbParams.formErr = "Error: " + errors[0].msg + " (" + response.status + ")";
          } else {
            $scope.swdbParams.formErr = "Error: " + JSON.stringify(response.data) + " (" + response.status + ")";
          }
          $scope.swdbParams.formShowStatus = false;
          $scope.swdbParams.formShowErr = true;

        });
    } else {
      $scope.swdbParams.formErr = "Error: clear errors before submission"; 
      $scope.swdbParams.formShowStatus = false;
      $scope.swdbParams.formShowErr = true;
    }
  };

  $scope.newItem = function (event: {currentTarget: HTMLInputElement}) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'slots') {
      // $scope.formData.slots.push("");
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc) {
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.push("");
    } else if (parts[1] === 'area') {
      // check to see if area needs initialization
      if (!$scope.areasSelected) {
        $scope.areasSelected = [];
      }
      $scope.areasSelected.push({ uid: ''});
    }
  };

  $scope.removeItem = function (event: {currentTarget: HTMLInputElement}) {
    var parts = event.currentTarget.id.split('.');
    if (parts[1] === 'slots') {
      // $scope.formData.slots.splice(parts[2], 1);
    } else if (parts[1] === 'vvResultsLoc') {
      if (!$scope.formData.vvResultsLoc){
        $scope.formData.vvResultsLoc = [];
      }
      $scope.formData.vvResultsLoc.splice(Number(parts[2]), 1);
    } else if (parts[1] === 'area') {
      // $scope.formData.area.splice(parts[2], 1);
      $scope.areasSelected.splice(Number(parts[2]), 1);
    }
  };

  var getEnums = function () {
    $scope.formData.status = "DEVEL";
    $scope.formData.area = [];
  };

  $scope.refreshSw = () => {
    $scope.swList = swService.getSwList().filter(function(item, index, arr){
      // filter for software that is in the "Ready for Install" state
      return item.status === 'RDY_INST';
    });
  };

  $scope.props = configService.getConfig();
  $scope.session = userService.getUser();
  // $scope.slots = slotService.getSlot();
  $scope.refreshSw();

  forgAreaService.promise.then(function () {
    $scope.forgAreasList = forgAreaService.getAreas().data;
  });

  // check our user session and redirect if needed
  if (!$scope.session.user) {
    //go to cas
    $window.location.href = $scope.props.webUrl + 'login';
  }

  // initialize this record
  $scope.formData = {
    area: [],
    status: 'DEVEL',
    vvResultsLoc: [],
    slots: [],
  }
  getEnums();

  $scope.swdbParams = {
    formShowErr: false,
    formShowStatus: false,
    formStatus: "",
    formErr: ""
  };
  $scope.slotsSelected = [];
  $scope.areasSelected = [];

}
