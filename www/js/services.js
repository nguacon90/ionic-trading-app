angular.module('tradingApp.services', [])
.factory('tradingService', function($http, $q, $log){
  var loginUrl = 'https://auth-api.vndirect.com.vn/auth',
      getVtosChallengeUrl = 'https://auth-api.vndirect.com.vn/vtos',
      postVtosAnswerUrl = 'https://auth-api.vndirect.com.vn/vtos/auth',
      getPortfolioUrl = 'https://trade-api.vndirect.com.vn/accounts/{id}/portfolio',
      getPP0Url = 'https://trade-api.vndirect.com.vn/accounts/{id}/assets',
      accountsUrl = 'https://trade-api.vndirect.com.vn/accounts',
      getStocksUrl = 'https://trade-api.vndirect.com.vn/accounts/{id}/stocks',
      deleteOrderUrl = 'https://trade-api.vndirect.com.vn/accounts/{id}/orders/{orderId}',
      getPpseUrl = 'https://trade-api.vndirect.com.vn/accounts/{id}/ppse',
      getOrdersUrl = 'https://trade-api.vndirect.com.vn/accounts/{id}/orders',
      postOrderUrl = 'https://trade-api.vndirect.com.vn/accounts/{id}/orders/new_order_requests',
      customerUrl = 'https://trade-api.vndirect.com.vn/customer';
  ajaxJson = function(method, url, token, data) {
    var config = {
        url: url,
        method: method,
        dataType: 'json',
        headers: token ? {'X-AUTH-TOKEN': token} : {},
        contentType: 'application/json'  
    };
    if (method !== 'get') {
      data = JSON.stringify(data);
      config['data'] = data;
    } else {
        config['params'] = data;
    }

    return $http(config);
  };

  return {
    login: function(account) {
      var data = {
        username: account.username,
        password: account.password
      };
      
      return ajaxJson('POST', loginUrl, null, data);
    },

    loadCustomer: function(token) {
      return ajaxJson('get', customerUrl, token);
    },

    loadPortfolio: function(token, accountNumber) {
      var url = getPortfolioUrl.replace('{id}', accountNumber);
      return ajaxJson('get', url, token);
    },

    loadAssets: function(token, accountNumber) {
      var url = getPP0Url.replace('{id}', accountNumber);
      return ajaxJson('get', url, token);
    }, 
    loadAccounts: function(token) {
       return ajaxJson('get', accountsUrl, token); 
    },
    loadStocks: function(token, accountNumber) {
        var url = getStocksUrl.replace('{id}', accountNumber);
        return ajaxJson('get', url, token);
    },
    getPpse: function(token, accountNumber, symbol, price, priceType) {
        var url = getPpseUrl.replace('{id}', accountNumber);
        return ajaxJson('get', url, token, {symbol: symbol, price: price, priceType: priceType});
    },
    postOrder: function(token, accountNumber, order) {
        var url = postOrderUrl.replace('{id}', accountNumber);
        return ajaxJson('post', url, token, order);
    },
    getVtosChallenge: function(token) {
        return ajaxJson('get', getVtosChallengeUrl, token);
    },

    postVtosAnswer: function(token, codes) {
        return ajaxJson('post', postVtosAnswerUrl, token, {
            codes: codes.join(',')
        });
    },
    loadOrderBook: function(token, accountNumber, page) {
        var url = getOrdersUrl.replace('{id}', accountNumber);
        return ajaxJson('get', url, token, {index: page});
    },
    deleteOrder: function(token, accountNumber, orderId) {
        var url = deleteOrderUrl
            .replace('{id}', accountNumber)
            .replace('{orderId}', orderId);
        return ajaxJson('delete', url, token)
    }
  }
})
.service('finfoService', function($http, $q){
    MessageUnmashaller = {
        SEPARATOR: "|",
        map: {
            //default message type
            //"STOCK", "MARKETINFO", "TRANSACTION", "PUT", "PUTEXEC"
            STOCK: function (mess){
                var arr = mess.split(MessageUnmashaller.SEPARATOR);
                if (arr.length < 40){
                    console.error("StockInfo message structre is change. ");
                    //return;
                }
                itemInfo = {};
                itemInfo.floorCode = arr[0];
                itemInfo.tradingDate = arr[1];
                itemInfo.time = arr[2];
                itemInfo.code = arr[3];
                itemInfo.companyName = arr[4];
                itemInfo.stockType = arr[5];
                itemInfo.totalRoom = arr[6];
                itemInfo.currentRoom = arr[7];
                itemInfo.basicPrice = arr[8];
                itemInfo.openPrice = arr[9];
                itemInfo.closePrice = arr[10];
                itemInfo.currentPrice = arr[11];
                itemInfo.currentQtty = arr[12];
                itemInfo.highestPrice = arr[13];
                itemInfo.lowestPrice = arr[14];
                itemInfo.ceilingPrice = arr[15];
                itemInfo.floorPrice = arr[16];
                itemInfo.totalOfferQtty = arr[17];
                itemInfo.totalBidQtty = arr[18];
                itemInfo.matchPrice = arr[19];
                itemInfo.matchQtty = arr[20];
                itemInfo.matchValue = arr[21];
                itemInfo.averagePrice = arr[22];
                itemInfo.bidPrice01 = arr[23];
                itemInfo.bidQtty01 = arr[24];
                itemInfo.bidPrice02 = arr[25];
                itemInfo.bidQtty02 = arr[26];
                itemInfo.bidPrice03 = arr[27];
                itemInfo.bidQtty03 = arr[28];
                itemInfo.offerPrice01 = arr[29];
                itemInfo.offerQtty01 = arr[30];
                itemInfo.offerPrice02 = arr[31];
                itemInfo.offerQtty02 = arr[32];
                itemInfo.offerPrice03 = arr[33];
                itemInfo.offerQtty03 = arr[34];
                itemInfo.accumulatedVal = arr[35];
                itemInfo.accumulatedVol = arr[36];
                itemInfo.buyForeignQtty = arr[37];
                itemInfo.sellForeignQtty = arr[38];
                itemInfo.projectOpen = arr[39];
                itemInfo.sequence = arr[40];
                return itemInfo;
            }
        },
        regist: function(messType, unmashaller){
            if (typeof unmashaller == "function"){
                this.map[messType] = unmashaller;
            }
        },
        unmashall: function(messType, mess){
            if (typeof this.map[messType] == "undefined" ){
                return mess;
            } 
            return this.map[messType](mess);
        }
    };

    loadAllStocks = function() {
        return $http({
          url: 'https://finfo-api.vndirect.com.vn/stocks/mini',
          method: 'get',
          dataType: 'json',
          contentType: 'application/json'
        });
    };

    getStock = function(symbol) {
        // var secInfoUrl = 'https://www.vndirect.com.vn/secinfoservice/rest/';

        // var url = secInfoUrl + 'secInfo/getSecInfo?callback=JSON_CALLBACK&code=' + symbol;
        // return $http.jsonp(url, {
            // method: 'get'
        // });
        var def = $q.defer();

        var stockUrl = 'https://priceservice.vndirect.com.vn/priceservice/secinfo/snapshot/q=codes:' + symbol;
        $http({
            method: 'get',
            url: stockUrl
        }).then(function(res){
            if (!res.data || res.data.length == 0 ) {
                def.reject();
                return;
            }
            var stockInfo = MessageUnmashaller.map.STOCK(res.data[0]);
            def.resolve(stockInfo);
        }, function(){
            def.reject();
        })

        return def.promise;
    }
    return {
        getStocks: function() {
            return loadAllStocks();
        },
        getStock: function(symbol) {
            return getStock(symbol);
        }
    }
})
.service('tradeApiErrorParser', function(){
  var TRADE_API_ERROR = {
    'CONNECTION': 'Không thể kết nối, xin vui lòng kiểm tra lại đường truyền và thử lại. Nếu bạn vẫn gặp vấn đề, xin vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'AUTH-01': 'Bạn cần đăng nhập lại để sử dụng chức năng này.',
    'AUTH-02': 'Tên đăng nhập hoặc mật khẩu bạn vừa nhập chưa đúng, xin vui lòng thử lại.',
    'AUTH-03': 'Token đăng nhập không hợp lệ. Xin đóng cửa sổ và thử lại.',
    'AUTH-04': 'Phiên đăng nhập của bạn đã kết thúc, xin vui lòng đăng nhập lại.',
    'AUTH-05': 'Bạn cần xác nhận thẻ VTOS để sử dụng chức năng này.',
    'AUTH-06': 'Mã VTOS bạn vừa điền chưa đúng, xin vui lòng thử lại. Lưu ý tránh sử dụng bộ gõ tiếng Việt.',
    'AUTH-07': 'Thẻ VTOS của bạn đã bị khóa. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để mở lại thẻ.',
    'AUTH-08': 'Thẻ VTOS của bạn chưa được kích hoạt. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'AUTH-09': 'Thẻ VTOS của bạn đã hết hạn. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'AUTH-10': 'Có lỗi xảy ra với thẻ VTOS của bạn. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'AUTH-11': 'Có lỗi xảy ra với quá trình xác nhận VTOS. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'AUTH-99': 'Có lỗi xảy ra với quá trình xác nhận VTOS. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'CLIENT-01': 'Có lỗi xảy ra với phiên đăng nhập của bạn, xin vui lòng đăng nhập lại.',
    'CLIENT-02': 'Có lỗi xảy ra với trình duyệt của bạn. Xin vui lòng refresh lại trang và thử lại.',
    'CLIENT-03': 'Có lỗi xảy ra với trình duyệt của bạn. Xin vui lòng refresh lại trang và thử lại.',
    'UNKNOWN': 'Hệ thống vừa gặp lỗi, xin vui lòng thử lại. Nếu bạn vẫn gặp vấn đề, xin gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'SERVICE-01': 'Hệ thống đang bận, chưa trả về dữ liệu. Nếu bạn vẫn gặp vấn đề, xin gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'SERVICE-02': 'Yêu cầu của bạn không thực hiện được do hệ thống đang trong phiên xử lý dữ liệu hàng ngày. Xin vui lòng thử lại sau.',
    'SERVICE-03': 'Giá không hợp lệ, xin vui lòng thử lại.',
    'SERVICE-04': 'Hệ thống vừa gặp lỗi, xin vui lòng thử lại. Nếu bạn vẫn gặp vấn đề, xin gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    
    'ORDER-0': 'Đặt lệnh không thành công. Xin vui lòng thử lại.',
    'ORDER-01': 'Loại giá bạn chọn không hợp lệ trong phiên này. Xin vui lòng thử lại.',
    'ORDER-02': 'Lệnh đặt bị trùng. Xin vui lòng thử lại.',
    'ORDER-03': 'Loại giá không tồn tại. Xin vui lòng thử lại.',
    'ORDER-04': 'Không đủ sức mua. Xin vui lòng thử lại.',
    'ORDER-05': 'Khối lượng lệnh không hợp lệ. Xin vui lòng thử lại.',
    'ORDER-06': 'Mã chứng khoán không tồn tại. Xin vui lòng thử lại.',
    'ORDER-07': 'Tài khoản không hợp lệ. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'ORDER-08': 'Tài khoản của bạn không thể giao dịch mã chứng khoán này.',
    'ORDER-10': 'Không đủ room. Xin vui lòng thử lại.',
    'ORDER-14': 'Không đủ sức mua. Xin vui lòng thử lại.',
    'ORDER-15': 'Không đủ tiền trong tài khoản. Xin vui lòng thử lại.',
    'ORDER-16': 'Khối lượng đặt vượt quá khối lượng có trong tài khoản. Xin vui lòng thử lại.',
    'ORDER-17': 'Không thể mua bán cùng mã chứng khoán trong ngày. Xin vui lòng thử lại.',
    'ORDER-18': 'Sai bước giá. Xin vui lòng thử lại.',
    'ORDER-19': 'Sai lô giao dịch. Xin vui lòng thử lại.',
    'ORDER-20': 'Không tìm thấy loại lênh. Xin vui lòng thử lại.',
    'ORDER-21': 'Thị trường đã đóng cửa. Xin thử lại vào phiên giao dịch tới.',
    'ORDER-22': 'Chứng khoán bị tạm dừng giao dịch. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'ORDER-23': 'Chứng khoán đang bị treo, không được giao dịch. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'ORDER-24': 'Thị trường đang tạm ngừng giao dịch. Vui lòng gọi cho chúng tôi theo số 1900-54-54-09 để được hỗ trợ.',
    'ORDER-26': 'Giá nằm ngoài biên độ trần sàn. Xin vui lòng thử lại.',
    'ORDER-27': 'Không đủ pool. Xin vui lòng thử lại.',
    'ORDER-28': 'Xin lỗi, đã hết giờ giao dịch. Bạn có thể đặt lệnh trở lại từ 20h00, sau khi hệ thống hoàn thành xử lý dữ liệu trong ngày.',
    'ORDER-29': 'Đặt lệnh không thành công. Khối lượng đặt lệnh tối đa cho phép trên sàn HOSE là 200,000.',
    'ORDER-30': 'Khối lượng chứng khoán không đúng, xin vui lòng thử lại.',
    'ORDER-31': 'Với lệnh đặt nhiều ngày, bạn chỉ có thể đặt lệnh Limit. Xin vui lòng thử lại.',
    'ORDER-32': 'Xin chọn ngày hết hạn.',
    'ORDER-33': 'Ngày hết hạn không hợp lệ, xin vui lòng chọn từ ngày hôm sau.',
    'ORDER-35': 'Trạng thái chứng khoán không hợp lệ. Chứng khoán bị tạm ngừng hoặc ngừng giao dịch',
    'ORDER-36': 'Không được Hủy Sửa lệnh này (lệnh gốc đặt qua ORS)',
    'ORDER-37': 'Khối lượng đặt vượt quá khối lượng cho phép của HNX',
    'ORDER-38': 'Khối lượng đặt vượt quá khối lượng cho phép của UPCOM',
    'ORDER-39': 'Tài khoản của Quý khách không thể đặt lệnh do đang có nợ quá hạn',
    'ORDER-40': 'Lệnh không đảm bảo tỷ lệ an toàn',
    'ORDER-41': 'Số lượng vượt quá số lượng chứng khoán được phép giao dịch mua ký quỹ còn lại của hệ thống',
    'ORDER-42': 'Tài khoản của Quý khách hiện tại không được giao dịch chứng khoán niêm yết',
    'ORDER-43': 'Số lượng hủy không hợp lệ. Lệnh đã bị Hủy/Sửa hoặc số lượng yêu cầu hủy lớn hơn số lượng còn lại',
    'ORDER-44': 'Trạng thái lệnh không hợp lệ',
    'ORDER-45': 'Lệnh không được tìm thấy',
    'ORDER-46': 'Không đủ số dư tiền',
    'ORDER-47': 'Không đủ số dư chứng khoán',
    'ORDER-48': 'Không đủ số dư tiền tối thiểu',
    'ORDER-49': 'Số lượng đặt phải bằng số lượng lẻ lô có trong tài khoản',
    'ORDER-50': 'Mã chứng khoán này không nằm trong danh sách được đặt lệnh, vui lòng tham khảo danh sách chứng khoán được giao dịch ký quỹ mới nhất tại VNDIRECT hoặc gọi 1900 54 54 09.',
    'ORDER-51': 'Quý khách không thể hủy sửa lệnh đặt từ ORS',
    'ORDER-52': 'Không được đặt lệnh thị trường trong phiên này',
    
    'AMEND-01': 'Không thể sửa lệnh trong 5 phút cuối phiên ATC.',
    'AMEND-02': 'Không thể sửa lệnh với mã sàn HOSE.',
    'AMEND-03': 'Không thể sửa lệnh bán xử lý.',
    'AMEND-04': 'Không thể sửa loại lệnh này.',
    'AMEND-05': 'Giá sửa không hợp lệ. Xin vui lòng thử lại.',
    'AMEND-06': 'Khối lượng còn lại không đủ. Xin vui lòng thử lại.',
    'AMEND-07': 'Khối lượng sửa cần phải lớn hơn khối lượng đã khớp. Xin vui lòng thử lại.',
    'AMEND-08': 'Không thể sửa lệnh. Lệnh đã khớp hết.',
    'AMEND-09': 'Bạn không thể huỷ hay sửa lệnh trong 5 phút cuối của phiên ATC trên sàn HNX.',
    'AMEND-10': 'Bạn không thể huỷ lệnh ATC trong phiên ATC trên sàn HOSE.',
    'AMEND-11': 'Bạn không thể huỷ lệnh Limit trong phiên ATO/ATC trên sàn HOSE',
    'AMEND-12': 'Bạn không thể sửa lệnh trên sàn HOSE.',
    'AMEND-13': 'Lệnh đã khớp, bạn không thể huỷ sửa.',
    'AMEND-14': 'Bạn không thể huỷ lệnh ATO trong phiên ATO trên sàn HOSE.',
    'AMEND-15': 'Bạn không thể huỷ sửa lệnh MP đã được khớp một phần.',
    'AMEND-18': 'Bạn không thể hủy sửa vì lệnh đã khớp.',
    'AMEND-19': 'Lệnh GTC không cho phép sửa.',   
    
    'CANCEL-01': 'Không thể hủy lệnh trong 5 phút cuối phiên ATC.',
    'CANCEL-02': 'Không thể huỷ lệnh bán xử lý.',
    'CANCEL-03': 'Yêu cầu sửa đã được huỷ từ trước.',
    'CANCEL-04': 'Lệnh gốc đang được đọc lên sàn nên tạm thời không huỷ/sửa. Quý khách vui lòng refresh sổ lệnh để xem trạng thái lệnh mới nhất.',
    'CANCEL-05': 'Lỗi hủy sửa',
    
    'ORDER-002': 'Không được đặt lệnh Thị trường trong phiên hiện tại',
    'ORDER-006': 'Khối lượng đặt vượt quá khối lượng tối đa theo quy định của sàn',
    'ORDER-007': 'Không hỗ trợ đặt lệnh lô lẻ với lệnh thị trường',
    'ORDER-008': 'Không hỗ trợ đặt lệnh lô lẻ trong phiên ATC',
    'ORDER-009': 'Số tài khoản không tồn tại',
    'ORDER-010': 'Giá nằm ngoài biên độ trần sàn. Giá vượt giá trần',
    'ORDER-010': 'Giá nằm ngoài biên độ trần sàn. Giá vượt giá trần',
    'ORDER-011': 'Giá nằm ngoài biên độ trần sàn. Giá nhỏ hơn giá sàn',
    'ORDER-011': 'Giá nằm ngoài biên độ trần sàn. Giá nhỏ hơn giá sàn',
    'ORDER-015': 'Lệnh vượt quá khối lượng chứng khoán được phép giao dịch của tài khoản',
    'ORDER-019': 'Lệnh thị trường không được đặt trong Phiên 5 phút cuối ATC',
    'ORDER-020': 'Lệnh ATO không được đặt trong phiên hiện tại',
    'ORDER-021': 'Lệnh MP không được đặt trong phiên hiện tại',
    'ORDER-022': 'Lệnh không được hủy sửa trong Phiên 5 phút cuối ATC',
    'ORDER-023': 'Lệnh không tồn tại.',
    'ORDER-025': 'Lệnh không được đặt trong Phiên Thỏa thuận',
    'ORDER-026': 'Không hỗ trợ đặt lệnh thị trường với mã sàn UPCOM',
    'ORDER-027': 'Không hỗ trợ đặt lệnh ATO với mã sàn HNX',
    'ORDER-028': 'Lệnh thị trường không được đặt trong Phiên hiện tại',
    'ORDER-029': 'Lệnh thị trường không được đặt trong Phiên ATC',
    'ORDER-030': 'Lệnh đặt không thành công do đã Hết giờ giao dịch',
    'ORDER-031': 'Lệnh thị trường không được đặt trong Phiên thỏa thuận',
    'ORDER-033': 'Hủy/Sửa lệnh không thành công do đã Hết giờ giao dịch',
    'ORDER-034': 'Lệnh không được hủy sửa trong Phiên Thỏa thuận',
    'ORDER-035': 'Lệnh không được hủy sửa trong Phiên hiện tại',
    'ORDER-036': 'Lệnh đặt không thành công do đã Hết giờ giao dịch',
    'ORDER-037': 'Lệnh không được đặt trong phiên hiện tại',
    'ORDER-038': 'Lệnh bán xử lý. Không được hủy sửa trên lệnh này. Chi tiết liên hệ Nhân viên QLTK hoặc tổng đài 1900545409 để biết thêm chi tiết.',
    'ORDER-039': 'Lệnh đang trong quá trình đọc lệnh lên Sàn. Vui lòng không Hủy/Sửa lệnh này.',
    'ORDER-041': 'Không tìm thấy số hiệu lệnh trên Sở để hủy/sửa',
    'ORDER-042': 'Lệnh không hợp lệ do sai phiên',
    'ORDER-043': 'Không đặt lệnh được do TraderID bị Halt',
    'ORDER-044': 'Không được đặt lệnh MP trong phiên ATO',
    'ORDER-045': 'Quý khách không thể hủy sửa lệnh bán xử lý. Vui lòng liên hệ Nhân viên QLTK hoặc tổng đài 1900545409 để biết thêm chi tiết.',
    'ORDER-040': 'Sai khối lượng cổ phiếu. Khối lượng lệnh thỏa thuận lô chẵn HNX tối thiểu là 5000.',
    'ORDER-046': 'Khối lượng đặt phải lớn hơn 0.',
    'ORDER-047': 'Sai khối lượng. Khối lượng thỏa thuận HOSE tối thiểu là 20000.',
    'ORDER-048': 'Sai khối lượng. Khối lượng thỏa thuận trái phiếu HNX phải nhỏ hơn 100 hoặc từ 1000 trở lên.',
    'ORDER-049': 'Lệnh bị từ chối bởi Sở.',
    'ORDER-050': 'Đối tác Mua từ chối thỏa thuận.',
    'ORDER-051': 'Bên Mua từ chối thỏa thuận.',
    'ORDER-060': 'Quý khách vui lòng bấm f5 hoặc làm mới sổ lệnh để cập nhật trạng thái mới nhất của lệnh trước khi thực hiện Hủy/Sửa.',
    'ORDER-061': 'Đã hết giờ nhận lệnh điều kiện.',

    'AMEND-002': 'Lệnh không được Hủy Sửa trong phiên hiện tại',
    'AMEND-003': 'Thông tin lệnh Sửa không được giống với thông tin lệnh gốc.',
    'AMEND-006': 'Không được phép Sửa loại lệnh',
    'AMEND-007': 'Không được phép sửa Số tài khoản ',
    'AMEND-008': 'Không được phép Sửa lệnh Mua bán',
    'AMEND-009': 'Không được phép Sửa Hiệu lực lệnh',
    'AMEND-010': 'Lệnh thị trường ở trạng thái không được phép sửa',
    'AMEND-011': 'Lệnh ở trạng thái không được phép sửa',
    'AMEND-012': 'Không được phép Sửa lệnh MAK',
    'AMEND-013': 'Không được phép Sửa lệnh MOK',
    'AMEND-014': 'Không được phép Sửa lệnh ATC',
    'AMEND-015': 'Lệnh Sửa sai lô khối lượng. Không được sửa khối lượng về 0 hoặc sửa lệnh từ lô chẵn sang lô lẻ và ngược lại',
    
    'CANCEL-001': 'Lệnh ở trạng thái không được phép hủy',
    
  };
  var parseNonServerErrors = function(jqXHR) {
    if (typeof(jqXHR) == 'undefined') {
      jqXHR = { error: 'CONNECTION' };
    }
    
    return jqXHR;
  };

  return {
    getMessage: function(jqXHR) {
      jqXHR = parseNonServerErrors(jqXHR);
      
      var message = TRADE_API_ERROR[jqXHR.error];
      if(message) {
        return message;
      }
      
      var errorCode = '';
      if(jqXHR.error) {
        errorCode = ' (' + jqXHR.error.substring(0, 15) + ')';
      }
      
      return TRADE_API_ERROR['UNKNOWN'] + errorCode;
    },

    getCode: function(jqXHR) {
      jqXHR = parseNonServerErrors(jqXHR);
      return jqXHR.error;
    },
    getMessageByCode: function(errorCode) {
      return TRADE_API_ERROR[errorCode];
    }
  };
});
