var express = require('express'),
    fs = require('fs');

var users = require('./data/users.json');
var router = express.Router();

router.get('/', function (req, res) {
  var username = req.session.username;

  if (!username) return res.render('index/index');

  res.render('room/room', {username: username});
});

router.post('/login', function (req, res) {
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

router.post('/register', function (req, res) {
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
    fs.writeFileSync('./data/users.json', JSON.stringify(users));

    req.session.username = username;
    res.json({success: true});
  } catch (err) {
    console.log('err: ' + err);
  }

});

router.post('/logout', function (req, res) {
  delete req.session.username;

  res.json({success: true})
});

module.exports = router;
