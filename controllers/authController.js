require("dotenv").config();
var session = require('express-session');

exports.login = function(req, res) {
  const { email, password, rememberme } = req.body;
  
  if (email === process.env.USER_NAME && password === process.env.PASSWORD) {
    req.session.isLoggedIn = true; 

    if (rememberme) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
    } else {
      req.session.cookie.expires = false; 
    }

    res.redirect('/'); 
  } else {
    res.status(401).send('Authentication failed');
  }
};