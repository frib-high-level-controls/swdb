Software Configuration Database (SCDB)
======================================

A single-page web application for managing software (and firmware) installations.

This application has been implemented using using [NodeJS](https://nodejs.org) (runtime),
[Express](https://expressjs.com/) (routing), [Pug](https://pugjs.org) (templating)
and [TypeScript](https://www.typescriptlang.org/) (language).

Quick Start
-----------
This application requires [NodeJS](https://nodejs.org/en/download/) (>= 8.11)
and [MongoDB](https://www.mongodb.com/download-center/community) (>= 3.2),
which can be obtained from the respective home pages or a package manager.

Then run the following commands from the root of the source directory:
```sh
# Obtain the build and runtime dependencies
npm ci
# Compile the application using TypeScript
npm run grunt clean build-all
# Start the application with an example configuration
./bin/app --config config/examplerc
```

Running the Tests
-----------------
API tests are run with the following commands (will start dedicated instance of MongoDB):
```sh
WEBAPP_START_MONGOD=true NODE_ENV=test npm run -- nyc-mocha -t 5000 test/apptest
```

Web tests use the [Selenium](https://www.seleniumhq.org/) framework and requires
the Chromium (v68) browser and Chromedriver WebDriver (v2.38). These are the
versions known to work at this time, other versions may work. Firefox is supported
by Selenium, but currently it is not tested for this application. These are most
easily obtained from the package manager on Debian (or Ubuntu) systems using the
following command:
```sh
sudo apt-get install chromium chromedriver
```

Run the web test using the following command:
```sh
WEBAPP_START_MONGOD=true NODE_ENV=test npm run -- nyc-mocha -t 5000 test/webtest
```
