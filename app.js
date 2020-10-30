/* node modules */
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

/* modules */
const { pool } = require('./modules/mysql-conn');
const boardRouter = require('./routes/board');
const galleryRouter = require('./routes/gallery');

/* 서버 구동 */
app.listen(process.env.PORT, () => {console.log(`http://127.0.0.1:${process.env.PORT}`);}); //콜백없어도 됨

/* Initialize */
app.set('view-engine', 'pug');
app.set('views', path.join(__dirname, './views'));//절대경로를 줄 땐 path.join()
app.locals.pretty = true;

/* middleware */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* router */
app.use('/', express.static(path.join(__dirname, './public')));//절대경로를 줄 땐 path.join()
app.use('/board', boardRouter);
app.use('/gallery', galleryRouter);