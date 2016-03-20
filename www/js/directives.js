angular.module('tradingApp.directives', []).directive('capitalize', function() {
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
        var capitalize = function(inputValue) {
           if(inputValue == undefined) inputValue = '';
           var capitalized = inputValue.toUpperCase();
           if(capitalized !== inputValue) {
              modelCtrl.$setViewValue(capitalized);
              modelCtrl.$render();
            }         
            return capitalized;
         }
         modelCtrl.$parsers.push(capitalize);
         capitalize(scope[attrs.ngModel]);  // capitalize initial value
     }
   };
})
.directive('numberOnly', function(){
  return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                return undefined;
            }            
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
})
.directive('moveNextOnMaxlength', function() {
    return {
        restrict: "A",
        link: function($scope, element) {
            element.on("input", function(e) {
                if(element.val().length == element.attr("maxlength")) {
                    var $nextElement = element.parent('div').next().find('input');
                    if($nextElement.length) {
                        $nextElement[0].focus();
                    }
                }
            });
        }
    }
})
.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                if (!$window.getSelection().toString()) {
                    // Required for mobile Safari
                    this.setSelectionRange(0, this.value.length)
                }
            });
        }
    };
}])
.directive('animateOnChange', function($animate, $compile){
    var watchers = {};
    return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      watchers[scope.$id] && watchers[scope.$id](); // deregister `$watch`er if one already exists 
      watchers[scope.$id] = scope.$watch(attrs.animateOnChange, function(newValue, oldValue) {          
        if (newValue !== oldValue) {
          $animate.enter($compile(element.clone())(scope), element.parent(), element);
          element.html(oldValue);
          $animate.leave(element); 
        }
      });
    }
  }
});