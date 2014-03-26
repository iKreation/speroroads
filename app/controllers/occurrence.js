// Since we are using the Cordova SQLite plugin, initialize AngularJS only after deviceready
document.addEventListener("deviceready", function() {
  angular.bootstrap(document, ['occurrenceApp']);
});

var occurrenceApp = angular.module('occurrenceApp', ['OccurrenceModel', 'hmTouchevents']);

occurrenceApp.controller('IndexCtrl', function ($scope, Occurrence) {
  // Will rotate to every direction
  steroids.view.setAllowedRotations([0,180,-90,90]);  
  
  // Current selected route
  $scope.currentRoute = null;

  // Populated by $scope.loadFromPersistence
  $scope.routes = [];

  // individual occ
  //$scope.occ = []; 

  $scope.currentMarker = null;
  $scope.currentPolyline = null;
  // instances state array
  $scope.instances = {
    '11' : {'name' : 'Rodeiras - Tipo 1'},
    '12' : {'name' : 'Rodeiras - Tipo 2', 'watching' : false, 'points': [], 'watch_id': null},
    '13' : {'name' : 'Rodeiras - Tipo 3'},
    '21' : {'name' : 'Fendilhamento - Tipo 1'},
    '22' : {'name' : 'Fendilhamento - Tipo 2'},
    '23' : {'name' : 'Fendilhamento - Tipo 3'},
    '31' : {'name' : 'Peladas etc - Tipo 1'},
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

  // START AND STOP EVENT HANDLERS
  $scope.startRoad = function($event) {

    if ($scope.currentRoute != null) {
      var id = $event.target.innerHTML;

      // if it's watching something stops
      if($scope.instances[id].watching) {

        $scope.clearLayers();

        //$event.target.attr('class','topcoat-button--large speroroads-bottom');

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
        var occurrence = {
          id : event.target.innerHTML,
          position : null,
          path : path,
          createddate : new Date(),
          type: 'path'
        }

        $scope.routes[$scope.currentRoute].push(occurrence);

        /* refresh */ 
        $scope.$apply();

        $scope.currentPolyline = L.polyline(path, {color: 'red'}).addTo(map);
        // zoom the map to the polyline
        map.fitBounds($scope.currentPolyline.getBounds());
        // clear points  
        $scope.instances[id].points = [];
        // stop watching 
        steroids.view.navigationBar.show("Speroroads :: Gravado " + $scope.instances[id].name);

      } else {
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
        steroids.view.navigationBar.show("Speroroads :: Localizando...");
      }
    } else {
      alert('You need to select or create a new route to add occurrences.');
    }
  };

  /* SAVE OCCURRENCES LIST TO OPEN ROUTE */
  $scope.saveRoute = function($event) {
    $scope.currentRoute = null;
    
    /* Clean occurrences */
    // TO BE DELETED
    //$scope.clearOccurrences();

    $scope.apply();
  };

  /* SINGLE POINT INSTANCE */ 

  $scope.save = function($event) {
    if ($scope.currentRoute != null) {
      navigator.geolocation.getCurrentPosition(function(position) {  
        // clear markers if they exist
        $scope.clearLayers();

        var occurrence = {
          id : $event.target.attributes.rel.value,
          position : position,
          path : null,
          createddate : new Date(),
          type: 'single'
        }

        var pos = [position.coords.latitude, position.coords.longitude];
        /* create layer to easily remove marker */
        $scope.currentMarker = L.marker(pos).addTo(map);

        //$scope.occ.push(occurrence);
        $scope.routes[$scope.currentRoute].push(occurrence);

        /* refresh */ 
        $scope.$apply();
        steroids.view.navigationBar.show("Speroroads :: Gravado " + $scope.instances[$event.target.innerHTML].name);
      }, 
      function(error) {
        alert(error);
      });
    } else {
      alert("You need to select or create a new route to add occurrences.");
    }
  };

  $scope.newRoute = function() {
    //alert("Trying to creates a route!");

    var route_id = $scope.routes.length + 1;

    var route = {
      id: route_id,
      name: "Name #"+route_id,
      occurrences: []
    }

    $scope.routes.push(route);

    /* MADNESS */
    /* TO DELETE AND UPDATE */
    $scope.currentRoute = $scope.routes.length-1;

    $scope.apply();
    alert("New route created!");
  };

  $scope.openOccurrence = function(id) {
    
    $scope.clearLayers();

    // find it 
    for(var o in $scope.occ) {
      if(parseInt($scope.occ[o].id) == parseInt(id)) {
        // check the type
        if($scope.occ[o].type == 'single') {
          pos = $scope.occ[o].position;
          $scope.currentMarker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map);
          map.fitBounds([[pos.coords.latitude, pos.coords.longitude]]);
        } else {

          var path = $scope.occ[o].path;
          
          $scope.currentPolyline = L.polyline(path, {color: 'red'}).addTo(map);
          // zoom the map to the polyline
          map.fitBounds($scope.currentPolyline.getBounds());

        }
        steroids.view.navigationBar.show("Speroroads :: Vendo " + $scope.instances[$scope.occ[o].id].name);
      }
    }
  };

  /* SAVE CURRENT STATE */ 
  $scope.saveToPersistent = function(id) {
    localStorage.setItem('routes', $scope.occ);
  };

  $scope.loadFromPersistent = function(id) {
    $scope.routes = localStorage.getItem('routes');
    if ($scope.routes == null) {
      $scope.routes = [];
    }
    $scope.$apply();
  };

  $scope.restartState = function() {
    //
  };

  /* Clear Occurrences */
  /* TO BE DELETED */
  /*
  $scope.clearOccurrences = function() {
    $scope.occ.length = 0;
    $scope.occ = [];
  },*/

  $scope.clearPersistent = function() {
    localStorage.clear();
  };

  // Helper function for opening new webviews
  $scope.open = function(id) {
    webView = new steroids.views.WebView("/views/occurrence/show.html?id="+id);
    steroids.layers.push(webView);
  };

  /* START AND STOP EVENT HANDLERS */ 

  /*$scope.loadOccurrences = function() {
    $scope.loading = true;

    persistence.clean();  // Clean persistence.js cache before making a query

    // Persistence.js query for all occurrences in the database
    Occurrence.all().list(function(occurrences) {
      $scope.occurrences = occurrences;
      $scope.loading = false;
      $scope.$apply();
    });
  };*/

  // Fetch all objects from the backend (see app/models/occurrence.js)
  //$scope.loadOccurrences();
  
  // Fetch all objects from LocalStorage
  $scope.loadFromPersistent();

  // Get notified when an another webview modifies the data and reload
  window.addEventListener("message", function(event) {
    // reload data on message with reload status
    if (event.data.status === "reload") {
      //$scope.loadOccurrences();
      $scope.loadFromPersistent();
    };
  });

  // -- Native navigation

  // Set up the navigation bar
  steroids.view.navigationBar.show("Prototype");

  // Define a button for adding a new occurrence
  var addButton = new steroids.buttons.NavigationBarButton();
  addButton.title = "Add";

  // Set a callback for the button's tap action...
  addButton.onTap = function() {
    var addView = new steroids.views.WebView("/views/occurrence/new.html");
    steroids.modal.show(addView);
  };

  // ...and finally show it on the navigation bar.
  steroids.view.navigationBar.setButtons({
    right: [addButton]
  });

});


