var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// ---------------------------------

var users = require('./users.json');

var online_users = [];

var sessionMiddleware = session({
  secret: 'my_chatroom',
  resave: false,
  saveUninitialized: true
})

// ---------------------------------

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static('views'));
app.use(sessionMiddleware);

app.set('view engine', 'jade');

// ---------------------------------

app.get('/', function (req, res) {
  var username = req.session.username;

  if (!username) res.render('index/index');
  else res.render('room/room', {users: online_users, username: username});
});

app.post('/login', function (req, res) {
  var username = req.body.username,
      password = req.body.password;

  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username && users[i].password === password) {
      req.session.username = username;
      res.json({success: true});

      return;
    }
  }

  res.json({success: false});
});

app.post('/register', function (req, res) {
  try {
    var username = req.body.username,
        password = req.body.password,
        new_user;

    for (var i = 0; i < users.length; i++) {
      if (users[i].username === username) {
        return res.json({success: false});
      }
    }

    new_user = {username: username, password: password}
    users.push(new_user);
    fs.writeFileSync('./users.json', JSON.stringify(users));

    req.session.username = username;
    res.json({success: true});
  } catch (err) {
    console.log('err: ' + err);
  }

});

app.post('/logout', function (req, res) {
  delete req.session.username;

  res.json({success: true})
});

// ---------------------------------

io.on('connection', function(socket){
  var username = socket.request.session.username;

  if (!username) return socket.disconnect();

  online_users.push(username);

  io.emit('online_users_change', online_users);

  console.log(username + ' connect successfully');

  console.log(JSON.stringify(online_users));

  socket.on('message', function(msg){
    io.emit('message', username + ': ' + msg);
  });

  socket.on('force_disconnect', socket.disconnect);

  socket.on('disconnect', function(socket){
    for (var i = 0; i < online_users.length; i++) {
      if (online_users[i] === username) {
        online_users.splice(i, 1);
        io.emit('online_users_change', online_users);
        console.log(username + ' disconnect successfully');
        return;
      }
    }
  });
});



// ---------------------------------

server.listen(3000, function () {
  var host = 'localhost';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
