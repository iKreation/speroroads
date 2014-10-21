/*
 * Application description
 * TODO
 */

document.addEventListener("deviceready", function() {
  angular.bootstrap(document, ['occurrenceApp']);
});

var occurrenceApp = angular.module('occurrenceApp',
                                  ['OccurrenceModel', 'hmTouchevents']);



occurrenceApp.controller('IndexCtrl', function ($scope, $http,Occurrence) {
  // Will rotate to every direction
  steroids.view.setAllowedRotations([0,180,-90,90]);

  // Route states
  $scope.currentRoutePosition = null;
  $scope.currentRoute = null;
  $scope.currentRouteWatcher = null;
  $scope.currentSubRoute = {'settings': []};
  $scope.currentOccurrence = null;
  $scope.currentCustomId = null;
  $scope.currentPriority = null;


  // Data structures for the application
  // this structures define the current
  // state of the application
  // it will be all saved in localStorage
  $scope.routes = [];
  $scope.currentOccurrences = [];
  $scope.currentMarker = null;
  $scope.currentPolyline = null;

  $scope.currentRouteSettings = {
                                'pavimento':null,
                                'bermas': null,
                                'largura_berma':null,
                                'nr_vias':null,
                                'largura_pavimento':null};

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

  // type of occurrences, check with backendnr_
  $scope.instances = {
    '11' : {'name' : 'Rodeiras',      'priority' : 1, 'watching' : false, 'points': [], 'watch_id': null},
    '12' : {'name' : 'Rodeiras',      'priority' : 2, 'watching' : false, 'points': [], 'watch_id': null},
    '13' : {'name' : 'Rodeiras',      'priority' : 3, 'watching' : false, 'points': [], 'watch_id': null},

    '21' : {'name' : 'Fendilhamento', 'priority' : 1, 'watching' : false, 'points': [], 'watch_id': null},
    '22' : {'name' : 'Fendilhamento', 'priority' : 2, 'watching' : false, 'points': [], 'watch_id': null},
    '23' : {'name' : 'Fendilhamento', 'priority' : 3, 'watching' : false, 'points': [], 'watch_id': null},

    '31' : {'name' : 'Peladas etc',   'priority' : 1, 'watching' : false, 'points': [], 'watch_id': null},
    '32' : {'name' : 'Peladas etc',   'priority' : 2, 'watching' : false, 'points': [], 'watch_id': null},
    '33' : {'name' : 'Peladas etc',   'priority' : 3, 'watching' : false, 'points': [], 'watch_id': null},

    '41' : {'name' : 'Covas',         'priority' : 1, 'watching' : false, 'points': [], 'watch_id': null},
    '42' : {'name' : 'Covas',         'priority' : 2, 'watching' : false, 'points': [], 'watch_id': null},
    '43' : {'name' : 'Covas',         'priority' : 3, 'watching' : false, 'points': [], 'watch_id': null},

    '51' : {'name' : 'Reparações',    'priority' : 1, 'watching' : false, 'points': [], 'watch_id': null},
    '52' : {'name' : 'Reparações',    'priority' : 2, 'watching' : false, 'points': [], 'watch_id': null},
    '53' : {'name' : 'Reparações',    'priority' : 3, 'watching' : false, 'points': [], 'watch_id': null},

    '61' : {'name' : 'Tampas Saneamento',      'priority' : null, 'watching' : false, 'points': [], 'watch_id': null},
    '62' : {'name' : 'Grelhas de sumidouros',  'priority' : null, 'watching' : false, 'points': [], 'watch_id': null},
    '63' : {'name' : 'Passadeiras',            'priority' : null, 'watching' : false, 'points': [], 'watch_id': null},
    '64' : {'name' : null,                     'priority' : null, 'watching' : false, 'points': [], 'watch_id': null}
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
      /*Complete image path*/
      var imagePath = targetDirURI+"/"+fileName;

      var photo = {'file': imagePath, 'position': $scope.currentRoutePosition};

      $scope.currentOccurrence['photos'].push(photo);

      for(var i = 0; i< $scope.currentOccurrences.length; i++){
        if($scope.currentOccurrences[i].id == $scope.currentOccurrence.id){
          $scope.currentOccurrences[i].nr_photos +=1;
          $scope.$apply();
        }
      }


      return window.resolveLocalFileSystemURI(targetDirURI, function(directory) {
        return file.moveTo(directory, fileName, fileMoved, $scope.fileError);
      }, $scope.fileError);
    });
    return fileMoved = function(file) {


      alert("Foto associada a patologia.");

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

    if($scope.currentRoute) {
      if ($scope.trackingIsActive()) {

        var watching = false;
        var occurrences = $scope.instances;

        for (var i in occurrences) {

          if(occurrences[i].watching == true) {
            watching = true;
            break;
          }
        }

        if (watching == false) {
          alert("Terminou a rota");
          // if it's watching something, stops
          button.removeClass('topcoat-button--large--cta--record');
          button.addClass('topcoat-button--large--cta--new');
          $scope.stopRoute();

        } else {
            alert("Termine o registo das ocurrencias antes de terminar a rota");
        }
      }

      else {
        var emptySetting=false;

        for(var s in $scope.currentRouteSettings){

          if (!$scope.currentRouteSettings[s]) {
            emptySetting = true;
            break;
          }
        }

        if (!$scope.currentRouteSettings){
          emptySetting = true;
        }

        if(emptySetting==false) {

          button.removeClass('topcoat-button--large--cta--new');
          button.addClass('topcoat-button--large--cta--record');
          $scope.startRoute(null, false);
        } else{
          alert("Por favor defina todas as caracteristicas da via primeiro");
        }
    }
  }
  else {
    alert("Crie ou seleccione uma nova rota para iniciar o levantamento.");
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
  $scope.startRoute = function($event, isSubRoute) {
    // gets the current selected route
    var route = $scope.getCurrentRoute();

    if(!$scope.trackingIsActive() || isSubRoute) {
      // starts the watcher
      if(isSubRoute) {
        alert("nova subrota");
      } else {
        alert("nova rota a gravar");
      }

      var options = { timeout: 30000, enableHighAccuracy: true };

      // when starting a route, first sub route is the next element of the array
      route.subRoutes.push({'settings' : $scope.currentRouteSettings});
      var lastIndex = route.subRoutes.length - 1;


      route.subRoutes[lastIndex]['position'] = [];
      navigator.geolocation.clearWatch($scope.currentRouteWatcher);

      $scope.currentRouteWatcher = navigator.geolocation.watchPosition(
        function(position) {
          route.subRoutes[lastIndex]['position'].push(position);
        },
        function(error) {
          alert("erro a gravar a rota");
        },
      options);
    } else {
      alert("Erro - Tem uma rota ativa");
    }
  };


  $scope.cleanRequestObject = function(obj) {
    delete obj['$$hashKey'];

    for (var occ in obj['occurrences']) {
      delete obj['occurrences'][occ]['$$hashKey'];
    }

    return obj;
  }


  $scope.syncPhotos = function(file,id,pos) {

    //var test = "file://localhost/images/Control-Panel.png";

    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = "photo.jpeg";
    options.mimeType = "image/jpeg";

    var params = {};
    params.occ_id = id;
    params.route_id = $scope.getCurrentRoute()._id;
    params.pos = pos;

    options.params = params;

  

    var ft = new FileTransfer();

    ft.upload(file, encodeURI("http://radiant-bayou-7646.herokuapp.com/upload/0/"),
    function(r) {
      alert("Photos uploaded");
      console.log("Code = " + r.responseCode);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
    },
    function (error) {
      alert("Photo upload failed");
      alert("An error has occurred: Code = " + error.code);
      console.log("upload error source " + error.source);
      console.log("upload error target " + error.target);
    }, options);
  };

  $scope.syncWithServer = function() {

    var route = $scope.getCurrentRoute();
    var newID;

    var toSend = $scope.cleanRequestObject(route);

    console.log(toSend);

    $.post( "http://radiant-bayou-7646.herokuapp.com/speroroadapp/0/", { route: JSON.stringify(toSend) }, function( data ) {
      console.log("Data " + JSON.stringify(data));
      if (data.success) {
        alert("Route synced with server");
        $scope.getCurrentRoute()._id = data.route_id;
        newID = data.route_id;
        console.log(JSON.stringify($scope.routes));

        for (var i in $scope.routes) {

          if($scope.routes[i]._id == newID){

            var occurrences = $scope.routes[i].occurrences;

            for (var j in occurrences) {

              for(var ph in occurrences[j].photos){
                var file = occurrences[j].photos[ph].file;
                var pos = occurrences[j].photos[ph].position;
                $scope.syncPhotos(file,occurrences[j].id,pos);
              }
            }
          }
        }
      }
      else{
        alert("Sync Failed");
      }
    }, "json");  
  };

  $scope.startCustomRoute = function($event) {

    var priority = $event.target.attributes.rel.value;
    var button;

    $scope.instances[$scope.currentCustomId].priority = priority;

    if ($scope.currentRoute) {

      var id = $scope.currentCustomId;

      $scope.saveSingleOccurrence(id);
    }

    else {
      alert('You need to select or create a new route to add occurrences.');
    }

    $scope.custom_settings_visibility = false;

  }


  $scope.newOcurrenceName = function($event) {

    var id = $event.target.attributes.rel.value;

    $scope.currentCustomId = id;

    if(!$scope.instances[id].watching) {

      if($scope.trackingIsActive()) {

        $scope.new_name_visibility = true;
      }

      else {
        alert("Tem que ter a rota iniciada para registar ocorrências.");
      }
    }
  }


  $scope.triggerCustomOccurrenceSettings = function($event) {


    var button;
    var id;

    id = $event.target.attributes.rel.value;


    if (id == 0) {
      id = 64;    
    }

    $scope.currentCustomId = id;



    if (id == 64) {
      $scope.instances[id].name = document.getElementById("occurrenceName").value;
    }

    if(!$scope.instances[id].watching) {


      if($scope.trackingIsActive()) {


        $scope.custom_settings_visibility = true;
        $scope.new_name_visibility = false;

      }

      else {

        alert("Tem que ter a rota iniciada para registar ocorrências.");

      }
    }
  }

  $scope.cancelNewNameOccurrence = function($event){

    $scope.new_name_visibility = false;
  }

  $scope.cancelCustomOccurrence = function($event) {

    $scope.custom_settings_visibility = false;
  }

  /**
   * triggerRoadSettings shows the form for road settings changes
   * @param  Object $event
   */
  $scope.triggerRoadSettings = function($event) {

    $scope.route_settings_visibility = true;
  };


  $scope.closeRoadSettings = function($event) {
    // set the previous values
    $scope.route_settings_visibility = false;
  };


  /**
   * changeRoadSettings update the settings value of Road
   * @param  Object $event
   */
  $scope.changeRoadSettings = function($event) {
    /*working, this really update things*/

    alert('Características da via alteradas');

    $scope.settings_pav;
    $scope.settings_bermas;
    $scope.settings_largura_berma;
    $scope.settings_nrvias;
    $scope.settings_largura_pavimento;

    var routeSettings = [$scope.settings_pav,
                        $scope.settings_bermas,
                        $scope.settings_largura_berma,
                        $scope.settings_nrvias,
                        $scope.settings_largura_pavimento];

    $scope.currentRouteSettings['pavimento'] = routeSettings[0];
    $scope.currentRouteSettings['bermas'] = routeSettings[1];
    $scope.currentRouteSettings['largura_berma'] = routeSettings[2];
    $scope.currentRouteSettings['nr_vias'] = routeSettings[3];
    $scope.currentRouteSettings['largura_pavimento'] = routeSettings[4];


    $scope.closeRoadSettings($event);

    if ($scope.currentRouteWatcher) {
      $scope.startRoute(null, true);
    }
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


    var type;

    if ($scope.instances[id].priority == 1) {

      type = ' - Tipo 1';

    }

    else if ($scope.instances[id].priority == 2) {
      type = ' - Tipo 2';
    }

    else {

      type = ' - Tipo 3';

    }


    // save the occurrence
    $scope.addOccurrence({
      id : new Date().getTime(),
      instance_id : id,
      position : null,
      path : [],
      photos: [],
      name: $scope.instances[id].name + " " + type,
      nr_photos: 0,
      priority: $scope.instances[id].priority,
      createddate : new Date(),
      type: 'path'
    });



    $scope.instances[id].watch_id = navigator.geolocation.watchPosition(
      function(position) {
        // remove the last one
        $scope.clearLayers();
        var pos = [position.coords.latitude, position.coords.longitude];
        $scope.currentRoutePosition = pos;
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

   for(var i = 0; i< $scope.currentOccurrences.length; i++){
      if($scope.currentOccurrences[i].instance_id == id){
        $scope.currentOccurrences[i].path = path;
      }
    }

    
    /* refresh */
    $scope.$apply();


    var lineColor;

    if ($scope.instances[id].priority==1) {
      lineColor='yellow';
    }
    else if($scope.instances[id].priority==2){
      lineColor='orange';
    }
    else{
      lineColor='red';
    }

    $scope.currentPolyline = L.polyline(path, {color: lineColor}).addTo(map);
    // zoom the map to the polyline
    map.fitBounds($scope.currentPolyline.getBounds());
    // clear points
    $scope.instances[id].points = [];
    // stop watching
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
          if ($scope.instances[id].priority==1) {
            button.removeClass('topcoat-button--large--cta--yellow');
          }
          else if($scope.instances[id].priority==2){
            button.removeClass('topcoat-button--large--cta--orange');
          }
          else{
            button.removeClass('topcoat-button--large--cta--red');
          }

          button.addClass('topcoat-button--large');

          $scope.stopsAndSavePathOccurrence(id);
        } else {
            button.removeClass('topcoat-button--large');

            if ($scope.instances[id].priority==1) {
              button.addClass('topcoat-button--large--cta--yellow');
            }
            else if($scope.instances[id].priority==2){
              button.addClass('topcoat-button--large--cta--orange');
            }
            else{
              button.addClass('topcoat-button--large--cta--red');
            }
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
  $scope.saveSingleOccurrence = function(id) {
    if($scope.trackingIsActive()) {
      if ($scope.currentRoute) {
        navigator.geolocation.getCurrentPosition(function(position) {
          // clear markers if they exist
          $scope.clearLayers();

          var pos = [position.coords.latitude, position.coords.longitude];
          /* create layer to easily remove marker */



          var type;


          if ($scope.instances[id].priority == 1) {

            type = ' - Tipo 1';
            //$scope.currentMarker = L.marker(pos,map,{icon:'localhost/images/yellow_Marker.png'}).addTo(map);


          }

          else if ($scope.instances[id].priority == 2) {
            type = ' - Tipo 2';
            //$scope.currentMarker = L.marker(pos,map,'/images/orange_Marker.png').addTo(map);

          }

          else {

            type = ' - Tipo 3';
            //$scope.currentMarker = L.marker(pos,map,'/images/red_Marker.png').addTo(map);
          }

          //$scope.occ.push(occurrence);
          $scope.addOccurrence({
            id : new Date().getTime(),
            instance_id : id,
            position : position,
            path : null,
            photos: [],
            nr_photos: 0,
            priority: $scope.instances[id].priority,
            name: $scope.instances[id].name + " " + type,
            createddate : new Date(),
            type: 'single',
          });

          /* refresh */
          $scope.$apply();
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


  $scope.routeName = function($event) {

    $scope.custom_route_visibility = true;

  }

  $scope.cancelNewRoute = function($event) {

    $scope.custom_route_visibility = false;
  }



  /**
   * newRoute creates add's a new route to the current state of the app
   * @return void
   */
  $scope.newRoute = function(routeName) {

    $scope.custom_route_visibility = false;

    var newRouteName = document.getElementById("routeName").value;

    var dt = new Date();
    var route_id = dt;
    var buildDate = dt.getDate() + '/' + dt.getMonth() + '/' + dt.getFullYear() + ' ' + dt.getHours()  + ':' + dt.getMinutes();
    if(newRouteName == "") {
      newRouteName = buildDate;
    }
    
    var route = {
      id: dt.getTime(),
      name: newRouteName,
      date: buildDate,
      subRoutes : [],
      occurrences: [],
      options: {}
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
  $scope.openOccurrence = function($event,id) {

    $scope.clearLayers();

    // find it

    var selectedOccurrence = angular.element($event.target);

    selectedOccurrence.parent().children().removeClass('topcoat-list__item__selected');

    selectedOccurrence.addClass('topcoat-list__item__selected');

   


    for(var o in $scope.currentOccurrences) {
      if(parseInt($scope.currentOccurrences[o].id) == parseInt(id)) {

        $scope.currentOccurrence = $scope.currentOccurrences[o];

        var lineColor;

        if ($scope.currentOccurrence.priority==1) {
          lineColor='yellow';
        }
        else if($scope.currentOccurrence.priority==2){
          lineColor='orange';
        }
        else{
          lineColor='red';
        }


        // check the type
        if($scope.currentOccurrences[o].type == 'single') {
          pos = $scope.currentOccurrences[o].position;
          $scope.currentMarker = L.marker([pos.coords.latitude,
                                          pos.coords.longitude]).addTo(map);
          map.fitBounds([[pos.coords.latitude, pos.coords.longitude]]);
        } else {

          var path = $scope.currentOccurrences[o].path;
          $scope.currentPolyline = L.polyline(path, {color: lineColor}).addTo(map);
          // zoom the map to the polyline
          map.fitBounds($scope.currentPolyline.getBounds());
        }
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

  $scope.getPhoto = function(source) {

    alert("getPhoto");
    // Retrieve image file location from specified source
    navigator.camera.getPicture($scope.onPhotoURISuccess, $scope.onFail, { quality: 50, 
      destinationType: destinationType.FILE_URI,
      sourceType: source });
  }


  // Called if something bad happens.
  // 
  $scope.onFail = function(message) {
    alert('Failed because: ' + message);
  }

  // Called when a photo is successfully retrieved
  //
  $scope.onPhotoURISuccess = function(imageData) {
    // Uncomment to view the base64 encoded image data
    // console.log(imageData);
    $("#photosDiv").append("<img src='"+imageData+"' style='display:block';'width:100%;'");
    alert("photoAdded");
  }

  $scope.openRoute = function($event,id) {
    // only allow to change the route if there is no gps tracking active

    if($scope.trackingIsActive()) {
      alert("Está a gravar uma rota, por favor termine a gravação para consultar outra");
      return false;
    }

    var selectedRoute = angular.element($event.target);

    selectedRoute.parent().children().removeClass('topcoat-list__item__selected');
    selectedRoute.addClass('topcoat-list__item__selected');

    var route = $scope.getCurrentRoute();

    $("#photosDiv").html("");

    for(var occ in route.occurrences){
      for(var ph in route.occurrences[occ].photos){
        $scope.getPhoto(route.occurrences[occ].photos[ph].file);
      }
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

  var leftButton = new steroids.buttons.NavigationBarButton();
  leftButton.title = "Foto";
  leftButton.onTap = function() {
    if($scope.currentOccurrence) {
      $scope.takePicture();
    } else {
      alert("Por favor seleccione uma patologia primeiro");
    }
  };

  var syncButton = new steroids.buttons.NavigationBarButton();
  syncButton.title = "Sync";
  syncButton.onTap = function() {

    if($scope.getCurrentRoute() != false) {

      if(!$scope.trackingIsActive()){
        $scope.syncWithServer();
      }
      else {
        alert("Por favor termine a rota antes de sincronizar");
      }
    } else {
      alert("Por favor seleccione uma rota primeiro");
    }
  };

  steroids.view.navigationBar.setButtons({
    right: [syncButton],
    left: [leftButton],

    overrideBackButton: true
  }, {
    onSuccess: function() {
      //
    },
    onFailure: function() {
      alert("Failed to set buttons.");
    }
  });
});