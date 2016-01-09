var _ = require('underscore');
var assert = require('chai').assert;

var FakeIo = require('../FakeIo');


describe("The FakeIo module", function() {
  var io, client;

  beforeEach(function() {
    io = new FakeIo();
  });

  describe("client", function() {
    it("lets you emit events.", function() {
      io.on('connection', function(socket) {
        socket.on('echo', function(data, ack) {
          ack(data);
        });
      });

      client = io.client();

      client.emit('echo', 4, function(response) {
        assert.equal(response, 4);
      });
    });

    it("receives events emitted by the server.", function() {
      client1 = io.client();
      client2 = io.client();
      client1.on('test', function(data) {
        assert.equal(data, 4);
      });
      client2.on('test', function(data) {
        assert.equal(data, 4);
      });
      io.emit('test', 4);
      assert.deepEqual(client1.messages[0], {name: 'test', data: 4});
      assert.deepEqual(client2.messages[0], {name: 'test', data: 4});

    });

    it("can join groups, and receive events emitted to it.", function() {
      io.on('connection', function(socket) {
        socket.join('all');
        
        socket.on('ping', function(group, ack) {
          socket.to(group).emit('ping', socket.id, _.identity);
          ack(true);
        });
      });

      client1 = io.client();
      client2 = io.client();

      client1.emit('ping', 'all', _.identity);
      client2.emit('ping', 'all', _.identity);
      client1.emit('ping', '2', _.identity);
      client2.emit('ping', '1', _.identity);

      assert.deepEqual(client1.messages, [
        {name: 'ping', data: 1},
        {name: 'ping', data: 2},
        {name: 'ping', data: 2},
      ]);

      assert.deepEqual(client2.messages, [
        {name: 'ping', data: 1},
        {name: 'ping', data: 2},
        {name: 'ping', data: 1},
      ]);
    });

    it("can only join groups once.", function() {
      io.on('connection', function(socket) {
        socket.join('all');
        socket.join('all');
      })

      client = io.client();

      io.to('all').emit('hello', 1, _.identity);

      assert.deepEqual(client.messages, [
        {name: 'hello', data: 1},
      ]);
    });
  });
});
