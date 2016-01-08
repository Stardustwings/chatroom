
var socket;

$(function() {
  socket = io(window.location.href);

  $('.logout').click(logout);
  $('.group-chat .input-area form').submit(send_message);

  socket.on('message', append_message);

  socket.on('online_users_change',
    change_user_list('.online-user-list', '.online-user-item'));

  $(document).on('click', '.available-user-item', select_available_user);
  $(document).on('click', '.inviting-user-item', select_inviting_user);
  $(document).click(cancel_select);
  $('.invite-btn').click(invite_user);
  $('.accept-btn').click(accept_invitation);
  $('.refuse-btn').click(refuse_invitation);


  socket.on('available_users_change',
    change_user_list('.available-user-list', '.available-user-item'));
  socket.on('invitation', get_invitation);
  socket.on('cancel_invitation', remove_invitation);
  socket.on('refuse_invitation', cancel_invite);
  socket.on('accept_invitation', enter_single_chat_room);

  $('.single-chat .input-area form').submit(send_single_message);
  $('.leave-btn').click(leave_single_chat);

  socket.on('single_message', append_single_message);
  socket.on(receive_leave_message);
});

function logout() {
  socket.emit('force_disconnect');

  $.post('/logout').done(function(data) {
    if (data.success) location.reload();
  });
}

function send_message() {
  var group_chat_input = $('.group-chat .input-area form input'),
      message = group_chat_input.val();

  if (message === '') return false;

  socket.emit('message', message);
  group_chat_input.val('');
  return false;
}

function append_message(msg) {
  var new_message = $('.group-chat .message.template').clone(),
      message_area = $('.group-chat .message-area');

  new_message.removeClass('template').text(msg);

  message_area.append(new_message);

  message_area.scrollTop(message_area[0].scrollHeight);
}


function select_available_user() {
  $('.available-user-item').removeClass('selected');
  $(this).addClass('selected');

  return false;
}

function select_inviting_user() {
  $('.inviting-user-item').removeClass('selected');
  $(this).addClass('selected');

  return false;
}

function change_user_list(user_list_str, user_item_str) {
  return function (users) {
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
      selected_element = $('.available-user-item.selected');

  if (invite_btn.hasClass('is-inviting')) {
    invite_btn.text('邀请');
    invite_btn.removeClass('is-inviting');
    socket.emit('cancel_invitation');
    return false;
  }

  if (selected_element.length === 0) return false;

  invite_btn.text('取消');
  selected_element.removeClass('selected');
  selected_user = selected_element.text();
  invite_btn.addClass('is-inviting');
  socket.emit('invitation', selected_user);

  return false;
}

function accept_invitation() {
  var selected_element = $('.inviting-user-item.selected');

  if (selected_element.length === 0) return false;

  selected_user = selected_element.text();
  socket.emit('accept_invitation', selected_user);

  return false;
}

function refuse_invitation() {
  var selected_element = $('.inviting-user-item.selected');

  if (selected_element.length === 0) return false;

  selected_user = selected_element.text();
  remove_invitation(selected_user);
  socket.emit('refuse_invitation', selected_user);

  return false;
}


function get_invitation(inviter) {
  var invitation_elements = $('.inviting-user-item'),
      jq_element,
      new_user_item;

  console.log('inviter: ' + inviter);

  for (var i = 0; i < invitation_elements.length; i++) {
    jq_element = $(invitation_elements[i])

    if (jq_element.text() === inviter) return;
  }

  new_user_item = $('.inviting-user-item.template').clone()
                  .removeClass('template').text(inviter);

  $('.inviting-user-list').append(new_user_item);
};

function remove_invitation(inviter) {
  var invitation_elements = $('.inviting-user-item'),
      jq_element;

  console.log('remove inviter: ' + inviter);

  for (var i = 0; i < invitation_elements.length; i++) {
    jq_element = $(invitation_elements[i])

    if (jq_element.text() === inviter) {
      jq_element.remove();
      return;
    }
  }
};

function cancel_invite() {
  var invite_btn = $('.invite-btn');

  if (!invite_btn.hasClass('is-inviting')) return;

  invite_btn.text('邀请');
  invite_btn.removeClass('is-inviting');
  alert('你的邀请已被拒绝');
}

function enter_single_chat_room() {
  alert('你的邀请已被接受');
}

function send_single_message() {
  var single_chat_input = $('.single-chat .input-area form input'),
      message = single_chat_input.val();

  if (message === '') return false;

  socket.emit('single_message', message);
  single_chat_input.val('');
  return false;
}

function leave_single_chat() {
  socket.emit('leave_single_chat');
}

function append_single_message(msg) {
  var new_message = $('.single-chat .message.template').clone(),
      message_area = $('.single-chat .message-area');

  console.log('receive single message');

  new_message.removeClass('template').text(msg);

  message_area.append(new_message);

  message_area.scrollTop(message_area[0].scrollHeight);
}

function receive_leave_message() {
  console.log('receive leave message');
}
