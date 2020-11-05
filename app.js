/* node modules */
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const { upload } = require('./modules/multer-conn');

/* modules */
//const { pool } = require('./modules/mysql-conn');
const logger = require('./modules/morgan-conn');
const boardRouter = require('./routes/board');
const galleryRouter = require('./routes/gallery');

/* 서버 구동 */
app.listen(process.env.PORT, () => {console.log(`http://127.0.0.1:${process.env.PORT}`);}); //콜백없어도 됨

/* Initialize */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));//절대경로를 줄 땐 path.join()
app.locals.pretty = true; //client한테 보내줄 때 정리 잘 해서 보내줄게요

/* middleware */
//=> (req, res, next)를 갖고 있는 애들 : req가 모든 정보를 갖고 있고 내가 할 일 하고 next로 내보내주는 애들
app.use(logger, express.json(), express.urlencoded({extended: false}));
// app.use(express.json());
// app.use(express.urlencoded({extended: false}));

/* router */
app.use('/', express.static(path.join(__dirname, './public')));//절대경로를 줄 땐 path.join()
app.use('/storage', express.static(path.join(__dirname, './uploads')));
app.use('/board', boardRouter);
app.use('/gallery', galleryRouter);
/* app.get('/err', (req, res, next) => {
  const err = new Error();
  next(err); //젤 마지막 app.use()로 보냄
}); */
app.get('/test/upload', (req, res, next) => { ///test/upload로 요청이 들어온다면, req,res,next로 가서
  res.render('test/upload'); //test/upload.pug를 열고 html로 해석해서 브라우저에 띄워라
});

app.post('/test/save', upload.single('upfile'), (req, res, next) => {
  const { title, upfile } = req.body;
  res.redirect('/board');
});

/* error 평범한 에러 */
app.use((req, res, next) => {
  const err = new Error();
  err.code = 404; //http상태코드 구글검색
  err.msg = '요청하신 페이지를 찾을 수 없습니다.';
  next(err);
});

app.use((err, req, res, next) => { //모든 에러가 모이는 곳, 마지막 미들웨어는 인자가 err까지 총 4개
  console.log(err);
  const code = err.code || 500; //내가 받은 err의 code가 존재한다면 변수code 걔를 넣어주고 아니면 500을 넣어줘
  const msg = err.msg || '서버 내부 오류입니다. 관리자에게 문의하세요.';
  res.render('./error.pug', {code, msg});
});