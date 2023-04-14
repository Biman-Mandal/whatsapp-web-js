const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path    = require('path');

const indexRouter    = require('./routes/index');
const usersRouter    = require('./routes/users');
const whatsappAuthRouter    = require('./routes/auth');
const whatsappContactRouter = require('./routes/contact');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/whatsapp-js', whatsappAuthRouter);
app.use('/whatsapp-js/contact', whatsappContactRouter);

app.use(function (req, res, next) {
  console.log(req.method + " : " + req.path);
  next();
});

module.exports = app;