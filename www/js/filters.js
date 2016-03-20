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
})
.filter('sideFilter', function() {
	return function(side) {
		switch(side) {
			case 'NB':
			  	return 'Mua';
			case 'NS':
			 	return 'Bán';
			default:
			 	return '';
		}
	}
})
.filter('sideColor', function(){
	return function(side) {
		switch(side) {
			case 'NB':
			  	return 'balanced';
			case 'NS':
			 	return 'assertive';
			default:
			 	return '';
		}
	}
})
.filter('statusFilter', function() {
	return function(status) {
		switch(status) {
			case 'PendingNew':
				return 'Chờ xử lý';
			case 'New':
				return 'Đã lên sàn';
			case 'PartiallyFilled':
				return 'Khớp một phần';
			case 'Filled':
				return 'Khớp toàn bộ';
			case 'PendingReplace':
				return 'Đang gửi lệnh sửa';
			case 'Replaced':
				return 'Sửa thành công';
			case 'PendingCancel':
				return 'Đang gửi lệnh huỷ';
			case 'Cancelled':
				return 'Huỷ thành công';
			case 'Canceled':
				return 'Huỷ thành công';
			case 'Rejected':
				return 'Sàn từ chối';
			case 'DoneForDay':
				return 'Giải toả vì hết phiên';
			case 'Expired':
				return 'Hết hạn';
			case 'Completed':
				return '';
		}
	}
});