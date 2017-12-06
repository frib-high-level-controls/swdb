/*
 * Gruntfile for SWDB processing
 *
*/


module.exports = function(grunt) {
  grunt.initConfig({
    // setup jshint
    jshint: {
      files: ["src/app/*.js", "src/app/lib/*.js", "src/apptest/*.js", "src/apptest/store/*.js", "public/swdb-fe/*.js",
      "public/swdb-fe/js/*.js"],
      options: {
        esversion: 6,
        node: true,
        globals: {
          jQuery: true
        }
      }
    },
    ts: {
      app: {
          tsconfig: {
             tsconfig: './src/app',
             passThrough: true,
          },
          // The additional flags specified below seems like it should be equivalent
          // to using the outDir option, but when the outDir option is used then the
          // Typescript compiler fails for find the source files (grunt-ts v5.5.1).
          //outDir: './app',
          options: {
              additionalFlags: '--outDir ./app --listEmittedFiles'
          },
      },
      apptest: {
          tsconfig: {
             tsconfig: './src/apptest',
             passThrough: true,
          },
          options: {
              additionalFlags: '--outDir ./test --listEmittedFiles'
          },
      },
  },
  clean: {
    app: [ './app' ],
    apptest: [ './test' ],
    public: [ './public/swdb-fe' ]
  },
  copy: {
    files: {
      cwd: 'src/public/swdb-fe',  // set working folder / root to copy
      src: '**/*',           // copy all files and subfolders
      dest: 'public/swdb-fe',    // destination folder
      expand: true           // required when using cwd
    }
  },
  shell: {
    publicSoftlink: {
      command: '[ -e ./test/public ] || ln -s ../public test'
    } 
  }

  });

  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-shell");
  grunt.registerTask("default", ["jshint"]);
  grunt.registerTask("build", ["ts:app","ts:apptest", "copy", "shell:publicSoftlink"]);
};
