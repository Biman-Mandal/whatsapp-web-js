const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path    = require('path');

const indexRouter    = require('./routes/index');
const usersRouter    = require('./routes/users');
const whatsappAuthRouter    = require('./routes/auth');
const whatsappContactRouter = require('./routes/contact');
const whatsappChattingRouter= require('./routes/chatting');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/whatsapp-js/auth', whatsappAuthRouter);
app.use('/whatsapp-js/contact', whatsappContactRouter);
app.use('/whatsapp-js/chatting', whatsappChattingRouter);

// Client Initialize Middleware 
app.use(function(req, res, next) {
    next();
});

app.use(function (req, res, next) {
  console.log(req.method + " : " + req.path);
  next();
});

module.exports = app;