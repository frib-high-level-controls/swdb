# SWDB
This ia a prototype web application for storing meta-information on software.
#Installation Overview
This install has been tested on Debin Jessie.
To start with, make sure you have Node.js, MongoDB, Git, sudo, and curl. 
Have your working mongodb location and credentials handy.
```sh
sudo apt-get install curl sudo git mongodb
sudo npm install -g bower
```
``` sh
#Get Node
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

# SWDB Installation
``` bash
# install swdb
git clone https://github.com/rellis6022/swdb
cd swdb
npm install
npm run make
```

# Unit/API Test Setup
SWDB has two outer FRIB system it depends on. 1) CAS - the suthentication system and 2) FORG
the FRIB organizational service.

At this time the CAS service can be tuned off for development and testing. To do this
add "--test.testing: true" to mocha calls or configure the same in swdbrc. 
FORG cannot be detached at this time, and remote testing can be accomplshed using 
an ssh tunnel.
``` sh
ssh -L 8081:forg-dev.nscl.msu.edu:443 username@nsclgw1.nscl.msu.edu
```
And matching the local host:port in swdbrc configuration item auth.forgapi.url.
``` sh
# setup for tests
sudo npm install -g mocha
sudo npm install -g chai
npm install selenium-webdriver
```

# Web Tests (Selenium)
```sh
# Setting up for Chrome tests
# install Chrome
#install the selenium chromewdriver
# Get it here http://chromedriver.storage.googleapis.com/index.html
# It can go anywhere on your PATH. (I used /opt/chromedriver)
# The Node/selenium-webdriver/chromedriver trifecta can be a struggle
#  This is known to work:
#  Node 6.9.1
#  selenium-webdriver 3.0.1
#  chromedriver 2.25.426924

# Setting up firefox tests
# install Firefox (I used a newer version than debian's firefox-esr)
# Install Geckodriver (I used 
 https://github.com/mozilla/geckodriver/releases/download/v0.13.0/geckodriver-v0.13.0-linux64.tar.gz)
#  Known good config:
#  Node 6.9.1
#  selenium-Webdriver 3.0.1
#  Geckodriver v0.13.0
#  firefox 50.1.0
# NOTE: swdb/tests/swdb-firefox.js instructs geckodriver as to which firefox it should use. Update the firefox path here if necessary.
# to run all tests
cd ~/swdb
# WARNING! This testing will clear ALL collection in the db listed in the swdbrc file.
# Make sure the db listed is safe for this operation!!
npm run test-all
```
# Managing Configuration
The file config/properties.json is expected to have the data necessary to running in a given environment.
See the docs directory in the repository for more information on using the properties file to configure the system.

