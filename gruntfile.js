module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        ts: {
            app: {
                files: [{
                  src: ['src/app/\*\*/\*.ts', '!src/app/.baseDir.ts'],
                  dest: './app'
                }],
                tsconfig: 'src/app/tsconfig.json'
            },
            apptest: {
                outDir: './test',
                tsconfig: 'src/apptest/tsconfig.json'
            }
        },
        tslint: {
            options: {
                configuration: "tslint.json",
                // If set to true, tslint errors will be reported, but not fail the task 
                // If set to false, tslint errors will be reported, and the task will fail 
                force: false,
                fix: false
            },
            files: {
                src: [
                    "src/app/**/*.ts"
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-tslint");

    grunt.registerTask("default", [
        "ts"
    ]);
}
