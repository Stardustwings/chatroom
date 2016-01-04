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
  if (!req.session.username) res.render('index/index');
  else res.render('room/room', {users: users});
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
});

app.post('/logout', function (req, res) {
  delete req.session.username;

  res.json({success: true})
});

// ---------------------------------

// require('socketio-auth')(io, {
//   authenticate: authenticate,
//   postAuthenticate: postAuthenticate
// });

function authenticate(socket, data, callback) {
  var username = data.username,
      password = data.password;

  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username) {
      callback(null, users[i].password === password);

      return;
    }
  }

  callback(new Error("User not found"));
}

function postAuthenticate(socket, data) {
  var username = data.username;

  console.log('post auth');

  socket.client.username = username
}

io.on('connection', function(socket){
  console.log('Connect successfully');

  socket.on('message', function(msg){
    console.log('get message');

    console.log(socket.request.session);

    io.emit('message', msg);
  });
});

// ---------------------------------

server.listen(3000, function () {
  var host = 'localhost';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
