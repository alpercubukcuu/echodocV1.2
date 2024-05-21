var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var usersRouter = require('./routes/users');
var authRoutes = require('./routes/auth');
var summaryRoutes = require('./routes/summary');
const assemblyRoutes = require('./routes/assemblyRoutes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,  
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto', maxAge: 3600000 }  
}));

function ensureAuthenticated(req, res, next) {
  if (!req.session.isLoggedIn) {
    res.redirect('/login');
  } else {
    next();
  }
}
app.use('/api/auth', authRoutes);
app.use('/', loginRouter);

app.use('/', ensureAuthenticated,indexRouter);
app.use('/users', usersRouter);
app.use('/api/summary', summaryRoutes);
app.use('/api/assembly', assemblyRoutes);



app.use(
  "/assemblyai.js",
  express.static(
    path.join(__dirname, "node_modules/assemblyai/dist/assemblyai.umd.js")
  )
);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
