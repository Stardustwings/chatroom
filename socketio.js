var fs = require('fs');
var sessionMiddleware = require('./app').sessionMiddleware;

var online_users = [],
    available_users = [],
    io;

function on_connect(socket) {
  var username = socket.request.session.username;

  if (!username) return socket.disconnect();

  socket.username = username;

  add_online_user(username);
  add_available_user(username);

  socket.on('message', send_group_message(socket));
  socket.on('force_disconnect', socket.disconnect);
  socket.on('disconnect', disconnect_socket(username));
  socket.on('invitation', invite_user(socket));
  socket.on('cancel_invitation', cancel_invitation(socket));
  socket.on('accept_invitation', accept_invitation(socket));
  socket.on('refuse_invitation', refuse_invitation(socket));
  socket.on('single_message', send_single_message(socket));
  socket.on('leave_single_chat', handle_leave_request(socket));
}

 function get_socket_by_username(username) {
  var sockets = io.sockets.sockets;

  for (var i = 0; i < sockets.length; i++) {
    if (sockets[i].username === username) {
      return sockets[i];
    }
  }

  return;
 }

function add_online_user(username) {
  for (var i = 0; i < online_users.length; i++) {
    if (online_users[i] === username) return false;
  }

  online_users.push(username);
  io.emit('online_users_change', online_users);
  console.log(username + ' connect successfully');
  return true;
}

function remove_online_user(username) {
  for (var i = 0; i < online_users.length; i++) {
    if (online_users[i] === username) {
      online_users.splice(i, 1);
      io.emit('online_users_change', online_users);
      console.log(username + ' disconnect successfully');
      return true;
    }
  }

  return false;
}

function add_available_user(username) {
  for (var i = 0; i < available_users.length; i++) {
    if (available_users[i] === username) return false;
  }

  available_users.push(username);
  io.emit('available_users_change', available_users);
  return true;
}

function remove_available_user(username) {
  for (var i = 0; i < available_users.length; i++) {
    if (available_users[i] === username) {
      available_users.splice(i, 1);
      io.emit('available_users_change', available_users);
      return true;
    }
  }

  return false;
}

function disconnect_socket(username) {
  return function(socket) {
    var another_user,
        another_user_socket,
        room_id;

    if (socket.single_chat) {
      another_user = socket.single_chat.username;
      leave_single_chat(another_user);
    }

    remove_online_user(username);
    remove_available_user(username);

  }
}

function send_group_message(socket) {
  return function(msg) {
    var username = socket.username;

    io.emit('message', username + ': ' + msg);
  }
}

function send_single_message(socket) {
  return function(msg) {
    var room_id,
        username;

    if (!socket.single_chat) return;

    room_id = socket.single_chat.room_id;
    username = socket.username;

    console.log(username + ' send single message');

    io.to(room_id).emit('single_message', username + ': ' + msg);
  }
}

function invite_user(inviter_socket) {
  return function(invitee) {
    var invitee_socket,
        invitee_id;

    if (inviter_socket.invitee || inviter_socket.single_chat) return;

    console.log('invite: ' + invitee);
    invitee_socket = get_socket_by_username(invitee);

    if (!invitee_socket) return;

    invitee_id = invitee_socket.id;
    inviter_socket.invitee = invitee_id;
    io.to(invitee_id).emit('invitation', inviter_socket.username);
  }
}

function enter_single_chat(socket, room_id, username) {
  remove_available_user(socket.username);

  socket.single_chat = {
    room_id: room_id,
    username: username
  }

  socket.join(room_id);
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
  return function(inviter) {
    var invitee = invitee_socket.username,
        invitee_id = invitee_socket.id,
        inviter_socket = get_socket_by_username(inviter),
        inviter_id,
        room_id;

    if (!inviter_socket || inviter_socket.invitee != invitee_id) return;

    inviter_id = inviter_socket.id;
    room_id = inviter_id + '-' + invitee_id;
    delete inviter_socket.invitee;

    enter_single_chat(inviter_socket, room_id, invitee);
    enter_single_chat(invitee_socket, room_id, inviter);

    io.to(room_id).emit('accept_invitation');

    console.log(invitee_socket.username + ' accept invitation from '+ inviter);

    return;
  }
}

function refuse_invitation(invitee_socket) {
  return function(inviter) {
    var inviter_socket = get_socket_by_username(inviter),
        invitee_id = invitee_socket.id,
        invitee = invitee_socket.username;


    if (!inviter_socket || inviter_socket.invitee !== invitee_id) return;

    delete inviter_socket.invitee;
    io.to(inviter_socket.id).emit('refuse_invitation');

    console.log(invitee + ' refuse invitation from '+ inviter);
  }
}

function handle_leave_request(socket) {
  return function() {
    var another_user,
        room_id;

    if (!socket.single_chat) return;

    another_user = socket.single_chat.username;
    room_id = socket.single_chat.room_id;

    io.to(room_id).emit('leave_single_chat');
    leave_single_chat('', socket);
    leave_single_chat(another_user);
  }
}

function leave_single_chat(username, socket) {
  var room_id;

  if(!socket) socket = get_socket_by_username(username);
  else username = socket.username;

  if (!socket || !socket.single_chat) return;

  room_id = socket.single_chat.room_id;
  socket.leave(room_id);
  delete socket.single_chat;
  add_available_user(username)

  console.log(username + ' leave single chat');
}

module.exports = function(server) {
  io = require('socket.io')(server);

  io.use(function(socket, next) {
      sessionMiddleware(socket.request, socket.request.res, next);
  });

  io.on('connection', on_connect);
}

