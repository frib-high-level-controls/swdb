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
        ],
      },
    },
    clean: {
      app: [ './app' ],
      test: [ './test/app', './test/apptest' ],
      tools: [ './tools' ],
      public: [ './public/js' ],
    },
  });

  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-tslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('save_version_file', 'Save version information to app/verison.json', function () {
    var pkg = grunt.file.readJSON('package.json');
    var gitCommitCmd = {cmd:'git', args:['rev-parse', 'HEAD']};
    var gitVersionCmd = {cmd:'git', args:['describe', '--long', '--always', '--dirty']};
    var template = '<%= pkg_version %> (Build Date: <%= build_date %>, Commit: <%= git_commit.substring(0,7) %>)';
    var done = this.async();

    grunt.util.spawn(gitCommitCmd, function (err1, gitCommit) {
      if (err1) { done(err1); return; }

      grunt.util.spawn(gitVersionCmd, function (err2, gitVersion) {
        if (err2) { done(err2); return; }

        var data = {
          name: String(pkg.name),
          git_commit: String(gitCommit),
          git_version: String(gitVersion),
          pkg_version: String(pkg.version),
          build_date: new Date().toISOString(),
        };
        data.version = grunt.template.process(template, { data: data });
        grunt.file.write('app/version.json', JSON.stringify(data, null, 4));
        done();
      });
    });
  });

  grunt.registerTask('ensure_version_tag', 'Ensure package version and git tag match', function () {
    var pkg = grunt.file.readJSON('package.json');
    var gitVersionCmd = {cmd:'git', args:['describe', '--always', '--dirty']};
    var done = this.async();

    grunt.util.spawn(gitVersionCmd, function (err, gitVersion) {
      if (err) { done(err); return; }

      var pkg_version = 'v' + pkg.version;
      var git_version = String(gitVersion);
      if (pkg_version !== git_version) {
        grunt.warn('Package version (' + pkg_version + ') does not match Git version (' + git_version + ')');
        return;
      }
      done();
    });
  });

  grunt.registerTask('default', [
    'build',
  ]);

  grunt.registerTask('build', [
    'save_version_file',
    'ts:app',
    'ts:web',
    'ts:tools',
    'ts:apptest',
  ]);

  grunt.registerTask('deploy', [
    'clean',
    'ensure_version_tag',
    'build',
  ]);

  grunt.registerTask('lint', [
    //'jshint',
   'tslint',
  ]);
};
