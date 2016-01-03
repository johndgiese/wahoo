var assert = require('chai').assert;
var _ = require('underscore');

var Aggregator = require('../aggregators').Aggregator;
var AggregatorPool = require('../aggregators').AggregatorPool;

var events = [
  {
    timestamp: 1234,
    name: 'a',
    data: 100,
  },
  {
    timestamp: 1242,
    name: 'b',
    data: {c: 30},
  },
  {
    timestamp: 1247,
    name: 'a',
    data: 400,
  },
];


describe("The aggregators module", function() {
  describe("AggregatorPool", function() {
    it("aggregates values through a log of events.", function() {

      function addA(a, $data) { return a + $data; };
      function addB(a, $data) { return a + $data.c; };

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
