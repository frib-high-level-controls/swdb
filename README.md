# swdb
This ia a prototype web application for storing meta-information on software.
#Installation overview
This install has been tested on Debin Jessie.
To start with, make sure you have Node.js, MogoDB, Git, sudo, and curl
```sh
sudo apt-get install curl sudo git mongodb
```
``` sh
#Get Node
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```
# SWDB installation
``` bash
# install swdb
git clone http://github.com/rellis6022/swdb
cd swdb
npm install
(npm install --save-dev for development)

#install the swdb front end
cd public/swdb-fe
sudo npm install -g bower
bower install
```
# MongoDB setup
``` sh
# prep mongodb
sudo mkdir -p /data/db
sudo service mongodb restart
```
# Unit/API Test setup
``` sh
# setup for tests
sudo npm install -g mocha
sudo npm install -g chai
npm install selenium-webdriver

# do initial  non-browser tests
cd ~/swdb
mocha test/swdb-spec.js
```
# Web tests (Selenium)
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
# NOTE: swdb/tests/swdb-firefox.js instructs geckodriver as to which firefox it should use. Update the 
  firefox path here if necessary.
# to run all tests
cd ~/swdb
mocha
```
# Manual testing
```sh
# start the server
cd ~/swdb
node server.js
# in another terminal, populate the backend with some fake data
# (The the automated tests clean the test db every run.)
# This script requires two pip modules. 
sudo apt-get install python-pip
pip install requests
pip install JSON
~/swdb-test/test/misc/pop-db.py
# point your browser to http://localhost:3005 (or 'webPort' in config/properties)
```
