angular.module('tradingApp.controllers', [])
.controller('TradingAppCtrl', function($rootScope, $scope, $cookies, $ionicPopup, $ionicLoading, 
      $state, $ionicTabsDelegate, $ionicGesture, tradingService, tradeApiErrorParser) {
  var appPage = angular.element(document.getElementById("appPage"));
  $scope.tabs = {
    accountIndex: 0,
    marketIndex: 1,
    tradingIndex: 2,
    notiIndex: 3,
    menuIndex: 4
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
      case 2:
        return 'tab.trading' 
    }
  };

  function init() {
    $scope.account = {
      username: 'thangnt.nhtck47',
      password: 'vnds@1234'
    };
    $scope.customerInfo = null;
    $scope.targetHref = '#/tab/account';
    //TODO
    var accessToken = $cookies.get('accessToken');
    if(typeof(accessToken) !== 'undefined' && accessToken != '') {
      appPage.addClass('had-logined');
      $scope.loadAll();
      return false;
    }

    if(!appPage.hasClass('had-logined')) {
      $scope.showLogin();
    }
  };
  
  $rootScope.$on('ClearData', function(){
    appPage.removeClass('had-logined');
    init();
  });

  $scope.hadLoginedVTOS = function() {
    return appPage.hasClass('had-logined-vtos');
  };

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
            $scope.customerInfo.purchasePower = account.purchasePower;
            return;
          }
       });
       
       $scope.$broadcast('ACCOUNT_CHANGE');
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
        appPage.addClass('had-logined');
      }, function(jqXHR){
        $scope.hideLoading();  
        var errorMessage = tradeApiErrorParser.getMessage(jqXHR.data);
        showError(errorMessage);
      });
    };
  };
  var vtosloginPopup;
  $scope.vtos = [];
  $scope.showVtosLogin = function() {
    loadChallenge();
    vtosloginPopup = $ionicPopup.show({
      templateUrl: 'templates/vtos-login-form.html',
      title: '',
      cssClass: 'loginPage vtosLoginPage',
      scope: $scope
    });
  };

  $scope.loginVtos = function() {
    $scope.showLoading(); 
    var token = $cookies.get('accessToken');
    tradingService.postVtosAnswer(token, $scope.vtos).then(function(response){
      $scope.hideLoading(); 

      $cookies.put('accessToken', response.data.token);
      appPage.addClass('had-logined-vtos');
      vtosloginPopup.close(); 

    }, function(jqXHR){
      loadChallenge();
      $scope.hideLoading();  
      var errorMessage = tradeApiErrorParser.getMessage(jqXHR.data);
      showError(errorMessage);
    });
  };

  function loadChallenge() {
    $scope.showLoading(); 
    var token = $cookies.get('accessToken');
    tradingService.getVtosChallenge(token).then(function(response){
      $scope.challenges = response.data.challenges;
      $scope.hideLoading(); 
    }, function(jqXHR){
      $scope.hideLoading(); 
      var errorMessage = tradeApiErrorParser.getMessage(jqXHR.data);
      showError(errorMessage);
    });
  };

  $scope.closeVtosLogin = function() {
    if(vtosloginPopup) {
      vtosloginPopup.close();  
    }
  };

  $scope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios" class="spinner-dark"></ion-spinner>'
    });
  };

  $scope.hideLoading = function() {
    $ionicLoading.hide();
  };
  
  $scope.showError = showError;

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

  $scope.showSuccess = function(message) {
    var alertPopup = $ionicPopup.alert({
     title: 'VNDirect',
     template: message
    });

    setTimeout(function(){
      alertPopup.close();
    }, 3000);
  };

  init();

})
.controller('AccountCtrl', function($scope, $state, $ionicGesture) {
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

.controller('TabCtrl', function($scope, $ionicPopup, $log, 
    tradingService, $cookies, $state, $ionicTabsDelegate) {
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

.controller('TradingCtrl', function($scope, $state, $filter, $ionicScrollDelegate,
                                    $cookies, $ionicSlideBoxDelegate, finfoService,
                                    tradingService, tradeApiErrorParser) {
  $scope.handleTabEvent(angular.element(document.querySelector('#placeorder'))); 
  $scope.handleTabEvent(angular.element(document.querySelector('#orderbook')));
  $scope.nativeEvents = {
    keyboardshow: false
  };

 
  $scope.config = {
    priceTypes: {
      HOSE: ['LO', 'ATO', 'ATC', 'MP'],
      HNX: ['LO', 'ATC', 'MOK', 'MAK', 'MTL'],
      UPCOM: ['LO'],
      ALL: ['LO', 'ATO', 'ATC', 'MOK', 'MAK', 'MTL', 'MP']
    }
  };

  $scope.orderTypes = $scope.config.priceTypes['ALL'];

  $scope.order = {
    quantity: 0,
    price: 0,
    side: 'NB',
    priceType: 'LO'
  };

  $scope.side = {
    active: 0,
    mapSign: {
      0: 'NS',
      1: 'NB'
    }
  };

  $scope.mapExchange = {};

  $scope.stockInfo = {};
  
  $scope.highlight = function(event) {
    var element = angular.element(event.gesture.target);
    element.addClass('highlight');
    setTimeout(function(){
      element.removeClass('highlight');
    }, 200);
  };

  $scope.changeSideActive = function(sign) {
    if(sign < 0) {
      $scope.side.active++;
      $scope.side.active = $scope.side.active > 3 ? 0 : $scope.side.active;
    } else {
      $scope.side.active--;
      $scope.side.active = $scope.side.active < 0 ? (2 - $scope.side.active) : $scope.side.active;
    }
    
    $ionicSlideBoxDelegate.slide($scope.side.active);
  };

  $scope.loadAccountInfo = function() {
    $scope.loadPP0();
    $state.go($scope.getState($scope.tabs.tradingIndex));
  };

  finfoService.getStocks().then(function(response){
      $scope.allStocks = response.data.data;
      angular.forEach($scope.allStocks, function(stock, index){
        $scope.mapExchange[stock.symbol] = stock.floor; 
      });
  });

  $scope.initAutocomplete = function() {
    finfoService.getStocks().then(function(response){
      $scope.allStocks = response.data.data;
    });
  };

  $scope.search = function() {
    
    var stocks = $filter('filter')($scope.allStocks, function(stock, index, array){
      return stock.symbol.indexOf($scope.order.symbol) >= 0 && $scope.order.symbol != '';
    });

    $scope.suggestStocks = stocks;
    $ionicScrollDelegate.scrollTop();
  };

  $scope.setFocus = function(isFocus) {
    $scope.focusInput = isFocus;
  };

  $scope.loadStockInfo = function(symbol) {
    $scope.order.symbol = symbol;
    loadStock();
  };

  $scope.changeQty = function(isIncrease) {
    if(isIncrease) {
      $scope.order.quantity += getStepQty();
      return;
    } 
    
    if($scope.order.quantity == 0) {
      return;
    }
    
    $scope.order.quantity -= getStepQty(); 
     
  };

  $scope.changePrice = function(unit) {
    if(unit < 0 && $scope.order.price == 0) {
      return;
    }
    if(typeof($scope.order.price) == 'string') {
      $scope.order.price = parseFloat($scope.order.price);
    };
    
    $scope.order.price = $filter('number')($scope.order.price + unit, 1).replace(/,/g, '');
  };

  $scope.placeOrder = function() {
    var token = $cookies.get('accessToken');
    var accountNumber = $scope.customerInfo.activeAccount;
    var order = {
      symbol: $scope.order.symbol,
      side: ($scope.side.active % 2 == 0 ? 'NB': 'NS'),
      orderType: $scope.order.priceType,
      quantity: $scope.order.quantity,
      price: $filter('number')($scope.order.price * 1000, 0).replace(/,/g, '')
    };
    $scope.showLoading();  
    tradingService.postOrder(token, accountNumber, order).then(function(response){
      $scope.hideLoading(); 
      $scope.showSuccess('Đặt lệnh thành công');
      $scope.order = {
        quantity: 0,
        price: 0,
        side: 'NB',
        priceType: 'LO'
      };
      $scope.stockInfo = {};
      $scope.loadPP0();
    }, function(jqXHR){
      $scope.hideLoading(); 
      if(jqXHR.data.error == 'AUTH-01') {
        $scope.showVtosLogin();
        return false;
      }

      var errorMessage = tradeApiErrorParser.getMessage(jqXHR.data);
      $scope.showError(errorMessage);

    });
  };

  $scope.$on('ACCOUNT_CHANGE', function(){
    getPpse();
  });

  window.addEventListener('native.keyboardshow', function(e){
    $scope.nativeEvents.keyboardshow = true;
    $scope.$applyAsync();
  });

  window.addEventListener('native.keyboardhide', function(e){
    $scope.nativeEvents.keyboardshow = false;
    $scope.$applyAsync();
  });
  $scope.rotateDeg = 0;
  $scope.index = 0;
  $scope.rotateXFLip = 0;
  $scope.rotateXFLop = -90;
  $scope.translateZXFlop;
  function loadStock() {
    // $scope.showLoading(); 
    //$scope.stockInfo=null; 
    finfoService.getStock($scope.order.symbol).then(function(response){
      $scope.stockInfo = response.data.secInfo;
    
      // setTimeout(function(){
        
      //   if($scope.index == 0) {
      //     document.getElementById('lbPrice').style.transform = 'rotateX('+ $scope.rotateDeg + 'deg)';
      //     $scope.index++;
      //     $scope.rotateDeg += -90;
      //     return;
      //   }
      //   console.log($scope.index);

      //   if($scope.index % 2 != 0) {
      //     $scope.rotateXFLop += 180;
          

      //     $scope.translateZXFlop = '30px';
      //     var transformFlop = 'rotateX('+ $scope.rotateXFLop + 'deg) translateZ('+ $scope.translateZXFlop +')';
      //     console.log("flop", $scope.rotateXFLop, $scope.translateZXFlop)
      //     document.getElementById('lbFlop').style.transform = transformFlop;
      //   } else {
      //     $scope.rotateXFLip += 180;
      //     document.getElementById('lbFlip').style.transform = 'rotateX('+ $scope.rotateXFLip + 'deg) translateZ(30px)';

      //     console.log("flip", $scope.rotateXFLip, $scope.translateZXFlop)
      //   }
      //   console.log("cube", $scope.rotateDeg)
      //   document.getElementById('lbPrice').style.transform = 'rotateX('+ $scope.rotateDeg + 'deg)';
      //   $scope.index++;
      //   $scope.rotateDeg += -90;
        
      //   //setTimeout(function() {
      //     $scope.preCeilingPrice = $scope.stockInfo.ceilingPrice;
      //     $scope.$applyAsync();
      //   //}, 1000);

      // }, 300);

      

      $scope.order.quantity = getStepQty();
      $scope.order.price = $filter('number')($scope.stockInfo.matchPrice, 1);
      loadPriceTypes();
      getPpse();
      // $scope.hideLoading();  
    }, function() {
      // $scope.hideLoading();  
    });
  };

  function getStepQty() {
    if($scope.stockInfo.code == null || typeof($scope.stockInfo.code) == 'undefined') {
      return 0;
    }

    var symbol = $scope.stockInfo.code.toUpperCase();
    var exchange = $scope.mapExchange[symbol];
    if("HNX" == exchange || "UPCOM" == exchange) {
      return 100;
    } 

    if("HOSE" == exchange) {
      return 10;
    }

  };

  function loadPriceTypes() {
    if($scope.stockInfo.code == null || typeof($scope.stockInfo.code) == 'undefined') {
      return;
    }

    var symbol = $scope.stockInfo.code.toUpperCase();
    var exchange = $scope.mapExchange[symbol];
    $scope.priceTypes = $scope.config.priceTypes[exchange];
  };

  function getPpse() {
    var token = $cookies.get('accessToken');
    var accountNumber = $scope.customerInfo.activeAccount;
    var symbol = $scope.order.symbol;
    var price = $scope.order.price;
    var priceType = $scope.order.priceType;
    if(price == 0 || typeof(symbol) == 'undefined') {
      return;
    }
    tradingService.getPpse(token, accountNumber, symbol, price, priceType).then(function(response){
      $scope.customerInfo.purchasePower = response.data.ppse;
    });
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
});
