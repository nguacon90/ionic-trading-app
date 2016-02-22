angular.module('tradingApp.controllers', [])
.controller('TradingAppCtrl', function($rootScope, $scope, $cookies, $ionicPopup, $ionicLoading, 
      $state, $ionicTabsDelegate, tradingService, tradeApiErrorParser) {
  $scope.tabs = {
    accountIndex: 0,
    assetIndex: 1
  };

  function getState(tabIndex) {
    switch(tabIndex) {
      case 0:
        return 'tab.account'
      case 1:
        return 'tab.asset' 
    }
  };

  function init() {
    $scope.account = {};
    $scope.customerInfo = null;
    $scope.targetHref = '#/tab/account';  
  };

  init();
  
  $rootScope.$on('ClearData', function(){
    init();
    $scope.loadAll();
  });

  $scope.loadAll = function() {
    if($scope.customerInfo) {
      return;
    }
    var token = $cookies.get('accessToken');
    tradingService.loadCustomer(token).then(function(response){
        
        $scope.customerInfo = response.data;
        $scope.customerInfo.activeAccount = $scope.customerInfo.accounts[0].accountNumber;
        $scope.loadPortfolio();
        $scope.loadPP0();
        $scope.loadAssets();
        $scope.loadStocks();
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
     tradingService.loadPortfolio(token, accountNumber).then(function(response){
        $scope.customerInfo.portfolio = response.data;
        $scope.hideLoading();  
     }, function(jqXHR){
        $scope.hideLoading();  
     });
  };

  $scope.loadPP0 = function() {
    var token = $cookies.get('accessToken');
    var accountNumber = $scope.customerInfo.activeAccount;
    tradingService.loadAccounts(token).then(function(response){
       var accounts = response.data.accounts;
       angular.forEach(accounts, function(account, index) {
          if(accountNumber === account.accountNumber) {
            $scope.customerInfo.pp0 = account.purchasePower;
            return;
          }
       });
       
     });
    
  };

  $scope.loadAssets = function() {
    var token = $cookies.get('accessToken');
    var accountNumber = $scope.customerInfo.activeAccount;
     tradingService.loadAssets(token, accountNumber).then(function(response){
        var data = response.data;
        data.advancePurchase = data.advancePurchaseIntraday + data.marginDebt + data.advancePurchaseMortgage;
        data.nav = data.nav - data.advancePurchase; // same as online trading, seems like the "nav" term is used differently in different contexts of BPS
        data.availableAdvancePayments = data.dfAvailableAdvancePayments + data.nsAvailableAdvancePayments;

       $scope.customerInfo.assets = data;

         
     }, function(jqXHR){
       
     });
  };

  $scope.loadStocks = function() {
    var token = $cookies.get('accessToken');
    var accountNumber = $scope.customerInfo.activeAccount;
     tradingService.loadStocks(token, accountNumber).then(function(response){
      
      var data = response.data;
      data.stocks.forEach(function(stock) {
        stock.receiving = stock.t1 + stock.t2 + stock.matchInday;
        stock.total = stock.available + stock.receiving + stock.secure;
      });
       $scope.customerInfo.stocksInfo = data;
         
     }, function(jqXHR){
       
     });
  };
 
  $scope.showLogin = function() {
    var loginPopup = $ionicPopup.show({
      templateUrl: 'templates/login-form.html',
      title: '',
      subTitle: '<i class="ion-close"></i>',
      cssClass: 'loginPage',
      scope: $scope,
      buttons: [
        { text: 'Đăng nhập',
          onTap: function(e) {
             login();
             e.preventDefault();
          }
        },

        {
          text: 'Đăng ký',
          type: 'button-positive',
          onTap: function(e) {
            window.open('https://www.vndirect.com.vn/portal/mo-tai-khoan-nha-dau-tu.shtml', '_system');
            e.preventDefault();
          }
        }
      ]
    });

    function login() {
      $scope.showLoading();  
      tradingService.login($scope.account).then(function(response){
        loginPopup.close();
        $scope.hideLoading();  
        $cookies.put('accessToken', response.data.token);
        $scope.loadAll();
        $state.go(getState($ionicTabsDelegate.selectedIndex()));
      }, function(jqXHR){
        $scope.hideLoading();  
        var errorMessage = tradeApiErrorParser.getMessage(jqXHR.data);
        showError(errorMessage);
      });
    };
  };

  $scope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios" class="spinner-dark"></ion-spinner>'
    });
  };

  $scope.hideLoading = function() {
    $ionicLoading.hide();
  };

  function showError(errorMessage) {
    var alertPopup = $ionicPopup.alert({
     title: 'VNDirect',
     cssClass: 'errorPopup',
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
      $scope.loadPP0();
      $scope.loadAssets();
      $scope.loadStocks();
      $state.go('tab.account');
    };
})

.controller('TabCtrl', function($scope, $ionicPopup, $log, tradingService, $cookies, $ionicTabsDelegate) {
  $scope.loadData = function(obj) {
    var token = $cookies.get('accessToken');
    if(token && token != '') {
      var selectedTabIndex = $ionicTabsDelegate.selectedIndex();
      if(selectedTabIndex == $scope.tabs.accountIndex) {
        $scope.loadAll(); 
      }
      return true;
    }
  };
  
})

.controller('TradingCtrl', function($scope) {
  
})

.controller('MenuCtrl', function($rootScope, $scope, $cookies, $state, $ionicTabsDelegate) {
    $scope.logout = function() {
      $cookies.put('accessToken', undefined, {
        expires: 'Thu, 01-Jan-70 00:00:01 GMT'
      });
      $rootScope.$emit('ClearData');
      $ionicTabsDelegate.select(0);
    };

    $scope.goto = function(tabId) {
        if(tabId == 'portfolio') {
          $state.go('tab.account');
          document.getElementById('portfolio').click();
        }
    };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
});
