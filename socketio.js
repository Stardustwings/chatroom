var fs = require('fs');

function on_connect(io) {
  return function(socket) {
    var username = socket.request.session.username;

    if (!username) return socket.disconnect();

    handle_online_users(username, io);

    console.log(username + ' connect successfully');

    socket.on('message', function(msg){
      io.emit('message', username + ': ' + msg);
    });

    socket.on('force_disconnect', socket.disconnect);

    socket.on('disconnect', disconnect_socket(username, io));
  }
}

function handle_online_users(username, io) {
  var online_users = JSON.parse(fs.readFileSync('./data/online_users.json'));

  online_users.push(username);
  io.emit('online_users_change', online_users);
  fs.writeFileSync('./data/online_users.json', JSON.stringify(online_users));
}

function disconnect_socket(username, io) {
  return function(socket) {
    var online_users = JSON.parse(fs.readFileSync('./data/online_users.json'));

    for (var i = 0; i < online_users.length; i++) {
      if (online_users[i] === username) {
        online_users.splice(i, 1);
        fs.writeFileSync('./data/online_users.json', JSON.stringify(online_users));
        io.emit('online_users_change', online_users);
        console.log(username + ' disconnect successfully');
        return;
      }
    }
  }
}

module.exports = function(io) {
  io.on('connection', on_connect(io));
}