#! /usr/bin/env python

from collections import OrderedDict
import datetime
import re
import xlrd
import simplejson as json
from colorama import Fore, Back, Style
import pprint
pp = pprint.PrettyPrinter(indent=2)

class Lib:

  @staticmethod
  def getLevelOfCare(item, iss, columns):
    val = ""
    if (re.match("^NONE$", item, flags=re.IGNORECASE)): 
      val = "NONE"
    elif (re.match("^LOW$", item, flags=re.IGNORECASE)): 
      val = "LOW"
    elif (re.match("^MEDIUM$", item, flags=re.IGNORECASE)): 
      val = "MEDIUM"
    elif (re.match("^HIGH$", item, flags=re.IGNORECASE)): 
      val = "HIGH"
    elif (re.match("^SAFETY$", item, flags=re.IGNORECASE)): 
      val = "SAFETY"
    else:
      line = ''.join(str(v)+' ' for v in columns)
      issues.append({"msg": "WARNING: unknown level of care listed for this record: "+line,
        "value": item})
    return val

  @staticmethod
  def getStatus(item, iss, columns):
    val = ""
    if (re.match("^Development$", item, flags=re.IGNORECASE) or
      re.match("^DEVEL$", item, flags=re.IGNORECASE)):
        val = "DEVEL"
    elif (re.match("^Ready for installation$", item, flags=re.IGNORECASE) or
      re.match("^Ready for install$", item, flags=re.IGNORECASE) or
      re.match("^RDY_INSTALL$", item, flags=re.IGNORECASE)):
        val = "RDY_INSTALL"
    elif (re.match("^Ready for integration test$", item, flags=re.IGNORECASE) or
      re.match("^Ready for verification with beam$", item, flags=re.IGNORECASE) or
      re.match("^RDY_INT_TEST$", item, flags=re.IGNORECASE)):
        val = "RDY_INT_TEST"
    elif (re.match("^Ready for beam$", item, flags=re.IGNORECASE) or
      re.match("^RDY_BEAM$", item, flags=re.IGNORECASE)):
        val = "RDY_BEAM"
    elif (re.match("^Retired$", item, flags=re.IGNORECASE)):
      val = "RETIRED"
    else:
      line = ''.join(str(v)+' ' for v in columns)
      issues.append({"msg": "WARNING: unknown sw status listed for this record: "+line,
        "value": item})
    return val

  @staticmethod
  def getInstStatus(item, iss, columns):
    val = ""
    if (re.match("^Development$", item, flags=re.IGNORECASE) or
      re.match("^DEVEL$", item, flags=re.IGNORECASE)):
        val = "DEVEL"
    elif (re.match("^Maintenance$", item, flags=re.IGNORECASE) or
      re.match("^MAINT$", item, flags=re.IGNORECASE)):
        val = "MAINT"
    elif (re.match("^Ready for installation$", item, flags=re.IGNORECASE) or
      re.match("^Ready for install$", item, flags=re.IGNORECASE) or
      re.match("^RDY_INSTALL$", item, flags=re.IGNORECASE)):
        val = "RDY_INSTALL"
    elif (re.match("^Ready for integration test$", item, flags=re.IGNORECASE) or
      re.match("^Ready for verification with beam$", item, flags=re.IGNORECASE) or
      re.match("^RDY_INT_TEST$", item, flags=re.IGNORECASE)):
        val = "RDY_INT_TEST"
    elif (re.match("^Ready for beam$", item, flags=re.IGNORECASE) or
      re.match("^RDY_BEAM$", item, flags=re.IGNORECASE)):
        val = "RDY_BEAM"
    elif (re.match("^Deprecated$", item, flags=re.IGNORECASE)):
      val = "DEPRECATED"
    else:
      line = ''.join(str(v)+' ' for v in columns)
      issues.append({"msg": "WARNING: unknown installation status listed for this record: "+line,
        "value": item})
    return val

  @staticmethod
  def getRcs(item, iss, columns):
    val = ""
    if (re.match("^Git$", item, flags=re.IGNORECASE)): 
      val = "Git"
    elif (re.match("^AssetCentre$", item, flags=re.IGNORECASE) or
      re.match("^AssetCenter$", item, flags=re.IGNORECASE)): 
      val = "AssetCentre"
    elif (re.match("^filesystem$", item, flags=re.IGNORECASE)): 
      val = "Filesystem"
    elif (re.match("^Debian$", item, flags=re.IGNORECASE)): 
      val = "Debian"
    elif (re.match("^Other$", item, flags=re.IGNORECASE)): 
      val = "Other"
    else:
      line = ''.join(str(v)+' ' for v in columns)
      issues.append({"msg": "WARNING: unknown rcs listed for this installation record: "+line,
        "value": item})
    return val

  @staticmethod
  def getArea(item, iss, columns):
    val = ""
    if (re.match("^Global$", item, flags=re.IGNORECASE)): 
      val = "Global"
    elif (re.match("^FE$", item, flags=re.IGNORECASE)): 
      val = "FE"
    elif (re.match("^LS1$", item, flags=re.IGNORECASE)): 
      val = "LS1"
    elif (re.match("^FS1$", item, flags=re.IGNORECASE)): 
      val = "FS1"
    elif (re.match("^LS2$", item, flags=re.IGNORECASE)): 
      val = "LS2"
    elif (re.match("^FS2$", item, flags=re.IGNORECASE)): 
      val = "FS2"
    elif (re.match("^LS3$", item, flags=re.IGNORECASE)): 
      val = "LS3"
    elif (re.match("^BDS$", item, flags=re.IGNORECASE)): 
      val = "BDS"
    elif (re.match("^FS$", item, flags=re.IGNORECASE)): 
      val = "FS"
    else:
      line = ''.join(str(v)+' ' for v in columns)
      issues.append({"msg": "WARNING: unknown area listed for this record: "+line,
        "value": item})
    return val


