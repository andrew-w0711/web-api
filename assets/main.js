var app = angular.module('myapp',['ngRoute','LocalStorageModule']);

app.config(function($routeProvider, localStorageServiceProvider) {
  localStorageServiceProvider
    .setPrefix('app')
    .setStorageType('sessionStorage')
    .setNotify(true, true);

  $routeProvider
    .when('/login', {
      templateUrl: 'login/login.html', 
      controller: 'loginCtrl'
    })
    .when('/dashboard', {
      templateUrl: 'dashboard/dashboard.html', 
      controller:  'dashboardCtrl'
    })
    .otherwise({ redirectTo: '/login' });
});