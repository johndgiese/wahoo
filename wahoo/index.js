var _ = require('underscore');

var Log = require('./Log.js');
var Injector = require('./Injector');
var Aggregator = require('./aggregators').Aggregator;
var AggregatorPool = require('./aggregators').AggregatorPool;
var events = require('./events');


module.exports = Wahoo;

/**
 * A Wahoo is a system for persisting a series of events to a log, aggregating
 * values based on these events, and exposing these aggregate values (and their
 * evolution in realtime) via websockets.
 *
 * The Wahoo goes through several stages:
 *
 *    config -> aggregating -> running
 *
 * During the config stage, events and aggregates can be registered.  Once they
 * are all registered, call the `setup` method, and the Wahoo runs through the log
 * of past events to accumulate the current value of all the aggregates.  Once
 * this is complete, it exposes these objects via socket.io to the outside world,
 * and persists subsequent events to the log as well as the in-memory aggregates.
 */
function Wahoo(logFilename) {
  this.log = new Log(logFilename);
  this.stage = 'config';
  this.eventDescriptors = {};
  this.aggregatorMap = {};
}


/**
 * Register an event.
 *
 * The pre function is called before an event is persisted.  Its first argument
 * is the event data, all subsequent arguments are injected from among the
 * registered aggregators.  The event name can be injected using the `$name`
 * argument.  The pre function must return the value of the data after it has been
 * processes.  No pre-function is required, however it is highly recommended that
 * the pre function validate the contents of the event data, so that a malicious
 * user can't dump a huge amount of data into the log unchecked!
 */
Wahoo.prototype.event = function registerEvent(name, pre) {
  if (this.stage !== 'config')
    throw Error('Attempt to register event `' + name + '` after config stage');
  if (name in this.eventDescriptors)
    throw Error('Event `' + name + '` already registered');

  this.eventDescriptors[name] = {
    pre: pre ? pre : defaultPreProcessor,
  };
};

function defaultPreProcessor($data) { return $data; }

/**
 * Register an aggregate (value) that is built up from events.
 *
 * Returns the aggregator.  You can then register event listeners that describe how
 * the aggregate responds to various events.
 */
Wahoo.prototype.aggregate = function registerAggregator(name, initialValue) {
  if (this.stage !== 'config')
    throw Error('Attempt to register aggregator `' + name + '` after config stage');
  if (name in this.aggregatorMap)
    throw Error('Aggregator `' + name + '` already registered');

  var aggregator = new Aggregator(initialValue);
  this.aggregatorMap[name] = aggregator;
  return aggregator;
};


/**
 * Indicate that we are done with config stage, and are ready to start listening
 * to events.
 *
 * But before we can start listening to events, we need to aggregate all of the
 * events that already exist in the log.
 */
Wahoo.prototype.setup = function setup(io, done) {
  var self = this;

  this.stage = 'aggregating';

  this.aggregatorInjector = new Injector(this.aggregatorMap);
  this.aggregatorPool = new AggregatorPool(this.aggregatorMap);
  // TODO: check that event pre arguments are valid

  this.log.read(function(line) {
    var event = events.fromLine(line);
    self.aggregatorPool.aggregate(event);
  }, function() {
    io.on('connection', function(socket) {
      self.setupDispatch(socket);
    });
    this.stage = 'running';
    done();
  });
};


Wahoo.prototype.handleEvent = function(rawData, ack) {
  try {
    var eventPreData = rawData.data;
    var eventName = rawData.name;

    var pre = this.eventDescriptors[eventName].pre;
    var extraModules = {
      $data: {value: eventData},
      $name: {value: eventName},
    };
    var eventData = this.aggregatorInjector.invoke(pre, [eventPreData], extraModules);
  } catch (err) {
    ack({error: err.message});
    return;
  }

  ack(null);

  var event = {
    timestamp: Date.now(),
    name: eventName,
    data: eventData,
  };

  this.log.add(events.toLine(event));
  this.aggregatorPool.aggregate(event);
  return event;
};


Wahoo.prototype.setupDispatch = function(socket) {
  var self = this;
  socket.on('event', function(rawData, ack) {
    var event = self.handleEvent(rawData, ack);
    if (event) {
      socket.to(event.name).emit(event.name, event);
    }
  });

  socket.on('subscribe', function(aggregatorName, ack) {
    // TODO: only send over the ones that you actually need
    var aggregators = _.map(self.aggregatorMap, function(aggregator, aggregatorName) {
      var listenerMap = {};
      _.each(aggregator.listenerMap, function(listenerFunction, eventName) {
        listenerMap[eventName] = String(listenerFunction);
        socket.join(eventName);
      });

      return {
        name: aggregatorName,
        value: aggregator.value,
        listenerMap: listenerMap,
      };
    });
    ack(aggregators);
  });
};
