angular.module('tradingApp.controllers', [])
.controller('TradingAppCtrl', function($rootScope, $scope, $cookies, $ionicPopup, $ionicLoading, 
      $state, $ionicTabsDelegate, $ionicGesture, tradingService, tradeApiErrorParser) {
  $scope.tabs = {
    accountIndex: 0,
    tradingIndex: 1
  };
  $scope.tabInfo = {};
  $scope.topMenu = {
    accountPage: {
       portfolio: 'portfolio',
       asset: 'asset'
    },
    tradingPage: {
      placeorder: 'placeorder',
      orderbook: 'orderbook'
    }
  };
  $scope.tabInfo.selectedTab = $scope.topMenu.accountPage.portfolio;

  $scope.getState = function(tabIndex) {
    switch(tabIndex) {
      case 0:
        return 'tab.account'
      case 1:
        return 'tab.trading' 
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

  $scope.showAccountList = function(state) {
    $state.go(state);
  };

  $scope.handleTabEvent = function(element) {
    $ionicGesture.on('tap', function(e){
        $scope.$applyAsync(function() {
          $scope.tabInfo.selectedTab = e.target.id;
          switch($scope.tabInfo.selectedTab) {
            case $scope.topMenu.accountPage.portfolio: 
              $scope.loadPortfolio();
              return;
            case $scope.topMenu.accountPage.asset: 
              $scope.loadAssets();
              $scope.loadStocks();
              $scope.loadPP0();
              return;
          }
        });    
    }, element);
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
        $state.go($scope.getState($scope.tabs.accountIndex));
        $scope.tabInfo.selectedTab = $scope.topMenu.accountPage.portfolio;
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
.controller('AccountCtrl', function($scope, $state, $ionicGesture) {
    $scope.loadAll();
    // $scope.tabInfo.selectedTab = $scope.topMenu.accountPage.portfolio;
    $scope.handleTabEvent(angular.element(document.querySelector('#portfolio')));
    $scope.handleTabEvent(angular.element(document.querySelector('#asset')));

    $scope.loadAccountInfo = function() {
      $scope.loadPortfolio();
      $scope.loadPP0();
      $scope.loadAssets();
      $scope.loadStocks();
      $state.go($scope.getState($scope.tabs.accountIndex));
    };
})

.controller('TabCtrl', function($scope, $ionicPopup, $log, tradingService, $cookies, $state, $ionicTabsDelegate) {
  $scope.loadData = function(obj) {
    var token = $cookies.get('accessToken');
    if(token && token != '') {
      if(obj == $scope.tabs.accountIndex) {
        var element = document.getElementById($scope.topMenu.accountPage.portfolio);
        ionic.trigger('tap', {target: element}, false, false);
        $state.go($scope.getState(obj));
      } else if(obj == $scope.tabs.tradingIndex) {
        $scope.tabInfo.selectedTab = $scope.topMenu.tradingPage.placeorder;
        $state.go($scope.getState(obj));
      }
    }
  };
  
})

.controller('TradingCtrl', function($scope, $state, $ionicSlideBoxDelegate) {
  $scope.handleTabEvent(angular.element(document.querySelector('#placeorder'))); 
  $scope.handleTabEvent(angular.element(document.querySelector('#orderbook')));

  $scope.order = {
    quantity: 0,
    price: 0,
    sign: 'NB',
    orderType: 'LO'
  };
  $scope.sign = {
    active: 0,
    mapSign: {
      0: 'NS',
      1: 'NB'
    }
  };
  
  $scope.highlight = function(event) {
    var element = angular.element(event.gesture.target);
    element.addClass('highlight');
    setTimeout(function(){
      element.removeClass('highlight');
    }, 200);
  };

  $scope.slideSigns = function (index) {
    var signKey = index % 2;

  };

  $scope.changeSignActive = function(sign) {
    if(sign > 0) {
      $scope.sign.active++;
      $scope.sign.active = $scope.sign.active > 3 ? 0 : $scope.sign.active;
    } else {
      $scope.sign.active--;
      $scope.sign.active = $scope.sign.active < 0 ? (2 - $scope.sign.active) : $scope.sign.active;
    }
    
    $ionicSlideBoxDelegate.slide($scope.sign.active);
  };

  $scope.loadAccountInfo = function() {
    $scope.loadPP0();
    $state.go($scope.getState($scope.tabs.tradingIndex));
  };
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
        if(tabId == $scope.topMenu.accountPage.portfolio ||
          tabId == $scope.topMenu.accountPage.asset) {
          var accountState = $scope.getState($scope.tabs.accountIndex);
          $state.go(accountState);
          var element = document.getElementById(tabId);
          ionic.trigger('tap', {target: element}, false, false);
        }
    };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
});
