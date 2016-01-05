
var socket;

$(function() {
  socket = io(window.location.href);

  $('.logout').click(logout);

  $('.input-area form').submit(send_message);

  socket.on('message', append_message);

  socket.on('online_users_change', change_user_list);
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

function change_user_list(users) {
  var user_list = $('.user-list'),
      user_item_template = $('.user-item.template').clone().removeClass('template'),
      user_item;

  user_list.empty();

  for (var i = 0 ; i < users.length; i++) {
    user_item = user_item_template.clone().text(users[i]);
    user_list.append(user_item);
  }

}
