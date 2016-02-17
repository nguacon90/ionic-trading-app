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
});