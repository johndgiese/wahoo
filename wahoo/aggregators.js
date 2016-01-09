var _ = require('underscore');

var Injector = require('./Injector');

exports.Aggregator = Aggregator;
exports.AggregatorPool = AggregatorPool;

/**
 * An aggregator aggregates a value based on events.
 */
function Aggregator(initialValue) {
  this.value = initialValue;
  this.listenerMap = {};
}

/**
 * Register an event listener for the aggregator.
 *
 * IMPORTANT NOTE: for the aggregates to be stable, all listeners must be fully 
 * synchronous.  Without this, the order that events get aggregated will be 
 * non-deterministic, and the state of the aggregates will not be stable for 
 * each run of an event log.
 */
Aggregator.prototype.on = function registerListener(eventName, listener) {
  if (eventName in this.listenerMap)
    throw Error('Already listening to `' + eventName + '`');

  this.listenerMap[eventName] = listener;
  return this;
};

/**
 * An aggregator pool is a set of named aggregators that can be injected into each 
 * other during listener processing.
 *
 * The pool retains a sense of ordering, so that when any given event is processed, 
 * listeners that depend on other aggregators will be run after the aggregator it 
 * depends on.  Of course this means there can not be circular dependencies.
 */
function AggregatorPool(aggregatorMap) {
  this.injector = new Injector({}, pluckValue);
  this.listenerQueues = {};
  _.each(aggregatorMap || {}, this.add, this);
}


/**
 * Add an aggregator to an existing pool.
 */
AggregatorPool.prototype.add = function addAggregator(aggregator, aggregateName) {
  var self = this;
  self.injector.modules[aggregateName] = aggregator;
  // TODO: keep everything topologically sorted
  _.each(aggregator.listenerMap, function(listener, eventName) {
    if (eventName in self.listenerQueues) {
      self.listenerQueues[eventName].push(aggregator);
    } else {
      self.listenerQueues[eventName] = [aggregator];
    }
  });
};


function pluckValue(a) { return a.value; }


/**
 * Aggregate the effects of the event on the pool.
 */
AggregatorPool.prototype.aggregate = function aggregateEvent(event) {
  var extraModules = {
    $data: {value: event.data},
    $timestamp: {value: event.timestamp},
    $name: {value: event.name},
  };

  var injector = this.injector;
  var listenerQueue = this.listenerQueues[event.name];
  listenerQueue.forEach(function(a) {
    a.value = injector.invoke(a.listenerMap[event.name], [a.value], extraModules);
  });
};


