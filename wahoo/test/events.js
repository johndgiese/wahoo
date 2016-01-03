var assert = require('chai').assert;

var events = require('../events');

var event = {
  timestamp: Date.now(),
  name: 'test',
  payload: {a: [1,3,'hello']},
};

describe("The events module", function() {
  describe("serialization methods", function() {
    it("can serialize and deserialize events.", function() {
      var line = events.toLine(event);
      var parsedEvent = events.fromLine(line);
      assert.deepEqual(event, parsedEvent);
    });
  });
});
