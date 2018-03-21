app.controller('dashboardCtrl', function ($scope, localStorageService, $http, $q, $timeout, $location) {
  var api_host = 'http://estp.fink.org:8082';

  $scope.session_key = localStorageService.get('session_key');
  $scope.sctp_objects = [];

  $scope.sortType     = 'name';
  $scope.sortReverse  = false;

  $scope.new_sctp = {};
  $scope.new_sctp.passive = 'default';
  $scope.new_sctp.heartbeat = 30;

  var possible_actions_list = [];

  //Get SCTP object names list
  $http.get(api_host + '/api/sctp-list?session-key=' + $scope.session_key).then(function (response) {
    if(response.data.result) {
      // There are SCTP objects
      var object_information_requests_array = [];

      for(var i = 0 ; i < response.data.result.length; i++) {
        var sctp_name = response.data.result[i];
        // Read SCTP object parameters
        object_information_requests_array.push($http.get(api_host + '/api/sctp-read?session-key=' + $scope.session_key + '&name=' + sctp_name));
      }

      $q.all(object_information_requests_array).then(function (results) {
        for(var i = 0 ; i < results.length; i++) {
          $scope.sctp_objects.push(results[i].data.result);

          if(results[i].data.result['local-ip']) {
            $scope.sctp_objects[i]['local-ip'] = results[i].data.result['local-ip'].join('\r\n');  
          }
          
          if(results[i].data.result['remote-ip']) {
            $scope.sctp_objects[i]['remote-ip'] = results[i].data.result['remote-ip'].join('\r\n');  
          }

          if(results[i].data.result['description']) {
            $scope.sctp_objects[i]['description'] = results[i].data.result['description'].split('+').join(' ');
          }

          if(results[i].data.result.hasOwnProperty('passive')) {
            if(results[i].data.result['passive'] == true) {
              $scope.sctp_objects[i]['passive'] = 'true';
            } else {
              $scope.sctp_objects[i]['passive'] = 'false';
            }
          } else {
            $scope.sctp_objects[i]['passive'] = 'default';
          }

          if(!results[i].data.result['heartbeat']) {
            $scope.sctp_objects[i]['heartbeat'] = 30;
          }

          possible_actions_list.push($http.get(api_host + '/api/sctp-action?session-key=' + $scope.session_key + '&name=' + $scope.sctp_objects[i].name + '&action=action-list'));
        }

        // Read possible actions
        $q.all(possible_actions_list).then(function (list) {
          for(var i = 0 ; i < list.length; i++) {

            if((list[i].data.result.indexOf('!start in progress') > -1) && (list[i].data.result.indexOf('!stop') > -1)){
              $scope.sctp_objects[i].available_action = 'none';
            }

            if((list[i].data.result.indexOf('!start') > -1) && (list[i].data.result.indexOf('!stop in progress') > -1)){
              $scope.sctp_objects[i].available_action = 'none';
            }

            if((list[i].data.result.indexOf('start') > -1) && (list[i].data.result.indexOf('!stop') > -1)) {
              $scope.sctp_objects[i].available_action = 'start';
            }

            if((list[i].data.result.indexOf('!start') > -1) && (list[i].data.result.indexOf('stop') > -1)) {
              $scope.sctp_objects[i].available_action = 'stop';
            }
          }
        }, function (err) {
          console.log(err);
        })
      }, function (error) {
        console.log(error);
      });

    } else {
      alert('Session key expired. Login again');
      $timeout(function () {
        $location.url('/login');
      },500);
    }
  }, function(error) {
    console.log(error);
  });

  $scope.add_sctp_object = function () {
    if(!$scope.new_sctp) {
      alert('Fill all fields');
    } else {
      if(!$scope.new_sctp.name || !$scope.new_sctp.local_ip || !$scope.new_sctp.local_port || !$scope.new_sctp.remote_ip || !$scope.new_sctp.remote_port) {
        alert('Fill all fields');
      } else {
        var remote_ip = $scope.new_sctp.remote_ip.split('\n').join(';');
        var local_ip = $scope.new_sctp.local_ip.split('\n').join(';');
        var description = $scope.new_sctp.description ? $scope.new_sctp.description.split(' ').join('+') : '';

        var api_request = api_host + '/api/sctp-add?session-key=' + $scope.session_key +'&name=' + $scope.new_sctp.name + '&local-ip=' + local_ip + '&remote-ip=' + remote_ip + '&local-port=' + $scope.new_sctp.local_port +'&remote-port=' + $scope.new_sctp.remote_port + '&description=' + description;

        if($scope.new_sctp.passive != 'default') {
          api_request = api_request + '&passive=' + $scope.new_sctp.passive;
        }

        if($scope.new_sctp.heartbeat != 30) {
          api_request = api_request + '&heartbeat=' + $scope.new_sctp.heartbeat;
        }

        // Add a new SCTP object
        $http.get(api_request).then(function (res) {

          $scope.new_sctp = {};
          $scope.new_sctp.passive = 'default';
          $scope.new_sctp.heartbeat = 30;

          if(res.data.result.hasOwnProperty('passive')) {
            if(res.data.result['passive'] == true) {
              res.data.result['passive'] = 'true';
            } else {
              res.data.result['passive'] = 'false';
            }
          } else {
            res.data.result['passive'] = 'default';
          }

          $scope.sctp_objects.push(res.data.result);

          $scope.sctp_objects[$scope.sctp_objects.length - 1]['local-ip'] = $scope.sctp_objects[$scope.sctp_objects.length - 1]['local-ip'].join('\r\n');
          $scope.sctp_objects[$scope.sctp_objects.length - 1]['remote-ip'] = $scope.sctp_objects[$scope.sctp_objects.length - 1]['remote-ip'].join('\r\n');
          $scope.sctp_objects[$scope.sctp_objects.length - 1]['description'] = $scope.sctp_objects[$scope.sctp_objects.length - 1]['description'].split('+').join(' ');

          $scope.sctp_objects[$scope.sctp_objects.length - 1]['available_action'] = 'none';

        }, function (error) {
          console.log(error)
        });
      }
    }
  };

  $scope.delete = function (object) {

    if(confirm('Are you sure you want to delete this SCTP object?')){

      if(object.available_action == 'stop') {
        alert('Object is running. Please stop it first');
      } else {
        var name = object.name;

        // Delete SCTP object
        $http.get(api_host + '/api/sctp-delete?session-key=' + $scope.session_key + '&name=' + name).then(function (response) {
          if(response.data.error) {
            alert('Error in deleting a sctp object. Try again later!');
          } else {
            $scope.sctp_objects.splice($scope.sctp_objects.indexOf(object) , 1);
          }
        },function (error) {
          console.log(error);
        });
      }
    }
  };
  
  $scope.edit = function (object) {
    object.editing = !object.editing;
    if(object.editing) {
      console.log('Duplicating..');
      $scope.temp_data = angular.copy(object);
    } else {

      var flag = true;

      for(key in $scope.temp_data) {
        if((key != 'available_action') && (key != 'editing')) {
          if($scope.temp_data[key] != object[key]){
            flag = false;
            break;
          }
        }
      }

      if(flag == true) {
        console.log('No data is updated');
      } else {
        if(!object['local-ip'] || !object['local-port'] || !object["remote-ip"] || !object["remote-port"]) {
          alert('Fill all fields');
        } else {

          var api_request = api_host + '/api/sctp-modify?session-key=' + $scope.session_key + '&name=' + $scope.temp_data.name;

          for(key in $scope.temp_data) {
            if((key != 'available_action') && (key != 'editing')) {
              if($scope.temp_data.name != object.name) {
                
              }

              if($scope.temp_data[key] != object[key]){
                if((key == 'local-ip') || (key == 'remote-ip')) {
                  api_request = api_request + '&' + key +'=' + object[key].split('\n').join(';');
                } else {
                  if(key =='name') {
                    api_request = api_request + '&newname=' + object.name;
                  } else if(key == 'description') {
                    api_request = api_request + '&description=' + object.description.split(' ').join('+');
                  } else {
                    api_request = api_request + '&' + key +'=' + object[key];
                  }
                }
              }
            }
          }
          console.log('Updating..');
          console.log(api_request);
          $http.get(api_request).then(function (response) {
            console.log('Updated.');
          }, function (error) {
            console.log(error);
          });
        }
      }
    }
  };

  $scope.start = function (object) {
    // Start the SCTP object
    $http.get(api_host + '/api/sctp-action?session-key=' + $scope.session_key + '&name=' + object.name + '&action=start').then(function (response) {
      if(response.data.result) {
        object.available_action = 'stop';
      }
    }, function (error) {
      console.log(error);
    })
  };

  $scope.stop = function (object) {
    // Start the SCTP object
    $http.get(api_host + '/api/sctp-action?session-key=' + $scope.session_key + '&name=' + object.name + '&action=stop').then(function (response) {
      if(response.data.result) {
        object.available_action = 'start';
      }
    }, function (error) {
      console.log(error);
    })
  };

});