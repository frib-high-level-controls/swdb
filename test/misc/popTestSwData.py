#! /usr/bin/env python

from pymongo import MongoClient
from bson.objectid import ObjectId
import json
from pprint import pprint
import re
import ssl

with open("../../config/properties.json") as prop_file:
    prop_data = json.load(prop_file)

with open("./datafiles/swTestDataCombined.json") as data_file:
    data = json.load(data_file)

# pprint(prop_data)
# pprint(data)

for doc in data:
    pprint(doc)
    if "_id" in doc:
        print "Found "+doc["_id"]
        doc["_id"] = ObjectId(doc["_id"])

print "WARNING; This program will be monkeying with the DB defined in the"
print "properties file: "+prop_data["mongodbUrl"]

raw_input("Hit ENTER to continue (ctl-c to exit)...")



# Detect ssl params, remove from string and set in client
newmongodbUrl = prop_data["mongodbUrl"]

pattern = re.compile(r'&ssl=true&sslValidate=false')
if pattern.search(newmongodbUrl):
	newmongodbUrl = re.sub(pattern,"",newmongodbUrl,1)

client = MongoClient(newmongodbUrl, ssl = True, ssl_cert_reqs = ssl.CERT_NONE)

# find the db name to use
db = client[newmongodbUrl.split("authSource=")[-1]]
#coll = client['swNamesProp']

#result =db.swNamesProp.insert_many(data)




#client = MongoClient(prop_data["mongodbUrl"])
#db = client[prop_data["mongodbUrl"].split("/")[-1]]
#coll = client['swNamesProp']

result = db.swdbCollection.insert_many(data)
