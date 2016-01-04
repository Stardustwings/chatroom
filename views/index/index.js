$(function() {
  $('.login form').submit(login_submit);

  $('.register form').submit(register_submit);

  $('.switch').click(switch_mode);
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

function switch_mode() {
  $('.login').toggleClass('hidden');
  $('.register').toggleClass('hidden');
}