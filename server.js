var app = require('./app').app;
var sessionMiddleware = require('./app').sessionMiddleware;
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');

var socketio = require('./socketio');
fs.writeFileSync('./data/online_users.json', '[]');

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

socketio(io);

server.listen(3000, function () {
  var host = 'localhost';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});