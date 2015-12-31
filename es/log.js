var fs = require('fs');

var logfilename = './log.txt';
var logfile = fs.openSync(logfilename, 'a+');

/**
 * Add an entry to the log.
 *
 * Entries must be a string without any newline characters.
 */
exports.add = function addLogEntry(payload) {
  if (typeof payload !== 'string') throw Error('Payload is not a string');
  if (payload.indexOf('\n') !== -1) throw Error('Payload contain a new line');
  var line = Date.now() + ' ' + payload + '\n';
  fs.appendFile(logfile, line, function(err) { if (err) throw err; });
};

/**
 * Read log.
 *
 * Returns a readable stream of the log.
 */
exports.read = function readLog() {
  return fs.createReadStream(logfilename);
};
