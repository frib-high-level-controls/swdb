#! /usr/bin/env python

import xlrd
from collections import OrderedDict
import simplejson as json
import time

# Open the workbook and select the worksheet
wb = xlrd.open_workbook('/home/deployer/Downloads/Software_Configuration_DRR01-03.xlsx')
sheet = wb.sheet_by_index(2)
array = []
instArray = []

# keep track of keys to ignore dupes.
swKeyList = {}

for nrow in range(1, sheet.nrows):
  row = OrderedDict()
  cols = sheet.row_values(nrow)
  if cols[0] != "":
    keyStr = cols[2]+"-"+str(cols[5])
    if not swKeyList.get(keyStr):
      # store the _id for this key for future lookups
      swKeyList[keyStr] = format(nrow, "024x")
      #print "looking at ,".join(sheet.row_values(nrow))
      row["swName"] = cols[2]
      row["desc"] = cols[1]
      row["status"] = cols[4]
      row["version"] = str(cols[5])
      row["area"] = cols[6]
      row["owner"] = cols[7]
      row["engineer"] = cols[8]
      row["levelOfCare"] = cols[9]
      row["platforms"] = cols[10]
      row["revisionControl"] = cols[11]
      row["revisionControlLoc"] = cols[12]
      row["_id"] = format(nrow, "024x")
 
      # print "Adding sw row "+json.dumps(row);
      array.append(row)
    else:
      print "Found existing swName:" + cols[2] + " version:" + str(cols[5]) + " skipping."

    for host in cols[3].split(','):
      instRow = OrderedDict()
      instRow["host"] = host
      instRow["area"] = cols[6]
      instRow["status"] = cols[4]
      instRow["statusDate"] = time.strftime("%m/%d/%Y")
      # instRow["software"] = format(nrow,"024x")
      instRow["software"] = swKeyList[keyStr]

      # print "  Adding inst row "+json.dumps(instRow);
      instArray.append(instRow)
    
json_data = json.dumps(array, indent=2)
inst_json_data = json.dumps(instArray, indent=2)
# print inst_json_data
with open('/home/deployer/swOut.json', 'w') as jfile:
    jfile.write(json_data)

with open('/home/deployer/instOut.json', 'w') as jfile:
    jfile.write(inst_json_data)
