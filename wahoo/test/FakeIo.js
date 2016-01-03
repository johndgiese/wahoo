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

    it("recieves events emitted by the server.", function() {
      client1 = io.client();
      client2 = io.client();
      io.emit('test', 4);
      assert.deepEqual(client1.messages[0], {name: 'test', data: 4});
      assert.deepEqual(client2.messages[0], {name: 'test', data: 4});
    });
  });
});
