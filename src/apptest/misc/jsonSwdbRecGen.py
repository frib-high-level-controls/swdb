#! /usr/bin/env python

#import xlrd
from collections import OrderedDict
import simplejson as json
import datetime

array = []

for nrow in range(1, 1000):
    row = OrderedDict()
    numStr = "{0:05d}".format(nrow)
    row["swName"] = "swName"+numStr
    row["desc"] =   "desc"+numStr
    row["owner"] =  "owner"+numStr
    row["engineer"] = "engineer"+numStr
    row["levelOfCare"] = "NONE"
    row["status"] = "DEVEL"
    row["statusDate"] = datetime.datetime.now().strftime("%d-%m-%Y")
    row["version"] = "version"+numStr
    row["branch"] = "branch"+numStr
    row["platforms"] = "platforms"+numStr
    row["designDescDocLoc"] = "designDesignDescDocLoc"+numStr
    row["descDocLoc"] = "descDocLoc"+numStr
    row["vvProcLoc"] = "vvProcLoc"+numStr
    row["vvResultsLoc"] = "vvResultsLoc"+numStr
    row["versionControl"] = "Git"
    row["versionControlLoc"] = "versionControlLoc"+numStr
    row["recertFreq"] = ""
    row["recertStatus"] = ""
    row["recertDate"] = ""
    row["previous"] = "previous"+numStr
    row["comment"] = "comment"+numStr
    row["_id"] = "{0:024x}".format(nrow)

    array.append(row)


json_data = json.dumps(array, indent=2)
#print json_data
with open('/home/rellis/recGenOut.json', 'w') as jfile:
    jfile.write(json_data)
