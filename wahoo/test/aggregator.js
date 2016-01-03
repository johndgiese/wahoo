var assert = require('chai').assert;
var _ = require('underscore');

var Aggregator = require('../aggregator').Aggregator;
var AggregatorPool = require('../aggregator').AggregatorPool;

var events = [
  {
    timestamp: 1234,
    name: 'a',
    payload: 100,
  },
  {
    timestamp: 1242,
    name: 'b',
    payload: {c: 30},
  },
  {
    timestamp: 1247,
    name: 'a',
    payload: 400,
  },
];


describe("The aggregator module", function() {
  describe("AggregatorPool", function() {
    it("aggregates values through a log of events.", function() {

      function addA(a, $d) { return a + $d; };
      function addB(a, $d) { return a + $d.c; };

      var aSum = new Aggregator(4).on('a', addA);
      var abSum = new Aggregator(400).on('a', addA).on('b', addB);
      var bSum = new Aggregator(4000).on('b', addB);

      var pool = new AggregatorPool({
        aSum: aSum,
        abSum: abSum,
        bSum: bSum,
      });

      events.forEach(pool.aggregate, pool);

      assert.equal(aSum.value, 4 + 100 + 400);
      assert.equal(abSum.value, 400 + 100 + 400 + 30);
      assert.equal(bSum.value, 4000 + 30);
    });
  });
});
