module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
    // setup jshint
    jshint: {
      files: ['src/app/*.js', 'src/app/lib/*.js', 'src/apptest/*.js', 'src/apptest/store/*.js', 'src/web/ts/*.js'],
      options: {
        esversion: 6,
        node: true,
        globals: {
          jQuery: true
        },
      },
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
      web: {
        tsconfig: {
          tsconfig: './src/web/ts',
          passThrough: true,
        },
        options: {
          additionalFlags: '--outDir ./public/js --listEmittedFiles'
        },
      },
      tools: {
        tsconfig: {
          tsconfig: './src/tools',
          passThrough: true,
        },
        options: {
          additionalFlags: '--outDir ./tools --listEmittedFiles'
        },
      },
    },
    tslint: {
      options: {
        configuration: 'tslint.json',
        // If set to true, tslint errors will be reported, but not fail the task 
        // If set to false, tslint errors will be reported, and the task will fail 
        force: false,
        fix: false
      },
      files: {
        src: [
          'src/**/*.ts'
        ]
      },
    },
    clean: {
      app: [ './app' ],
      test: [ './test/app', './test/apptest' ],
      tools: [ './tools' ],
      public: [ './public/js' ],
    },
    copy: {
      files: {
        cwd: 'src/web/ts',  // set working folder / root to copy
        src: '*.js',        // copy all files and subfolders
        dest: 'public/js',  // destination folder
        expand: true,       // required when using cwd
      },
    },
    shell: {
      publicSoftlink: {
        command: '[ -e ./test/public ] || ln -s ../public test',
      },
    },
  });

  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-tslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', [
    'ts:app',
    'ts:web',
    //'copy',
    'ts:tools',
  ]);

  grunt.registerTask('lint', [
    //'jshint',
    'tslint',
  ]);

  grunt.registerTask('build', [
    'ts:app',
    'ts:web',
    //'copy',
    'ts:apptest',
    //'shell:publicSoftlink',
  ]);
};
