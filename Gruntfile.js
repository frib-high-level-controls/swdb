/*
 * Gruntfile for SWDB processing
 *
*/
const fs = require('fs');
const props = JSON.parse(fs.readFileSync('./config/properties.json', 'utf8'));

// prep the bootstrap string
var port = props.restPort;
var str = "http://localhost:"+port+"/swdbserv/v1/config";


module.exports = function(grunt) {
  grunt.initConfig({
    // setup jshint
    jshint: {
      files: ["*.js", "lib/*.js", "test/*.js", "public/swdb-fe/*.js",
      "public/swdb-fe/js/*.js"],
      options: {
        esversion: 6,
        node: true,
        globals: {
          jQuery: true
        }
      }
    },
    replace: {
      // look throug controllers.js and insert bootstrap location for properties
      bootstrap: {
        src: ['public/swdb-fe/js/controllers.js'],
        overwrite: true,
        replacements: [{
          from: /http:\/\/localhost:[0-9]{2,4}\/swdbserv\/v1\/config/g,
          to: str
        },
          {
          from: '%runGruntBootstrapString%',  // string replacement
          to: str
        }]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-text-replace");
  grunt.registerTask("default", ["jshint"]);
};
