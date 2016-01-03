/**
 * A mock of the socket.io library (or the parts that we use).
 *
 * Is useful for testing since it keeps it all fast and synchronous.
 */

module.exports = FakeIo;


function FakeIo() {
  this.handlers = {};
  this.sockets = [];
  this.idCounter = 0;
  this.groups = {};
}


FakeIo.prototype.on = function onIo(eventName, handler) {
  this.handlers[eventName] = handler;
};


FakeIo.prototype.emit = function emitIo(eventName, data, group) {
  var sockets;
  if (group) {
    sockets = this.groups[group] || [];
  } else {
    sockets = this.sockets;
  }

  sockets.forEach(function(s) {
    s.client.messages.push({name: eventName, data: data});
  });
};


FakeIo.prototype.nextId = function nextId() {
  return ++this.idCounter;
};


FakeIo.prototype.client = function testConnection() {
  var socket = new FakeSocket(this);
  var client = new FakeClient()
  socket.client = client;
  client.socket = socket;

  this.sockets.push(socket);

  if (this.handlers['connection']) {
    this.handlers['connection'](socket);
  }

  return client;
};


function FakeSocket(io) {
  this.io = io;
  this.handlers = {};
  this.id = io.nextId();
  this.join(this.id);
}


FakeSocket.prototype.on = function onSocket(eventName, handler) {
  this.handlers[eventName] = handler;
}


FakeSocket.prototype.emit = function emitSocket(eventName, data) {
  this.io.emit(eventName, data);
}


FakeSocket.prototype.to = function broadcastTo(group) {
  var self = this;
  return {emit: function(eventName, data) {
    self.io.emit(eventName, data, group);
  }};
};


FakeSocket.prototype.join = function join(group) {
  var existingGroup = this.io.groups[group]
  if (existingGroup) {
    existingGroup.push(this);
  } else {
    this.io.groups[group] = [this];
  }
};


FakeSocket.prototype.leave = function leave(group) {
  // TODO: build this
};


function FakeClient() {
  this.messages = [];
}


FakeClient.prototype.emit = function emitClient(eventName, data, ack) {
  var handler = this.socket.handlers[eventName];
  if (handler) {
    if (ack) {
      handler(data, ack);
    } else {
      handler(data);
    };
  } else {
    if (ack) {
      throw new Error('Not sure how socket.io handles this');
    }
  }
};
