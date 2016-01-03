var fs = require('fs');
var readline = require('readline');


module.exports = Log;


/**
 * Create a new log stored in the specified filename.
 *
 * Will append to an existing file.
 */
function Log(filename) {
  this.delimeter = '\n';
  this.filename = filename;
  this.appendFile = fs.openSync(this.filename, 'a+');
};


/**
 * Add an entry to the log.
 *
 * Entries must be a string that doesn't contain the log's delimeter.
 */
Log.prototype.add = function addLogEntry(entry) {
  if (typeof entry !== "string")
    throw Error("Entry is not a string");
  if (entry.indexOf(this.delimeter) !== -1)
    throw Error("Entry contains the delimter '" + this.delimeter + "'");
  fs.appendFile(this.appendFile, entry + this.delimeter, throwError);
};


/**
 * Read the log and call the provided function for each line in the log.
 * Then call the finished function when you are done.
 */
Log.prototype.read = function readLog(func, done) {
  var logStream = fs.createReadStream(this.filename);
  logStream.setEncoding('utf8');

  var lineReader = readline.createInterface({input: logStream});

  lineReader.on('close', done);
  lineReader.on('line', func);
};


function throwError(err) { 
  if (err) throw err; 
}
