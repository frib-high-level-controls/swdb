#! /usr/bin/env python

from collections import OrderedDict
import time
import datetime
import xlrd
import simplejson as json

# Open the workbook and select the worksheet
wb = xlrd.open_workbook('/home/deployer/Downloads/Software_Configuration_DRR01-03.xlsx')
sheet = wb.sheet_by_index(2)
array = []
instArray = []

# keep track of keys to ignore dupes.
swKeyList = {}
instKeyList = {}

for nrow in range(1, sheet.nrows):
  row = OrderedDict()
  cols = sheet.row_values(nrow)
  if cols[0] != "":
    keyStr = cols[2]+"-"+str(cols[5])
    if not swKeyList.get(keyStr):
      # store the _id for this key for future lookups
      swKeyList[keyStr] = format(nrow, "024x")
      row["swName"] = cols[2]
      row["desc"] = cols[1]
      row["status"] = "Ready for Beam"
      row["statusDate"] = time.strftime("%m/%d/%Y")
      row["version"] = str(cols[5])
      row["area"] = cols[6]
      row["owner"] = cols[7]
      row["engineer"] = cols[8]
      row["levelOfCare"] = cols[9]
      row["platforms"] = cols[10]
      row["revisionControl"] = cols[11]
      row["revisionControlLoc"] = cols[12]
      row["_id"] = format(nrow, "024x")

      print str(nrow)+":Adding sw row "+json.dumps(row)
      array.append(row)
    else:
      print "Found existing swName:" + cols[2] + " version:" + str(cols[5]) + " skipping."

    for host in cols[3].split(','):
      instKeyStr = host+"-"+swKeyList[keyStr]
      # check that this installation is not already present
      if not instKeyList.get(instKeyStr):
        instKeyList[instKeyStr] = True
        instRow = OrderedDict()
        instRow["host"] = host
        instRow["area"] = cols[6]
        instRow["status"] = cols[4]
        # instRow["statusDate"] = time.strftime("%m/%d/%Y", cols[15])
        vvDate = sheet.cell_value(nrow, 15)
        if vvDate:
          # instRow["statusDate"] = time.strftime("%m/%d/%Y", cols[15])
          vvDatetime = datetime.datetime(*xlrd.xldate_as_tuple(sheet.cell_value(nrow, 15), wb.datemode))
          # print "DATE TEST: %s" % vvDatetime
          instRow["statusDate"] = vvDatetime.strftime("%m/%d/%Y")

        instRow["vvResultsLoc"] = cols[14]
        instRow["software"] = swKeyList[keyStr]

        print "  "+str(nrow)+":Adding inst row "+json.dumps(instRow)
        instArray.append(instRow)
      else:
        print "Found existing installation host:" + host + " sw:" + swKeyList[keyStr] + " skipping."

json_data = json.dumps(array, indent=2)
inst_json_data = json.dumps(instArray, indent=2)

with open('/home/deployer/swOut.json', 'w') as jfile:
  jfile.write(json_data)

with open('/home/deployer/instOut.json', 'w') as jfile:
  jfile.write(inst_json_data)
