var fs = require('fs');
var sessionMiddleware = require('./app').sessionMiddleware;

var online_users = [],
    available_users = [],
    io;

function on_connect(socket) {
  var username = socket.request.session.username;

  if (!username) return socket.disconnect();

  socket.username = username;

  online_users.push(username);
  console.log('connect ' + JSON.stringify(online_users));
  io.emit('online_users_change', online_users);

  available_users.push(username);
  io.emit('available_users_change', available_users);

  console.log(username + ' connect successfully');

  socket.on('message', function(msg){
    io.emit('message', username + ': ' + msg);
  });

  socket.on('force_disconnect', socket.disconnect);

  socket.on('disconnect', disconnect_socket(username));

  socket.on('invitation', invite_user(socket));

  socket.on('cancel_invitation', cancel_invitation(socket));

  socket.on('accept_invitation', accept_invitation(socket));

  socket.on('refuse_invitation', refuse_invitation(socket));
}

function disconnect_socket(username) {
  return function(socket) {
    for (var i = 0; i < online_users.length; i++) {
      if (online_users[i] === username) {
        online_users.splice(i, 1);

        console.log('disconnect ' + JSON.stringify(online_users));
        io.emit('online_users_change', online_users);
        console.log(username + ' disconnect successfully');
        break;
      }
    }

    for (var i = 0; i < available_users.length; i++) {
      if (available_users[i] === username) {
        available_users.splice(i, 1);
        io.emit('available_users_change', available_users);
        break;
      }
    }

  }
}

function invite_user(inviter_socket) {
  return function(invitee) {
    var sockets = io.sockets.sockets,
        invitee_id;

    console.log('invite: ' + invitee);

    if (inviter_socket.invitee) return;

    for (var i = 0; i < sockets.length; i++) {
      if (sockets[i].username === invitee) {
        invitee_id = sockets[i].id;
        inviter_socket.invitee = invitee_id;
        io.to(invitee_id).emit('invitation', inviter_socket.username);

        return;
      }
    }

    io.to(inviter_socket.id).emit('invitation_error');
  }
}

function cancel_invitation(socket) {
  return function() {

    if (!socket.invitee) return;

    console.log('cancel_invitation: ' + socket.username);

    io.to(socket.invitee).emit('cancel_invitation', socket.username);
    delete socket.invitee;
  }
}

function accept_invitation(invitee_socket) {
  var invitee_id = invitee_socket.id;

  return function(inviter) {
    var sockets = io.sockets.sockets,
        inviter_id,
        room_id;

    for (var i = 0; i < sockets.length; i++) {
      if (sockets[i].username === inviter) {
        if (invitee_id !== sockets[i].invitee) return;

        room_id = inviter_id + '-' + invitee_id;
        delete sockets[i].invitee;

        sockets[i].single_chat = {
          room_id: room_id,
          username: invitee_socket.username
        }
        invitee_socket.single_chat = {
          room_id: room_id,
          username: inviter
        }

        sockets[i].join(room_id);
        invitee_socket.join(room_id);

        io.to(sockets[i].id).emit('accept_invitation');

        console.log(invitee_socket.username + ' accept invitation from '+ inviter);

        return;
      }
    }
  }
}

function refuse_invitation(invitee_socket) {
  var invitee_id = invitee_socket.id;

  return function(inviter) {
    var sockets = io.sockets.sockets;

    for (var i = 0; i < sockets.length; i++) {
      if (sockets[i].username === inviter) {
        if (invitee_id !== sockets[i].invitee) return;

        delete sockets[i].invitee;
        io.to(sockets[i].id).emit('refuse_invitation');

        console.log(invitee_socket.username + ' refuse invitation from '+ inviter);

        return;
      }
    }
  }

}

module.exports = function(server) {
  io = require('socket.io')(server);

  io.use(function(socket, next) {
      sessionMiddleware(socket.request, socket.request.res, next);
  });

  io.on('connection', on_connect);
}
