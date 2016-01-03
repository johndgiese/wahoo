var util = require('util');


exports.toLine = function toLine(event) {
  if (event.name.indexOf(' ') !== -1)
    throw Error(util.format('Invalid event name `%s`', event.name));
  return util.format('%d %s %j', event.timestamp, event.name, event.payload);
};


exports.fromLine = function fromLine(line) {
  var firstSpaceIndex = line.indexOf(' ');
  var secondSpaceIndex = line.indexOf(' ', firstSpaceIndex + 1);
  if (firstSpaceIndex === -1 || secondSpaceIndex === -1)
    throw Error(util.format('Improperly formatted line `%s`', line));

  var timestampStr = line.substr(0, firstSpaceIndex);
  var name = line.substr(firstSpaceIndex + 1, secondSpaceIndex - firstSpaceIndex - 1);
  var payloadStr = line.substr(secondSpaceIndex + 1);
  return {
    timestamp: parseInt(timestampStr),
    name: name,
    payload: JSON.parse(payloadStr),
  };
};
