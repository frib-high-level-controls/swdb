module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
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
          additionalFlags: '--outDir ./app'
        },
      },
      apptest: {
        tsconfig: {
          tsconfig: './src/apptest',
          passThrough: true,
        },
        options: {
          additionalFlags: '--outDir ./test'
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
          ],
        },
      },
      copy: {
        pkg: {
          files: [{
            expand: true,
            src: 'package.json',
            dest: 'app/'
          }],
        }
      },
      clean: {
        app: [ './app' ],
        test: [ './test' ],
      }
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', [
      'build',
    ]);

    grunt.registerTask('build', [
      'ts:app',
      'copy:pkg',
    ]);

    grunt.registerTask('deploy', [
      'clean',
      'build',
    ]);

    grunt.registerTask('lint', [
      'tslint',
    ]);
};
