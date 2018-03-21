app.controller('loginCtrl', function ($scope, $http, $timeout, $location, localStorageService) {
  $scope.login = function () {
    if($scope.username && $scope.password) {
      $http.get('http://estp.fink.org:8082/api/login?username=' + $scope.username + '&password=' + $scope.password).then(function (response) {
        if(response.data.result) {
          
          localStorageService.set('session_key', response.data.result);
          $scope.notification = 'success';
          $scope.message = 'Login Successfully';
          $timeout(function () {
            $location.url('/dashboard');
          },1000);
        } else {
          $scope.notification = 'error';
          $scope.message = "Username and Password don't match";  
        }
      }, function (error) {
        $scope.notification = 'error';
        $scope.message = "Username and Password don't match";
      })
    }
  }
});