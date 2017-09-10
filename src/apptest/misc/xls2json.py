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

for nrow in range(1, sheet.nrows):
  row = OrderedDict()
  cols = sheet.row_values(nrow)
  if cols[0] != "":
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

    for host in cols[3].split(','):
      instRow = OrderedDict()
      instRow["host"] = host
      instRow["area"] = cols[6]
      instRow["status"] = cols[4]
      instRow["statusDate"] = time.strftime("%m/%d/%Y")
      instRow["software"] = format(nrow,"024x")

      # print "  Adding inst row "+json.dumps(instRow);
      instArray.append(instRow)
    
json_data = json.dumps(array, indent=2)
inst_json_data = json.dumps(instArray, indent=2)
# print inst_json_data
with open('/home/deployer/swOut.json', 'w') as jfile:
    jfile.write(json_data)

with open('/home/deployer/instOut.json', 'w') as jfile:
    jfile.write(inst_json_data)