// Since we are using the Cordova SQLite plugin, initialize AngularJS only after deviceready
document.addEventListener("deviceready", function() {
  angular.bootstrap(document, ['occurrenceApp']);
});

var occurrenceApp = angular.module('occurrenceApp', ['OccurrenceModel', 'hmTouchevents']);

// Index: http://localhost/views/occurrence/index.html
occurrenceApp.controller('IndexCtrl', function ($scope, Occurrence) {
  steroids.view.setAllowedRotations([0,180,-90,90]);  // Will rotate to every direction

  // Populated by $scope.loadOccurrences
  $scope.occurrences = [];

  // Helper function for opening new webviews
  $scope.open = function(id) {
    webView = new steroids.views.WebView("/views/occurrence/show.html?id="+id);
    steroids.layers.push(webView);
  };

  $scope.loadOccurrences = function() {
    $scope.loading = true;

    persistence.clean();  // Clean persistence.js cache before making a query

    // Persistence.js query for all occurrences in the database
    Occurrence.all().list(function(occurrences) {
      $scope.occurrences = occurrences;
      $scope.loading = false;
      $scope.$apply();
    });
  };

  // Fetch all objects from the backend (see app/models/occurrence.js)
  $scope.loadOccurrences();

  // Get notified when an another webview modifies the data and reload
  window.addEventListener("message", function(event) {
    // reload data on message with reload status
    if (event.data.status === "reload") {
      $scope.loadOccurrences();
    };
  });

  // -- Native navigation

  // Set up the navigation bar
  steroids.view.navigationBar.show("Occurrence index");

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

  steroids.view.navigationBar.setButtons({
    right: [editButton]
  });


});


// New: http://localhost/views/occurrence/new.html

occurrenceApp.controller('NewCtrl', function ($scope, Occurrence) {

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