var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8090);

function handler(req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function(socket) {
  socket.on('__join', function(data) {
    // 1. see if the user is permitted
    // 2. if permitted, send over aggregator
    // 3. and (at the same instant) setup a listener on all the events the aggregator must listen to
  });
});
