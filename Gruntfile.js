/*
 * Gruntfile for SWDB processing
 * 
*/

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
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.registerTask("default", ["jshint"]);
};
