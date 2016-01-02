var fs = require('fs');

var _ = require('underscore');
var assert = require('chai').assert;

var Log = require('../Log');


var testLogFilename = '/tmp/test-log.txt';


describe("The Log", function() {

  afterEach(function() {
    fs.unlinkSync(testLogFilename);
  });

  it("stores entries in a file.", function(done) {
    var log = new Log(testLogFilename)

    var entries = ['1', '2'];

    _.each(entries, function(v) { log.add(v); });

    var i = 0;
    function assertValuesReadInOrder(entry) {
      assert.equal(entry, entries[i++]);
    }

    log.read(assertValuesReadInOrder, function() {
      assert.equal(i, entries.length);
      done();
    });
  });

  it("won't add entries containing a newline.", function() {
    var log = new Log(testLogFilename)

    function addBadEntry() {
      log.add('a\nb');
    }

    assert.throws(addBadEntry, Error);
  });
  
});
