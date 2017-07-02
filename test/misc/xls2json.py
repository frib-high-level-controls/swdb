#! /usr/bin/env python

import xlrd
from collections import OrderedDict
import simplejson as json

# Open the workbook and select the worksheet
wb = xlrd.open_workbook('/home/rellis/Software_Configuration_Management_DRR01-02.xlsx')
sheet = wb.sheet_by_index(1)
array = []

for nrow in range(1, sheet.nrows):
    #print "looking at ,".join(sheet.row_values(nrow))
    row = OrderedDict()
    cols = sheet.row_values(nrow)
    row["swName"] = cols[0]
    row["comment"] = cols[1]
    row["status"] = cols[2]
    row["version"] = cols[3]
    row["area"] = cols[4]
    row["owner"] = cols[5]
    row["engineer"] = cols[6]
    row["levelOfCare"] = cols[7]
    row["plaforms"] = cols[8]
    row["revisionControl"] = cols[9]
    row["revisionControlLoc"] = cols[10]

    if cols[0] != "":
        array.append(row)

json_data = json.dumps(array, indent=2)
with open('/home/rellis/out.json', 'w') as jfile:
    jfile.write(json_data)
