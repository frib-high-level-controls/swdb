#! /usr/bin/python
from pymongo import MongoClient


client = MongoClient("mongodb://localhost:27017")
db = client['maxTest']
coll = db['swNamesProp']

result = db.swNamesProp.insert_many(
  [
    {"swName": "Test Record"},
    {"swName":"Test Record2"},
    {"swName":"Test Record3"},
    {"swName":"Test Record4"},
  ]
)
#    "Test Record",
#    {"swName":"Test Record2"},
#    {"swName":"Test Record3"},
#    {"swName":"Test Record4"},
#        {"swNames": [
#    "Test Record",
#    "Test Record2",
#    "Test Record3",
#    "Test Record4",
#  ]}
