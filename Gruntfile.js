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
    clean: {
      app: [ './app' ],
      test: [ './test' ],
    },
  });

  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-tslint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('save_version_file', 'Save version information to app/verison.json', function () {
    var pkg = grunt.file.readJSON('package.json');
    var gitCommitCmd = {cmd:'git', args:['rev-parse', 'HEAD']};
    var gitVersionCmd = {cmd:'git', args:['describe', '--match', 'v[0-9]*', '--always', '--dirty', '--long']};
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
    var gitVersionCmd = {cmd:'git', args:['describe', '--match', 'v[0-9]*', '--always', '--dirty', '--exact-match']};
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
  ]);

  grunt.registerTask('build-tests', [
    'ts:apptest',
  ]);

  grunt.registerTask('build-all', [
    'build',
    'build-tests',
  ]);

  grunt.registerTask('deploy', [
    'clean',
    'ensure_version_tag',
    'build',
  ]);

  grunt.registerTask('lint', [
    'tslint',
  ]);
};
