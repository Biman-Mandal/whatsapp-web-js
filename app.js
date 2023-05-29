// Setting Up .env
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path    = require('path');

const indexRouter    = require('./routes/index');
const usersRouter    = require('./routes/users');
const whatsappAuthRouter    = require('./routes/auth');
const whatsappContactRouter = require('./routes/contact');
const whatsappChattingRouter= require('./routes/chatting');
const fs = require('fs');

// If Qr Directory not exists 
if (!fs.existsSync(path.join(__dirname, './qr/'))) {
  fs.mkdirSync(path.join(__dirname, './qr/'));
  console.log('QR Directory created successfully');
}
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

app.use(function (req, res, next) {
  console.log(req.method + " : " + req.path);
  next();
});

module.exports = app;