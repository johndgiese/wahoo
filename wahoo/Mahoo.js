var Aggregator = require('./aggregators').Aggregator;
var AggregatorPool = require('./aggregators').AggregatorPool;

var _ = require('underscore');


module.exports = Mahoo;


function Mahoo (socket) {
  this.socket = socket;
  this.aggregates = {};
  this.aggregatePool = new AggregatorPool({});
  this.eventsReferenceCounts = {};
}


Mahoo.prototype.emit = function emit(eventName, data, done) {
  if (done === undefined) {
    done = function() {};
  }
  this.socket.emit('event', {name: eventName, data: data}, done);
};


Mahoo.prototype.subscribe = function subscribe(aggregateName) {
  var self = this;
  self.socket.emit('subscribe', {name: aggregateName}, function(aggregatorDescriptors) {
    _.each(aggregatorDescriptors, function(descriptor) {
      self.addAggregator(descriptor.name, descriptor.value, descriptor.listenerMap);
    });
    var aggregator = self.aggregatePool.injector.modules[aggregateName];
    Object.defineProperty(self.aggregates, aggregateName, {
      get: function() { return aggregator.value; },
    });
  });
};


Mahoo.prototype.unsubscribe = function unsubscribe(aggregatorName) {
  // TODO: implement this
};


Mahoo.prototype.addAggregator = function addAggregator(name, value, listenerMap) {
  var self = this;

  var aggregator = new Aggregator(value);
  _.each(listenerMap, function setupListeners(listenerAsString, eventName) {
    var listener = buildFunction(listenerAsString);
    aggregator.on(eventName, listener);
    if (eventName in self.eventsReferenceCounts) {
      self.eventsReferenceCounts[eventName] += 1;
    } else {
      self.eventsReferenceCounts[eventName] = 1;
      self.socket.on(eventName, function handleEvent(event) {
        self.aggregatePool.aggregate(event);
      });
    }
  });
  self.aggregatePool.add(aggregator, name);
};


function buildFunction(functionString) {
  return new Function('return ' + functionString)();
}
