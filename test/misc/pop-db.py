#! /usr/bin/python
# helper script for loading db with test entries
import requests
import json
url = 'http://127.0.0.1:3000/swdbserv/v1'
payload = {
  # 'id': '2000',
  'swName': '2000',
  'owner': 'Owner 2000',
  'levelOfCare': 'LOW',
  'status': 'DEVEL',
  'statusDate': '0',
  'releasedVersion': '0',
}
headers = {'content-type': 'application/json'}

for i in range(2000,3000):
  print "sending ID "+str(i)
  # payload['id'] = str(i)
  payload['swName'] = "sw name "+str(i)
  payload['owner'] = "owner "+str((int(i)/int(10)))
  payload['statusDate'] = str(i)
  payload['releasedVersion'] = str(i)
  payload['platforms'] = "Platform "+str(i/10)
  payload['auxSw'] = ["auxSw "+str(i/10),"auxSw "+str(i/10 +1)]
  payload['swDescDoc'] = ["swDescDoc "+str(i/10),"swDescDoc "+str(i/10 +1)]
  payload['validationDoc'] = [
      {
        "doc": "validation doc "+str(i/10),
        "date": str(i/10 +1)
      }
    ]
  payload['verificationDoc'] = [
      {
        "doc": "verification doc "+str(i/10),
        "date": str(i/10 +1)
      }
    ]
  payload['revisionControl'] = "revision control "+str(i/10)
  payload['recertFreq'] = "annual"
  payload['recertStatus'] = "suspended"
  payload['comment'] = ["comment1","comment2","comment3"]

  response = requests.post(url, json=payload, headers=headers)
