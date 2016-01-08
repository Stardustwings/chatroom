$(function() {
  $('.login form').submit(login_submit);
  $('.register form').submit(register_submit);
  $('.login-tab').click(switch_to_login);
  $('.register-tab').click(switch_to_register);
});

function login_submit(event) {
  $.post('/login', $(event.target).serialize())
    .done(function(data) {
      if (data.success) location.reload();
    });

  return false;
}

function register_submit(event) {
  $.post('/register', $(event.target).serialize())
    .done(function(data) {
      if (data.success) location.reload();
    });

  return false;
}

function switch_to_login() {
  $('.register-tab').removeClass('selected');
  $('.login').removeClass('hidden');

  if (!$('.login-tab').hasClass('selected'))
    $('.login-tab').addClass('selected');
  if (!$('.register').addClass('hidden'))
    $('.register').addClass('hidden');

  return false;
}

function switch_to_register() {
  $('.login-tab').removeClass('selected');
  $('.register').removeClass('hidden');

  if (!$('.register-tab').hasClass('selected'))
    $('.register-tab').addClass('selected');
  if (!$('.login').addClass('hidden'))
    $('.login').addClass('hidden');

  return false;
}