# Open the workbook and select the worksheet
wb = xlrd.open_workbook('/home/deployer/Downloads/Software_Configuration_DRR01-03 (2).xlsx')
sheet = wb.sheet_by_index(2)
array = []
instArray = []
# keep track of keys to ignore dupes.
swKeyList = {}
instKeyList = {}

lineId = 0
issues = []

for sheet in wb.sheets():
  print "looking at sheet " + sheet.name
  for nrow in range(1, sheet.nrows):
    lineId = lineId + 1
    row = OrderedDict()
    cols = sheet.row_values(nrow)
    if cols[0] != "":
      keyStr = cols[2]+"-"+str(cols[5])
      if not swKeyList.get(keyStr):
        # store the _id for this key for future lookups
        swKeyList[keyStr] = format(lineId, "024x")
        row["swName"] = cols[2]
        row["desc"] = cols[1]
        row["status"] = "RDY_INSTALL"
        # row["status"] = Lib.getStatus(cols[6], issues)
        # row["statusDate"] = time.strftime("%m/%d/%Y")
        #Note sw status date is set below from the installation status date
        row["version"] = str(cols[5])
        row["area"] = Lib.getArea(cols[6], issues, cols)
        row["owner"] = cols[7]
        row["engineer"] = cols[8]
        row["levelOfCare"] = Lib.getLevelOfCare(cols[9], issues, cols)
        row["platforms"] = cols[10]
        row["versionControl"] = Lib.getRcs(cols[11], issues, cols)
        row["versionControlLoc"] = cols[12]
        row["_id"] = format(lineId, "024x")

        print "\n" + str(nrow)+":Adding sw row "+json.dumps(row)
        array.append(row)
      else:
        print "Found existing swName:" + cols[2] + " version:" + str(cols[5]) + " skipping add sw."

      for host in cols[3].split(','):
        instKeyStr = host+"-"+cols[0]+"-"+swKeyList[keyStr]
        # check that this installation is not already present
        if not instKeyList.get(instKeyStr):
          instKeyList[instKeyStr] = True
          instRow = OrderedDict()
          instRow["host"] = host
          instRow["name"] = cols[0]
          instRow["area"] = Lib.getArea(cols[6], issues, cols)
          instRow["status"] = Lib.getInstStatus(cols[4],issues, cols)

          # instRow["statusDate"] = time.strftime("%m/%d/%Y", cols[15])
          vvDate = sheet.cell_value(nrow, 15)
          if vvDate:
            # instRow["statusDate"] = time.strftime("%m/%d/%Y", cols[15])
            vvDatetime = datetime.datetime(
                *xlrd.xldate_as_tuple(sheet.cell_value(nrow, 15), wb.datemode))
            # print "DATE TEST: %s" % vvDatetime
            instRow["statusDate"] = vvDatetime.strftime("%m/%d/%Y")

            # sw status date gets set from installation status date
            row["statusDate"] = vvDatetime.strftime("%m/%d/%Y")

          instRow["vvResultsLoc"] = cols[14]
          instRow["software"] = swKeyList[keyStr]
          instRow["drrs"] = sheet.name

          print "  "+str(nrow)+":Adding inst row "+json.dumps(instRow)
          instArray.append(instRow)
        else:
          print "Found existing installation:" + instKeyStr + " skipping add inst."

json_data = json.dumps(array, indent=2)
inst_json_data = json.dumps(instArray, indent=2)

with open('/home/deployer/swOut.json', 'w') as jfile:
  jfile.write(json_data)

with open('/home/deployer/instOut.json', 'w') as jfile:
  jfile.write(inst_json_data)

if (len(issues) > 0):
  print 'Issues:'+''.join(Fore.RED)
  pp.pprint(issues)
  print ''.join(Style.RESET_ALL)
