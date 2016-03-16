angular.module('tradingApp.filters', [])
.filter('colorFilter', function(){
	return function(input){
		if(isNaN(input)) {
			return '';
		}
		
		if(input >= 0) {
			return 'balanced';
		}
		
		if(input < 0) {
			return 'assertive';
		}
	};
})
.filter('colorPrice', function(){
	return function(stock) {
		if(stock == null) {
			return '';
		}
		if(isNaN(stock.matchPrice)) {
			return '';
		}

		var ceilingPrice = stock.ceilingPrice;
		var floorPrice = stock.floorPrice;
		var basicPrice = stock.basicPrice;
		var matchPrice = stock.matchPrice;
		if(matchPrice == ceilingPrice) {
			return 'royal';
		}

		if(matchPrice > basicPrice) {
			return 'balanced';
		}

		if(matchPrice == basicPrice) {
			return 'energized';
		}

		if(matchPrice > floorPrice) {
			return 'assertive';
		}

		return 'calm';
	};
})
.filter('priceFilter', function() {
	return function(price) {
		if(price == 0.0 || price == 0) {
			return '';
		}

		return price;
	}
});