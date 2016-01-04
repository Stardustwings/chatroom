
var socket = io('http://localhost:3000');

$(function() {
  $('.logout').click(logout);

  $('.input-area form').submit(send_message);

  socket.on('message', append_message);
});

function logout() {
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
}

