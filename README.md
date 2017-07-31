# SWDB
This ia a prototype web application for storing meta-information on software.
#Installation Overview
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
The first steps are to install the SWDB server and front end followed by the MongoDB backend 
and test harness.

# SWDB Installation
``` bash
# install swdb
git clone http://github.com/rellis6022/swdb
cd swdb
npm install

#install the swdb front end
cd public/swdb-fe
sudo npm install -g bower
bower install
```
# MongoDB Setup
``` sh
# prep mongodb
sudo mkdir -p /data/db
sudo service mongodb restart
```
# Install as a systemd service
```
sudo cp ~/swdb/config/swdb.service /etc/systemd/system/swdb.service
sudo systemctl start swdb
```

# Unit/API Test Setup
``` sh
# setup for tests
sudo npm install -g mocha
sudo npm install -g chai
npm install selenium-webdriver

# do initial  non-browser tests
cd ~/swdb
mocha test/swdb-spec.js
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
mocha
```
