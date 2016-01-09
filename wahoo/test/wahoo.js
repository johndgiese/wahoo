var fs = require('fs');

var _ = require('underscore');
var assert = require('chai').assert;

var Wahoo = require('../index');
var Mahoo = require('../Mahoo');
var FakeIo = require('../FakeIo');


describe("The Wahoo", function() {
  var wahoo;
  var testLogFilename = '/tmp/test-logfile.txt';

  beforeEach(function() {
    wahoo = new Wahoo(testLogFilename);
  });

  afterEach(function() {
    fs.unlinkSync(testLogFilename);
  });

  describe("event method", function() {
    it("won't allow you to register events twice.", function() {
      wahoo.event('a');
      function registerEventAgain() {
        wahoo.event('a');
      }
      assert.throws(registerEventAgain, Error);
    });
  });

  describe("aggregate method", function() {
    it("won't allow you to register aggregators twice.", function() {
      wahoo.aggregate('a', 0);
      function registerAggregatorAgain() {
        wahoo.aggregate('a', 0);
      }
      assert.throws(registerAggregatorAgain, Error);
    });
  });

  describe("once it is running", function() {
    var fakeIo;

    beforeEach(function() {
      fakeIo = new FakeIo();

      wahoo.event('count', counter);

      wahoo.aggregate('sum', 0)
      .on('count', addValue)

      wahoo.aggregate('averageValue', {n: 0, v: 0})
      .on('count', averageValue);
    });

    it("will aggregate existing events in the log.", function(done) {
      wahoo.log.add('1 count 5');
      wahoo.log.add('2 count 5');
      wahoo.log.add('3 count 20');

      wahoo.setup(fakeIo, function() {
        assertWahooStateGood(wahoo, done);
      });
    });

    it("will aggregate incoming events.", function(done) {
      wahoo.setup(fakeIo, function() {
        var clientSocket = fakeIo.client();
        clientSocket.emit('event', {name: 'count', data: 5}, _.identity);
        clientSocket.emit('event', {name: 'count', data: 5}, _.identity);
        clientSocket.emit('event', {name: 'count', data: 20}, _.identity);
        assertWahooStateGood(wahoo, done);
      });
    });

    it("will let client's subscribe to aggregates.", function() {
      wahoo.setup(fakeIo, function() {
        var mahooOne = new Mahoo(fakeIo.client());
        var mahooTwo = new Mahoo(fakeIo.client());
        assert.equal(mahooOne.aggregates.sum, undefined);
        mahooOne.subscribe('sum');
        assert.equal(mahooOne.aggregates.sum, 0);
        mahooTwo.emit('count', 5);
        assert.equal(mahooOne.aggregates.sum, 5);
      });
    });
  });
});

function assertWahooStateGood(wahoo, done) {
  var sumValue = wahoo.aggregatorMap['sum'].value;
  var averageValue = wahoo.aggregatorMap['averageValue'].value;

  assert.equal(sumValue, 30);
  assert.deepEqual(averageValue, {n: 3, v: (5 + 10 + 30)/3});
  done();
}

function counter($data) {
  if (!_.isNumber($data))
    throw Error("Expecting a number, got: " + $data);
  return $data;
}

function addValue(a, $data) {
  return a + $data;
}

function averageValue(a, sum) {
  return {n: a.n + 1, v: ((a.v*a.n) + sum)/(a.n + 1)};
}
