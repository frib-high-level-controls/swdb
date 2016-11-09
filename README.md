# swdb-test
This ia a prototype web application for storing meta-information on software.
#Installation overview
This install has been tested on Debin Jessie.
To start with, make sure you have Node.js, MogoDB, Git, sudo, and curl
```sh
sudo apt-get install curl sudo git mongodb
```
``` sh
#Get Node
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs
```
# SWDB-test installation
``` bash
# install swdb-test
git clone http://github.com/rellis6022/swdb-test
cd swdb-test
npm install

#install the swdb front end
mkdir public; cd public
git clone http://github.com/rellis6022/swdb-fe
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
cd ~/swdb-test
mocha test/swdb-spec.js
```
# Web tests (Selenium)
```sh
# Setting up for Chrome tests
# install Chrome
#install the selenium chromewdriver
# Get it here http://chromedriver.storage.googleapis.com/index.html
# It can go anywhere on your PATH. (I used /opt/chromedriver)
# to run all tests
cd ~/swdb-test
mocha
```
# Manual testing
```sh
# start the server
cd ~/swdb-test
node server.js
# in another terminal, populate the backend with some fake data
# (The the automated tests clean the test db every run.)
~/swdb-test/test/misc/pop-db.py
# point your browser to http://localhost:3000
```
