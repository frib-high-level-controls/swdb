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
            }
        }
    });

    grunt.loadNpmTasks("grunt-ts");

    grunt.registerTask("default", [
        "ts"
    ]);
}
