/* node modules */
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const createError = require('http-errors');

/* 서버 구동 */
app.listen(process.env.PORT, () => {console.log(`http://127.0.0.1:${process.env.PORT}`);}); //콜백없어도 됨

const first = (req, res, next) => {
  console.log('FIRST');
  req.test = 'first';
  next();
}

const third = (value) => {
  return (req, res, next) => {
    console.log(value);
    next();
  }
}

app.get('/', third('THIRD'), (req, res, next) => {
  console.log('SECOND');
  console.log(req.test);
  res.send('<h1>HELLO</h1>');
});