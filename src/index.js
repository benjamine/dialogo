
var dialogo = require('./main');

var fs = require('fs');
var path = require('path');

var port = process.env.PORT || 6147;

function handler (req, res) {

  if (req.method !== 'GET') {
    res.writeHead(405, 'Method not allowed');
    res.end();
    return;
  }

  var filename, mimeType = 'text/plain';
  if (req.url === '/') {
    mimeType = 'text/html';
    filename = 'index.html';
  } else if (req.url === '/dialogo/dialogo.js') {
    mimeType = 'text/javascript';
    filename = '../build/bundle.js';
  } else {
    res.writeHead(404, 'Not found');
    res.end();
    return;
  }

  fs.readFile(path.join(__dirname, filename), function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + req.url);
    }
    res.writeHead(200, { 'content-type': mimeType});
    res.end(data);
  });
}

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
app.listen(port);
console.log('listening at http://localhost:' + port);

var storage = new dialogo.Storage();

dialogo.Peer.defaults.debug = process.env.PEERLOG;
var peers = [];

io.on('connection', function (socket) {

  var peer = socket.peer = new dialogo.Peer('server' + (peers.length + 1));
  peers.push(peer);

  peer.storage = storage;
  //socket.emit('news', { hello: 'world' });
  socket.on('dialogo.message', function (message) {
    peer.receive(message);
  });
  peer.on('message', function(message){
    socket.emit('dialogo.message', message);
  });
});
