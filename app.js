var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// CORS Package
const cors = require('cors');
let corsOption = {
	origin: 'https://seek-mobile.netlify.app',
	credentials: true
};

// DotEnv Package
require('dotenv').config();
const base_route = './routes/' + process.env.VERSION;

var indexRouter = require(base_route + '/index');

// Routes for DB connection
if (process.env.VERSION === '0.1.0') {
	var userRouter = require(base_route + '/user');
	var artistRouter = require(base_route + '/artist');
	var artworkRouter = require(base_route + '/artwork');
	var loginRouter = require(base_route + '/login');
	var authRouter = require(base_route + '/auth');
	var curatorRouter = require(base_route + '/curator');
	var searchRouter = require(base_route + '/search');
	var readRouter = require(base_route + '/read');
	var writeRouter = require(base_route + '/write');
	var adRouter = require(base_route + '/advertisement');
	var eventRouter = require(base_route + '/event');
	var replyRouter = require(base_route + '/reply');
}
else if (process.env.VERSION == '0.2.0') {
	// TODO : Insert routes declaration here
	var storageRouter = require(base_route + '/storage');
	var eventRouter = require(base_route + '/event');
	var metadataRouter = require(base_route + '/metadata');
	var pageRouter = require(base_route + '/page');
	var userRouter = require(base_route + '/user');
	var artistRouter = require(base_route + '/artist');
	var artworkRouter = require(base_route + '/artwork');
	var publicRouter = require(base_route + '/public');
}

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
if (process.env.VERSION === '0.1.0') {
	app.use('/server-api/user', userRouter);
	app.use('/server-api/artist', artistRouter);
	app.use('/server-api/artwork', artworkRouter);
	app.use('/server-api/login', loginRouter);
	app.use('/server-api/auth', authRouter);
	app.use('/server-api/curator', curatorRouter);
	app.use('/server-api/search', searchRouter);
	app.use('/server-api/read', readRouter);
	app.use('/server-api/write', writeRouter);
	app.use('/server-api/ad', adRouter);
	app.use('/server-api/event', eventRouter);
	app.use('/server-api/reply', replyRouter);
}
else if (process.env.VERSION === '0.2.0') {
	// TODO : Insert routes deployment here
	app.use('/server-api/storage', storageRouter);
	app.use('/server-api/event', eventRouter);
	app.use('/server-api/metadata', metadataRouter);
	app.use('/server-api/page', pageRouter);
	app.use('/server-api/user', userRouter);
	app.use('/server-api/artist', artistRouter);
	app.use('/server-api/artwork', artworkRouter);
	app.use('/server-api/public', publicRouter);
}

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
