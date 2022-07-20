var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// CORS Package
const cors = require('cors');
let corsOption = {
	origin: 'https://se-ek.com',
	credentials: true
};

// DotEnv Package
require('dotenv').config();
const base_route = './routes';
var indexRouter = require(base_route + '/index');

// Routes for DB connection
var userRouter = require(base_route + '/user');
var authRouter = require(base_route + '/auth');
var artworkRouter = require(base_route + '/artwork');
var commentRouter = require(base_route + '/comment');
var eventRouter = require(base_route + '/event');
var publicRouter = require(base_route + '/public');
var storageRouter = require(base_route + '/storage');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOption));

app.use('/', indexRouter);

// Deploy routes for DB connection
app.use('/server-api/user', userRouter);
app.use('/server-api/auth', authRouter);
app.use('/server-api/artwork', artworkRouter);
app.use('/server-api/comment', commentRouter);
app.use('/server-api/event', eventRouter);
app.use('/server-api/public', publicRouter);
app.use('/server-api/storage', storageRouter);

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
