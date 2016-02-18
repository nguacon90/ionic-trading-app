angular.module('tradingApp.controllers', [])
.controller('TradingAppCtrl', function($scope, $cookies, $ionicPopup, $ionicLoading, $state, tradingService, tradeApiErrorParser) {
  $scope.account = {};
  $scope.customerInfo = null;

  $scope.targetHref = '#/tab/account';
  
  $scope.loadAll = function() {
  
   if($scope.customerInfo) {
    return;
   }
   var token = $cookies.get('accessToken');
   tradingService.loadCustomer(token).then(function(response){
      
      $scope.customerInfo = response.data;
      $scope.customerInfo.activeAccount = $scope.customerInfo.accounts[0].accountNumber;
      $scope.loadPortfolio();
   }, function(jqXHR){
      if (jqXHR.data.error == 'AUTH-04' || jqXHR.data.error == 'AUTH-01') {
        $cookies.remove('accessToken');
        $scope.showLogin();
      }
   });
  };

  $scope.loadPortfolio = function() {
    $scope.showLoading();  
    var token = $cookies.get('accessToken');
    var accountNumber = $scope.customerInfo.activeAccount;
     tradingService.loadLoadPortfolio(token, accountNumber).then(function(response){
        $scope.customerInfo.portfolio = response.data;
        $scope.hideLoading();  
     }, function(jqXHR){
        $scope.hideLoading();  
     });
  };
  var loginPopup;
  $scope.showLogin = function() {
    loginPopup = $ionicPopup.show({
      templateUrl: 'templates/login-form.html',
      title: 'Login',
      scope: $scope,
      buttons: [
        { text: 'Đăng nhập',
          onTap: function(e) {
             login();
             e.preventDefault();
          }
        },

        {
          text: '<b>Đăng ký</b>',
          type: 'button-positive',
        }
      ]
    });
  };

  $scope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios" class="spinner-dark"></ion-spinner>'
    });
  };

  $scope.hideLoading = function() {
    $ionicLoading.hide();
  };

  function login() {
    $scope.showLoading();  
    tradingService.login($scope.account).then(function(response){
      loginPopup.close();
      $scope.hideLoading();  
      $cookies.put('accessToken', response.data.token);
      $scope.loadAll();
      window.location = $scope.targetHref;
    }, function(jqXHR){
      $scope.showLoading();  
      var errorMessage = tradeApiErrorParser.getMessage(jqXHR.data);
      showError(errorMessage);
    });
  };

  function showError(errorMessage) {
    var alertPopup = $ionicPopup.alert({
     title: 'Thông báo',
     template: errorMessage
    });

    setTimeout(function(){
      alertPopup.close();
    }, 3000);
  };

})
.controller('AccountCtrl', function($scope, $state) {
  
    $scope.loadAll();
    $scope.tabInfo = {
      selectedTab : 'portfolio'
    };

    $scope.selectTab = function(event) {
      
      $scope.tabInfo.selectedTab = event.target.id;
      
    };

    $scope.showAccountList = function() {
      $state.go('tab.account-list');
    };

    $scope.loadAccountInfo = function() {
      $scope.loadPortfolio();
      $state.go('tab.account');
    };
})

.controller('TabCtrl', function($scope, $ionicPopup, $log, tradingService, $cookies) {
  $scope.account = $scope.$parent.account;

  $scope.checkLogin = function(obj) {
    $scope.$parent.targetHref = obj.href;
    var token = $cookies.get('accessToken');
    if(token && token != '') {
      $scope.loadAll();
      window.location = $scope.$parent.targetHref;
      return true;
    }

    $scope.showLogin();
  };
  
})

.controller('TradingCtrl', function($scope) {
  
})

.controller('MenuCtrl', function($scope) {
  
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
});
