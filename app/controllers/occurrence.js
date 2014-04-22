/*
 * Application description
 * TODO
 */

document.addEventListener("deviceready", function() {
  angular.bootstrap(document, ['occurrenceApp']);
});

var occurrenceApp = angular.module('occurrenceApp',
                                  ['OccurrenceModel', 'hmTouchevents']);

occurrenceApp.controller('IndexCtrl', function ($scope, Occurrence) {
  // Will rotate to every direction
  steroids.view.setAllowedRotations([0,180,-90,90]);

  // Route states
  $scope.currentRoute = null;
  $scope.currentRouteWatcher = null;
  $scope.currentSubRoute = null;
  $scope.currentOccurrence = null;

  // Data structures for the application
  // this structures define the current
  // state of the application
  // it will be all saved in localStorage
  $scope.routes = [];
  $scope.currentOccurrences = [];
  $scope.currentMarker = null;
  $scope.currentPolyline = null;

  // form values
  $scope.settingsPavimento = [
    {id:'flex',name:'Flexível'},
    {id:'rigido',name:'Rígido'},
    {id:'semirigido',name:'Semi-rigido'},
    {id:'blocosbetao',name:'Blocos de betão'},
    {id:'paralelepipedos',name:'Paralelepípedos de rocha natural'},
    {id:'outro',name:'Outro'}
  ];

  $scope.settingsBermas = [
    {id:'True',name:'Sim'},
    {id:'False',name:'Não'}
  ];

  $scope.settingsLarguraDaBerma = [
    {id:'0',name:'0'},
    {id:'1',name:'1'},
    {id:'2',name:'2'},
    {id:'3',name:'3'},
    {id:'4',name:'4'},
    {id:'5',name:'5'},
    {id:'6',name:'6'},
    {id:'7',name:'7'},
    {id:'8',name:'8'},
    {id:'9',name:'9'},
    {id:'10',name:'10'},
    {id:'11',name:'11'},
    {id:'12',name:'12'},
    {id:'13',name:'13'},
    {id:'14',name:'14'},
    {id:'15',name:'15'}
  ];

  $scope.settingsNrVias = [
    {id:'0',name:'0'},
    {id:'1',name:'1'},
    {id:'2',name:'2'},
    {id:'3',name:'3'},
    {id:'4',name:'4'},
    {id:'5',name:'5'},
    {id:'6',name:'6'},
    {id:'7',name:'7'},
    {id:'8',name:'8'},
    {id:'9',name:'9'},
    {id:'10',name:'10'},
    {id:'11',name:'11'},
    {id:'12',name:'12'},
    {id:'13',name:'13'},
    {id:'14',name:'14'},
    {id:'15',name:'15'}
  ];

  $scope.settingsLarguraTotalPavimento = [
    {id:'0',name:'0'},
    {id:'1',name:'1'},
    {id:'2',name:'2'},
    {id:'3',name:'3'},
    {id:'4',name:'4'},
    {id:'5',name:'5'},
    {id:'6',name:'6'},
    {id:'7',name:'7'},
    {id:'8',name:'8'},
    {id:'9',name:'9'},
    {id:'10',name:'10'},
    {id:'11',name:'11'},
    {id:'12',name:'12'},
    {id:'13',name:'13'},
    {id:'14',name:'14'},
    {id:'15',name:'15'}
  ];

  // type of occurrences, check with backend
  $scope.instances = {
    '11' : {'name' : 'Rodeiras - Tipo 1'},
    '12' : {'name' : 'Rodeiras - Tipo 2', 'watching' : false,
                                          'points': [], 'watch_id': null},
    '13' : {'name' : 'Rodeiras - Tipo 3'},
    '21' : {'name' : 'Fendilhamento - Tipo 1'},
    '22' : {'name' : 'Fendilhamento - Tipo 2'},
    '23' : {'name' : 'Fendilhamento - Tipo 3'},
    '31' : {'name' : 'Peladas etc - Tipo 1', 'watching' : false, 'points': [], 'watch_id': null},
    '32' : {'name' : 'Peladas etc - Tipo 2'},
    '33' : {'name' : 'Peladas etc - Tipo 3'},
    '41' : {'name' : 'Covas - Tipo 1'},
    '42' : {'name' : 'Covas - Tipo 2'},
    '43' : {'name' : 'Covas - Tipo 3'},
    '51' : {'name' : 'Reparações - Tipo 1'},
    '52' : {'name' : 'Reparações - Tipo 2'},
    '53' : {'name' : 'Reparações - Tipo 3'}
  };

  // instantiates the map
  var map = L.map('map-container').setView([40.20641, -8.409745], 13);

  // add the tile
  L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Yeah right OSM.',
      maxZoom: 18
  }).addTo(map);


  $scope.takePicture = function() {
    console.log(" Take picture.");
    navigator.camera.getPicture($scope.imageUriReceived, function(message) {
        setTimeout(function() {
            alert(message);
        }, 100);
    }, {
        quality: 25,
        destinationType: navigator.camera.DestinationType.FILE_URI,
        sourceType: navigator.camera.PictureSourceType.CAMERA,
        encodingType: navigator.camera.EncodingType.JPEG,
        targetWidth:800,
        correctOrientation:true
    });
  };

  $scope.imageUriReceived = function(imageURI) {
      return window.resolveLocalFileSystemURI(imageURI, $scope.gotFileObject, $scope.fileError);
  };

  $scope.fileError = function(error) {
    navigator.notification.alert("Cordova error code: " + error.code, null, "File system error!");
  };

  $scope.gotFileObject = function(file) {
    var fileMoved;
    steroids.on("ready", function() {
      var fileName, targetDirURI;
      targetDirURI = "file://" + steroids.app.absoluteUserFilesPath;

      fileName = String(new Date().getTime()) + ".jpeg";
      return window.resolveLocalFileSystemURI(targetDirURI, function(directory) {
        return file.moveTo(directory, fileName, fileMoved, fileError);
      }, fileError);
    });
    return fileMoved = function(file) {
      console.log(file.name);
    };
  };

  /**
   * clearLayers function to clear the map
   * @return void
   */
  $scope.clearLayers = function() {
    // clear markers if they exist
    if($scope.currentMarker) {
      map.removeLayer($scope.currentMarker);
      $scope.currentMarker = null;
    }
    // clear polyline if they exist
    if($scope.currentPolyline) {
      map.removeLayer($scope.currentPolyline);
      $scope.currentPolyline = null;
    }
  };

  /**
   * trackingIsActive the name tells it, just for readability
   * @return Boolean
   */
  $scope.trackingIsActive = function() {
    return $scope.currentRouteWatcher ? true : false ;
  };

  /**
   * triggerStartRoute defines if the state of the button and its action,
   *                   tells if we're starting or stopping the gps watcher
   *                   to the route
   * @param  Object $event
   */
  $scope.triggerStartRoute = function($event) {
    var button = angular.element($event.target);
    if ($scope.trackingIsActive()) {
      alert("Terminou a rota");
      // if it's watching something, stops
      button.removeClass('topcoat-button--large--cta');
      button.addClass('topcoat-button--large');
      $scope.stopRoute();
    } else {
      button.removeClass('topcoat-button--large');
      button.addClass('topcoat-button--large--cta');
      $scope.startRoute();
    }
  };

  /**
   * stopRoute clear the watchers and reset the state
   */
  $scope.stopRoute = function() {
    navigator.geolocation.clearWatch($scope.currentRouteWatcher);
    $scope.currentRouteWatcher = null;
  };

  /**
   * startRoute starts a new route enabling the main path
   * @param  Object event
   */
  $scope.startRoute = function($event) {
    // gets the current selected route
    var route = $scope.getCurrentRoute();

    if(!$scope.trackingIsActive()) {
      // starts the watcher
      alert("nova rota a gravar");
      var options = { timeout: 30000, enableHighAccuracy: true };

      // when starting a route, first sub route is the next element of the array
      var lastIndex = route.subRoutes.length;
      route.subRoutes[lastIndex] = [];

      $scope.currentRouteWatcher = navigator.geolocation.watchPosition(
        function(position) {
          route.subRoutes[lastIndex].push(position);
        },
        function(error) {
          alert("erro a gravar a rota");
        },
      options);
    } else {
      alert("Erro - Tem uma rota ativa");
    }
  };

  /**
   * triggerRoadSettings shows the form for road settings changes
   * @param  Object $event
   */
  $scope.triggerRoadSettings = function($event) {
    document.getElementById('route-settings').style.visibility = 'hidden';
    var roadSettingsDiv = angular.element('#route-settings');
    var commanderDiv = angular.element('#commander');
    commanderDiv.hide();
    roadSettingsDiv.show();
  };

  /**
   * changeRoadSettings update the settings value of Road
   * @param  Object $event
   */
  $scope.changeRoadSettings = function($event) {
    /* working
    $scope.settings_pav;
    $scope.settings_bermas;
    $scope.settings_largura_berma;
    $scope.settings_nrvias;
    $scope.settings_largura_pavimento;
    */
  };

  /**
   * startPathOccurrence init GPS watcher and makes the relation to the instances
   * @param  int id is the type of instance referenced in $scope.instances
   */
  $scope.startPathOccurrence = function(id) {
    // remove if we have something
    $scope.clearLayers();
    // just a flag to check wether we'r watching or not
    $scope.instances[id].watching = true;
    // starts the watcher
    var options = { timeout: 30000, enableHighAccuracy: true };

    $scope.instances[id].watch_id = navigator.geolocation.watchPosition(
      function(position) {
        // remove the last one
        $scope.clearLayers();
        var pos = [position.coords.latitude, position.coords.longitude];
        $scope.currentMarker = L.marker(pos).addTo(map);
        // for every location update add the point to the
        // updated state of the instance object
        $scope.instances[id].points.push(position);
      },
      function(error) {
        alert(error);
      },
    options);
  };

  /**
   * stopsAndSavePathOccurrence stops the current watcher and save the path
   *                            occurrence
   * @param  int id is the type of instance referenced in $scope.instances
   */
  $scope.stopsAndSavePathOccurrence = function(id) {
    $scope.clearLayers();
    // updates the flag
    $scope.instances[id].watching = false;
    // stop watching
    navigator.geolocation.clearWatch($scope.instances[id].watch_id);
    $scope.instances[id].watch_id = null;

    // draw the line
    var path = [];
    var pathObject = $scope.instances[id].points;

    // get the points from current state of the instance
    // creates the array and draws the polyline
    for(var p in pathObject) {
      path.push([pathObject[p].coords.latitude, pathObject[p].coords.longitude]);
    }
    // save the occurrence
    $scope.addOccurrence({
      id : new Date().getTime(),
      instance_id : id,
      position : null,
      path : path,
      name: $scope.instances[id].name,
      createddate : new Date(),
      type: 'path'
    });

    /* refresh */
    $scope.$apply();
    $scope.currentPolyline = L.polyline(path, {color: 'red'}).addTo(map);
    // zoom the map to the polyline
    map.fitBounds($scope.currentPolyline.getBounds());
    // clear points
    $scope.instances[id].points = [];
    // stop watching
    steroids.view.navigationBar.show("Speroroads :: Gravado " + $scope.instances[id].name);
  };

  /**
   * triggerPathOcc function that starts or stops a type path occurrence,
   *                triggered when a button is clicked
   * @param Object $event has the details of the event, we need this to check
   *                      the type of occ it is
   * @return void changes the state of the app
   */
  $scope.triggerPathOcc = function($event) {
    if($scope.trackingIsActive()) {
      if ($scope.currentRoute) {
        var id = $event.target.attributes.rel.value;
        var button = angular.element($event.target);
        // if it's watching something, stops
        if($scope.instances[id].watching) {
          button.removeClass('topcoat-button--large--cta');
          button.addClass('topcoat-button--large');
          $scope.stopsAndSavePathOccurrence(id);
        } else {
          button.removeClass('topcoat-button--large');
          button.addClass('topcoat-button--large--cta');
          $scope.startPathOccurrence(id);
        }
      } else {
        alert('You need to select or create a new route to add occurrences.');
      }
    } else {
      alert("Tem que ter a rota iniciada para registar ocorrências.");
    }
  };

  /**
   * save When it's a single type occurrence we can save it instantly
   * @param  Object $event same as above
   * @return void change the state of the app
   */
  $scope.saveSingleOccurrence = function($event) {
    if($scope.trackingIsActive()) {
      var id = $event.target.attributes.rel.value;
      if ($scope.currentRoute) {
        navigator.geolocation.getCurrentPosition(function(position) {
          // clear markers if they exist
          $scope.clearLayers();

          var pos = [position.coords.latitude, position.coords.longitude];
          /* create layer to easily remove marker */
          $scope.currentMarker = L.marker(pos).addTo(map);

          //$scope.occ.push(occurrence);
          $scope.addOccurrence({
            id : new Date().getTime(),
            instance_id : id,
            position : position,
            path : null,
            name: $scope.instances[id].name,
            createddate : new Date(),
            type: 'single',
          });

          /* refresh */
          $scope.$apply();
          steroids.view.navigationBar.show("Speroroads :: Gravado " + $scope.instances[$event.target.attributes.rel.value].name);
        },
        function(error) {
          alert("Erro a adicionar ocorrencia");
        });
      } else {
        alert("You need to select or create a new route to add occurrences.");
      }
    } else {
      alert("Tem que ter a rota iniciada para registar ocorrências.");
    }
  };

  /**
   * buildRouteFromSubRoutes this function gets all sub routes and join
   *                         all arrays in one
   * @param  Object route
   * @return Array
   */
  $scope.buildRouteFromSubRoutes = function(route) {
    var BuiltArray = [];
    for(var p in route.subRoutes) {
      for(var r in route.subRoutes[p]) {
        BuiltArray.push([route.subRoutes[p][r].coords.latitude,
                         route.subRoutes[p][r].coords.longitude]);
      }
    }
    return BuiltArray;
  };

  /**
   * renderRoute update the view and map with the selected route info
   * @param  Object route
   */
  $scope.renderRoute = function(route) {
    $scope.currentRoute = route.id;
    // needs to loose the reference, that's why we clone the array with slice
    $scope.currentOccurrences = route.occurrences.slice(0);
    var path = $scope.buildRouteFromSubRoutes(route);
    if(path.length > 0) {
      $scope.currentPolyline = L.polyline(path, {color: 'blue'}).addTo(map);
      // zoom the map to the polyline
      map.fitBounds($scope.currentPolyline.getBounds());
    }
  };


  /**
   * newRoute creates add's a new route to the current state of the app
   * @return void
   */
  $scope.newRoute = function() {
    var dt = new Date();
    var route_id = dt;
    var buildDate = dt.getDate() + '/' + dt.getMonth() + '/' + dt.getFullYear() + ' ' + dt.getHours()  + ':' + dt.getMinutes();
    var route = {
      id: dt.getTime(),
      name: buildDate,
      subRoutes : [],
      occurrences: [],
      options: {
      }
    };
    $scope.routes.push(route);
    $scope.currentRoute = route.id;
    $scope.currentOccurrences.length = 0;
    $scope.currentOccurrences = [];
  };

  /**
   * saveRoute saves the current state of the app to localStorage, note: it save ALL routes
   * @param Object $event
   * @return void
   */
  $scope.saveRoute = function(obj) {
    if(!$scope.trackingIsActive()) {
      $scope.saveToPersistence();
      if(!obj['delete']) {
        alert("Salvou a rota.");
      } else {
        alert("Rota apagada.");
      }
    } else {
      alert("Termine o registo da rota primeiro para gravar o seu estado.");
    }
  },

  /**
   * addOccurrence to current route data structure
   * @param Object occurrence
   */
  $scope.addOccurrence = function(occurrence) {
    var route = $scope.getCurrentRoute();
    if(route) {
      route.occurrences.push(occurrence);
      $scope.currentOccurrences.push(occurrence);
      return true;
    }
    return false;
  },

  /**
   * getCurrentRoute helper function to check get the currentRoute object
   * @return Object the actual route
   */
  $scope.getCurrentRoute = function() {
    for (var i = 0; i < $scope.routes.length; i++) {
      if($scope.routes[i].id == $scope.currentRoute) {
        return $scope.routes[i];
      }
    };
    return false;
  },

  /**
   * openOccurrence Displays the occurrence info, and shows it on the map
   * @param  int id the occurrence id
   */
  $scope.openOccurrence = function(id) {

    $scope.clearLayers();

    // find it

    for(var o in $scope.currentOccurrences) {
      if(parseInt($scope.currentOccurrences[o].id) == parseInt(id)) {

        $scope.currentOccurrence = $scope.currentOccurrences[o];

        // check the type
        if($scope.currentOccurrences[o].type == 'single') {
          pos = $scope.currentOccurrences[o].position;
          $scope.currentMarker = L.marker([pos.coords.latitude,
                                          pos.coords.longitude]).addTo(map);
          map.fitBounds([[pos.coords.latitude, pos.coords.longitude]]);
        } else {

          var path = $scope.currentOccurrences[o].path;
          $scope.currentPolyline = L.polyline(path, {color: 'red'}).addTo(map);
          // zoom the map to the polyline
          map.fitBounds($scope.currentPolyline.getBounds());
        }
        steroids.view.navigationBar.show("Speroroads :: Vendo " + $scope.instances[$scope.currentOccurrences[o].id].name);
      }
    }
  };

  /* SAVE CURRENT STATE */
  $scope.saveToPersistence = function(id) {
    localStorage.setItem('routes', JSON.stringify($scope.routes));
  };

  $scope.loadFromPersistent = function(id) {
    try {
      $scope.routes = JSON.parse(localStorage.getItem('routes'));
      if ($scope.routes == null) {
        $scope.routes = [];
      }
    } catch(e) {
      $scope.routes = [];
    }
  };

  $scope.delete = function(id) {
    for (var i = 0; i < $scope.routes.length; i++) {
      if($scope.routes[i].id == id) {
        $scope.routes.splice(i, 1);
        $scope.saveRoute({'delete':true});
      }
    };
  };

  /**
   * clearPersistent clear all localStorage objects
   */
  $scope.clearPersistent = function() {
    localStorage.clear();
  };

  /**
   * open Route
   * @param  int id route ID
   */
  $scope.openRoute = function(id) {
    // only allow to change the route if there is no gps tracking active
    if($scope.trackingIsActive()) {
      alert("Está a gravar uma rota, por favor termine a gravação para consultar outra");
      return false;
    }

    for (var i = 0; i < $scope.routes.length; i++) {
      if($scope.routes[i].id == id) {
        $scope.clearLayers();
        $scope.renderRoute($scope.routes[i]);
        return true;
      }
    };
  };

  // Fetch all objects from LocalStorage
  $scope.loadFromPersistent();

  // Set up the navigation bar
  steroids.view.navigationBar.show("Prototype");

});