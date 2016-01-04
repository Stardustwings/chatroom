$(function() {
  $('.login form').submit(login_submit);

  $('.register form').submit(register_submit);

  $('.switch').click(switch_mode);
});

// function login_submit(event) {
//   var socket = io.connect('http://localhost:3000'),
//       username = $('.login input[name=username]').val(),
//       password = $('.login input[name=password]').val();

//   socket.on('connect', function(){
//     socket.emit('authentication', {username: username, password: password});

//     socket.on('authenticated', function() {
//       console.log('Authenticate successfully');

//       $.post('/login', $(event.target).serialize())
//         .done(function(data) {
//           if (data.success) location.reload();
//         });
//     });

//     socket.on('unauthorized', function(err){
//       console.log("There was an error with the authentication:", err.message);
//     });

//   });

//   return false;
// }

function login_submit(event) {
  $.post('/login', $(event.target).serialize())
    .done(function(data) {
        location.reload();
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