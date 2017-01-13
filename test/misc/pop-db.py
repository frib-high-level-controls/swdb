#! /usr/bin/python
# helper script for loading db with test entries
import requests
import json
import re
import datafile

urlHost = "http://swdb-dev:3005"
url = urlHost+'/swdbserv/v1'

payload = {}

headers = {'content-type': 'application/json'}
session = requests.Session()
r = session.get(urlHost+"/testlogin?username=testuser&password=testuserpasswd")

for i in (datafile.data):
  payload={}
  print "adding "+i["Name"]
# swName
  payload['swName'] = i["Name"]
# owner
  if "Engineer in charge" not in i.keys() or i["Engineer in charge"] == "" :
    print "Owner is missing, setting to 'test owner'"
    payload['owner'] = "test owner"
  else:
    payload['owner'] = i["Engineer in charge"]
# levelOfCare
  if ("Level Of Care" in i.keys() and ( i["Level Of Care"].upper() == "LOW"
        or i["Level Of Care"].upper() == "MEDIUM" 
        or i["Level Of Care"].upper() == "HIGH")):
      payload['levelOfCare'] = i["Level Of Care"].upper()
  else:
    print 'Found invalid level of care in record, setting to "LOW".'
    payload['levelOfCare'] = "LOW"
# status
  if ("Status" in i.keys() and ( i["Status"].upper() == "DEVEL"
        or i["Status"].upper() == "RDY_INSTALL"
        or i["Status"].upper() == "RDY_INT_TEST"
        or i["Status"].upper() == "RDY_BEAM"
        or i["Status"].upper() == "RETIRED")):
      payload['status'] = i["Status"].upper()
  else:
    print 'Found invalid status in record, setting to "DEVEL".'
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


  print "sending: "+str(payload.items())
  print "to: "+url
  response = session.post(url, json=payload, headers=headers)
  print "Response: "+str(response)+"\n"

