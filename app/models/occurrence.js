// The contents of individual model .js files will be concatenated into dist/models.js

(function() {

// Protects views where angular is not loaded from errors
if ( typeof angular == 'undefined' ) {
	return;
};


var module = angular.module('OccurrenceModel', []);

// Uncomment below to use the Cordova SQLitePlugin instead of WebSQL.
// Be sure to set up the plugin at www/config.ios.xml or www/config.android.xml.
// You need to add the following platform-specific tag inside the <plugins> tag:
// - iOS: <plugin name="SQLitePlugin" value="SQLitePlugin" />
// - Android: <plugin name="SQLitePlugin" value="com.phonegap.plugin.sqlitePlugin.SQLitePlugin"/>
// 
// window.openDatabase = window.sqlitePlugin.openDatabase

module.factory('Occurrence', function() {

  // Create a new database at 5MB size if not found
  persistence.store.websql.config(persistence, 'steroidsdb', 'A database description', 5 * 1024 * 1024)

  // Define a new table
  Occurrence = persistence.define('Occurrence', {
    name: "TEXT",
    description: "TEXT"
  });

  persistence.schemaSync(function() {
    // alert("defined");
  });

  return Occurrence;
});


})();
