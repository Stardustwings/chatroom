
var socket;

$(function() {
  socket = io(window.location.href);

  $('.logout').click(logout);
  $('.input-area form').submit(send_message);

  socket.on('message', append_message);
  socket.on('online_users_change',
    change_user_list('.online-user-list', '.online-user-item'));

  $(document).on('click', '.available-user-item', select_available_user);
  $(document).click(cancel_select);
  $('.invite-btn').click(invite_user);
  $('.accept-btn').click(accept_invitation);
  $('.refuse-btn').click(refuse_invitation);


  socket.on('available_users_change',
    change_user_list('.available-user-list', '.available-user-item'));
  socket.on('invitation', get_invitation());

});

function logout() {
  socket.emit('force_disconnect');

  $.post('/logout').done(function(data) {
    if (data.success) location.reload();
  });
}

function send_message() {
  var message = $('.input-area form input').val();

  if (message === '') return false;

  socket.emit('message', message);
  $('.input-area form input').val('');
  return false;
}

function append_message(msg) {
  var new_message = $('.message.template').clone();

  new_message.removeClass('template').text(msg);

  $('.message-area').append(new_message);

  $(".message-area").scrollTop($(".message-area")[0].scrollHeight);
}


function select_available_user() {
  $('.available-user-item').removeClass('selected');
  $(this).addClass('selected');

  return false;
}


function change_user_list(user_list_str, user_item_str) {
  return function change_available_user_list(users) {
    var user_list = $(user_list_str),
        user_item_template = $(user_item_str + '.template').clone().removeClass('template'),
        username = $('.username').text(),
        user_item;

    $(user_item_str).not('.template').remove();

    for (var i = 0 ; i < users.length; i++) {
      if (users[i] === username) continue;

      user_item = user_item_template.clone().text(users[i]);
      user_list.append(user_item);
    }
  }
}

function cancel_select() {
  $('.selected').removeClass('selected');
}

function invite_user() {
  var invite_btn = $(this),
      selected_user;

  if ($('.available-user-item.selected').length === 0) return false;

  selected_user = $('.available-user-item.selected').text();
  socket.emit('invitation', selected_user);

  return false;
}

function accept_invitation() {
  return false;
}

function refuse_invitation() {
  return false;
}

function get_invitation() {
  var invitations = [];

  return function(inviter) {
    console.log('inviter: ' + inviter);

    for (var i = 0; i < invitations.length; i++) {
      if (invitations[i] === inviter) return;
    }

    invitations.push(inviter);

    change_user_list('.inviting-user-list', '.inviting-user-item')(invitations);
  }
}
