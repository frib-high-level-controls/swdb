
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');
const props = JSON.parse(fs.readFileSync('../../config/properties.json', 'utf8'));
const swNames = JSON.parse(fs.readFileSync('./testSwNames.json', 'utf8'));

console.log("swNames array :"+JSON.stringify(swNames));

var swNamesSchema = new mongoose.Schema({
  swName: String,
},{emitIndexErrors: true});

exports.swNamesDoc = mongoose.model('props', swNamesSchema, 'swNamesProp');

exports.dbConnect = mongoose.connect(props.mongodbUrl, function(err, db) {
  if(!err) {
    console.log("connected to mongo... "+props.mongodbUrl);
  } else {
    console.log(err);
  }

});

exports.swNamesDoc.db.collections.swNamesProp.insert(
  swNames,
  function(err, records){
    console.log("added: "+JSON.stringify(records, null, 2));
});


