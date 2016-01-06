var app = require('./app').app;
var server = require('http').Server(app);
var socketio = require('./socketio');

socketio(server);

server.listen(3000, function () {
  var host = 'localhost';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});