// Show: http://localhost/views/occurrence/show.html?id=<id>

occurrenceApp.controller('ShowCtrl', function ($scope, Occurrence) {

  // Helper function for loading occurrence data with spinner
  $scope.loadOccurrence = function() {
    $scope.loading = true;

    persistence.clean(); // Clean persistence.js cache before making a query

    // Fetch a single object from the database
    Occurrence.findBy(persistence, 'id', steroids.view.params.id, function(occurrence) {
      $scope.occurrence = occurrence;
      $scope.loading = false;
      steroids.view.navigationBar.show(occurrence.name);
      $scope.$apply();
    });

  };

  // Save current occurrence id to localStorage (edit.html gets it from there)
  localStorage.setItem("currentOccurrenceId", steroids.view.params.id);

  var occurrence = new Occurrence()
  $scope.loadOccurrence()

  // When the data is modified in the edit.html, get notified and update (edit will be on top of this view)
  window.addEventListener("message", function(event) {
    if (event.data.status === "reload") {
      $scope.loadOccurrence();
    };
  });

  // -- Native navigation
  var editButton = new steroids.buttons.NavigationBarButton();
  editButton.title = "Edit";

  editButton.onTap = function() {
    webView = new steroids.views.WebView("/views/occurrence/edit.html");
    steroids.modal.show(webView);
  }

  /*steroids.view.navigationBar.setButtons({
    right: [editButton]
  });*/
});


// New: http://localhost/views/occurrence/new.html

/*occurrenceApp.controller('NewCtrl', function ($scope, Occurrence) {

  $scope.startOccurrence = function($event) {
    $event.classList.remove("topcoat-button");
    $event.classList.add("topcoat-button--cta");
    console.log($event.target.innerHTML);
    console.log($event.target.innerHTML);
  };

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.create = function(options) {
    $scope.loading = true;

    var occurrence = new Occurrence(options);

    // Add the new object to the database and then persist it with persistence.flush()
    persistence.add(occurrence);
    persistence.flush(function() {

      // Notify index.html to reload data
      var msg = { status: 'reload' };
      window.postMessage(msg, "*");

      $scope.close();
      $scope.loading = false;

    }, function() {
      $scope.loading = false;

      alert("Error when creating the object, is SQLite configured correctly?");

    });
  }
  $scope.occurrence = {};
});
*/

// Edit: http://localhost/views/occurrence/edit.html

occurrenceApp.controller('EditCtrl', function ($scope, Occurrence) {

  $scope.close = function() {
    steroids.modal.hide();
  };

  $scope.update = function(options) {
    $scope.loading = true;

    var occurrence = new Occurrence(options);

    // Update the database by adding the updated object, then persist the change with persistence.flush()
    persistence.add(occurrence);
    persistence.flush(function() {

      window.setTimeout(function(){
        // Notify show.html below to reload data
        var msg = { status: "reload" };
        window.postMessage(msg, "*");
        $scope.close();
      }, 1000);

      $scope.loading = false;

    });

  };

  // Helper function for loading occurrence data with spinner
  $scope.loadOccurrence = function() {
    $scope.loading = true;

    var id  = localStorage.getItem("currentOccurrenceId");

    // Fetch a single object from the database
    Occurrence.findBy(persistence, 'id', id, function(occurrence) {
      $scope.occurrence = occurrence;
      $scope.loading = false;

      $scope.$apply();
    });
  };

  $scope.loadOccurrence();

});