#! /usr/bin/env python

from collections import OrderedDict
import simplejson as json
import datetime

array = []

for nrow in range(1, 1000):
    row = OrderedDict()
    numStr = "{0:05d}".format(nrow)
    row["host"] = "host"+numStr
    row["area"] =   "Global"
    row["slots"] =  "slot"+numStr
    row["status"] = "DEVEL"
    row["statusDate"] = datetime.datetime.now().strftime("%d-%m-%Y")
    row["software"] = "{0:024x}".format(nrow)
    row["vvResultsLoc"] = "URL"+numStr
    row["drrs"] = "DRR"+numStr
    row["_id"] = "{0:024x}".format(nrow)

    array.append(row)


json_data = json.dumps(array, indent=2)
#print json_data
with open('/home/rellis/instRecGenOut.json', 'w') as jfile:
    jfile.write(json_data)
