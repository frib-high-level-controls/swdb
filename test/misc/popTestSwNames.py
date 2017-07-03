#! /usr/bin/python
from pymongo import MongoClient
import json
from pprint import pprint

with open("../../config/properties.json") as prop_file:
    prop_data = json.load(prop_file)

with open("./datafiles/testSwNames.json") as data_file:
    data = json.load(data_file)

pprint(prop_data)
pprint(data)

print "WARNING; This program will be monkeying with the DB defined in the"
print "properties file: "+prop_data["mongodbUrl"]

raw_input("Hit ENTER to continue (ctl-c to exit)...")

client = MongoClient(prop_data["mongodbUrl"])
db = client[prop_data["mongodbUrl"].split("/")[-1]]
#coll = client['swNamesProp']

result = db.swNamesProp.insert_many(data)
