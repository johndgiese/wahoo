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


FakeIo.prototype.emit = function emitIo(eventName, data, groupName) {
  var sockets;
  if (groupName) {
    sockets = this.groups[groupName] || [];
  } else {
    sockets = this.sockets;
  }

  sockets.forEach(function(s) {
    s.client.messages.push({name: eventName, data: data});
    if (eventName in s.client.listenerMap) {
      s.client.listenerMap[eventName](data);
    }
  });
};


FakeIo.prototype.to = function broadcastToIo(groupName) {
  var self = this;
  return {emit: function(eventName, data) {
    self.emit(eventName, data, groupName);
  }};
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


FakeSocket.prototype.to = function broadcastToSocket(groupName) {
  var self = this;
  return {emit: function(eventName, data) {
    self.io.emit(eventName, data, groupName);
  }};
};


FakeSocket.prototype.join = function join(groupName) {
  var groups = this.io.groups
  var existingGroup = groups[groupName];
  if (existingGroup) {
    var alreadyJoinedGroup = existingGroup.indexOf(this) !== -1;
    if (!alreadyJoinedGroup) {
      existingGroup.push(this);
    }
  } else {
    groups[groupName] = [this];
  }
};


FakeSocket.prototype.leave = function leave(group) {
  // TODO: build this
};


function FakeClient() {
  this.messages = [];
  this.listenerMap = {};
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


FakeClient.prototype.on = function onClient(eventName, listener) {
  var self = this;
  //console.log("listening to " + eventName + " on " + self.socket.id);
  this.listenerMap[eventName] = function(data) {
    //console.log("recieved " + eventName + " on " + self.socket.id);
    //console.log(data);
    listener(data);
  }
};
