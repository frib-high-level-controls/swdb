#! /usr/bin/python
# helper script for loading db with test entries
import requests
import json
import re
import pprint
import datafile
import json
from pprint import pprint

with open("./swData.json") as data_file:
    data = json.load(data_file)

with open("../../config/properties.json") as prop_file:
    prop_data = json.load(prop_file)

url =  prop_data["apiUrl"]
urlHost =  prop_data["webUrl"]

payload = {}

headers = {'content-type': 'application/json'}
session = requests.Session()
r = session.get(urlHost+"testlogin?username=testuser&password=testuserpasswd")
pprint(r)

print "WARNING; This program will be monkeying with the DB behind"
print "the url: "+prop_data["webUrl"]

raw_input("Hit ENTER to continue (ctl-c to exit)...")

for i in (data):
  payload={}
  #print "adding "+i["Name"]
# swName
  payload['swName'] = i["Name"]
# owner
  if "Engineer in charge" not in i.keys() or i["Engineer in charge"] == "" :
    #print "Owner is missing, setting to 'test owner'"
    payload['owner'] = "test owner"
  else:
    payload['owner'] = i["Engineer in charge"]
# levelOfCare
  if ("Level Of Care" in i.keys() and ( i["Level Of Care"].upper() == "LOW"
        or i["Level Of Care"].upper() == "MEDIUM"
        or i["Level Of Care"].upper() == "HIGH")):
      payload['levelOfCare'] = i["Level Of Care"].upper()
  else:
    #print 'Found invalid level of care in record, setting to "LOW".'
    payload['levelOfCare'] = "LOW"
# status
  if ("Status" in i.keys() and ( i["Status"].upper() == "DEVEL"
        or i["Status"].upper() == "RDY_INSTALL"
        or i["Status"].upper() == "RDY_INT_TEST"
        or i["Status"].upper() == "RDY_BEAM"
        or i["Status"].upper() == "RETIRED")):
      payload['status'] = i["Status"].upper()
  else:
    #print 'Found invalid status in record, setting to "DEVEL".'
    payload['status'] = "DEVEL"
  payload['statusDate'] =  "1970/07/07"
#releasedVersion
  if "Version" in i.keys() and i["Version"] != "" :
    payload["releasedVersion"] = i["Version"]
  #else:
  #  payload["releasedVersion"] = "0.0.0"
# Platforms
  if "Platforms" in i.keys() and i["Platforms"] != "" :
    payload["Platforms"] = i["Platforms"]
# auxSw
  #if "auxSw" not in payload.keys():
  #  payload["auxSw"] = list()
  if "Tools" in i.keys() and i["Tools"] != "" :
    payload["auxSw"] = [i["Tools"]]
# swDescDocs
# validatioDocs
# verificatioDocs
# revision
  if "Version Control" in i.keys() and i["Version Control"] != "" :
    payload["revisionControl"] = i["Version Control"]
#recertFreq
  #payload['recertFreq'] = "annual"
#recertStatus
  #payload['recertStatus'] = "suspended"
#comments
  if "Comments" in i.keys() and i["Comments"] != "" :
    # ignore
    #payload['comment'] = [str(i["Comments"])]
    payload['comment'] = [re.sub('[^\s!-~]', '', i["Comments"])]


  response = session.post(url, json=payload, headers=headers)
  if response.status_code != 201:
    print "sending: "+str(payload.items())
    print "to: "+url
    print "Response: "+str(response)+"\n"+response.text+"\n"
    #pprint.pprint(response)
