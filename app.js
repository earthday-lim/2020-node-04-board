/* node modules */
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const createError = require('http-errors');
const { upload } = require('./modules/multer-conn');
const session = require('express-session'); //불러와진 건 미들웨어

/* modules */
//const { pool } = require('./modules/mysql-conn');
const logger = require('./modules/morgan-conn');
const boardRouter = require('./routes/board');
const galleryRouter = require('./routes/gallery');
const userRouter = require('./routes/user');

/* 서버 구동 */
app.listen(process.env.PORT, () => {console.log(`http://127.0.0.1:${process.env.PORT}`);}); //콜백없어도 됨

/* Initialize */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));//절대경로를 줄 땐 path.join()
app.locals.pretty = true; //client한테 보내줄 때 정리 잘 해서 보내줄게요

/* middleware */
//=> (req, res, next)를 갖고 있는 애들 : req가 모든 정보를 갖고 있고 내가 할 일 하고 next로 내보내주는 애들
//app.use(logger, express.json(), express.urlencoded({extended: false}));
app.use(logger);
app.unsubscribe((req, res, next) => {
  express.json()(req, res, json); //express.json()이 미들웨어를 (req, res, json)여기서 실행한다는 뜻
});
//app.use(express.json());
app.use(express.urlencoded({extended: false}));
/* session처리 */
// app.use((req, res, next) => {
//   console.log(req.session); //req.session : undefined
//   next();
// });
app.use(session({ //{옵션-use안에 들어가는 거니까 req,res,next를 가진 함수가 실행됨}을 줘서 실행함
  secret: process.env.SESSION_SALT,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } //https : true, http : false 개발할 땐 false로 해도 배포할 시 반드시 true로 바꿔야 함
}));
// app.use((req, res, next) => {
//   console.log(req.session); //req.session : session 성공
//   next();
// });

/* router */
app.use('/', express.static(path.join(__dirname, './public')));//절대경로를 줄 땐 path.join()
app.use('/storage', express.static(path.join(__dirname, './uploads')));
app.use('/board', boardRouter);
app.use('/gallery', galleryRouter);
app.use('/user', userRouter);
/* app.get('/err', (req, res, next) => {
  const err = new Error();
  next(err); //젤 마지막 app.use()로 보냄
}); */
app.get('/test/upload', (req, res, next) => { ///test/upload로 요청이 들어온다면, req,res,next로 가서
  res.render('test/upload'); //test/upload.pug를 열고 html로 해석해서 브라우저에  보여라
});

app.post('/test/save', upload.single('upfile'), (req, res, next) => {
  // const { title, upfile } = req.body;
  // res.redirect('/board');
  // res.json(req.allowUpload);
  res.json(req.file);
});

/* error 평범한 에러 */
app.use((req, res, next) => {
  //const err = new Error();
  //err.code = 404; //http상태코드 구글검색
  //err.msg = '요청하신 페이지를 찾을 수 없습니다.';
  //next(error);
  next(createError(404, '요청하신 페이지를 찾을 수 없습니다.'));
});

app.use((err, req, res, next) => { //모든 에러가 모이는 곳, 마지막 미들웨어는 인자가 err까지 총 4개
  let code = err.status || 500; //내가 받은 err의 code가 존재한다면 변수code 걔를 넣어주고 아니면 500을 넣어줘
  let message = err.status == 404 ?
  '페이지를 찾을 수 없습니다.' : '서버 내부 오류입니다. 관리자에게 문의하세요.';
  let msg = process.env.SERVICE !== 'production' ? err.message || message : message;
  res.render('./error.pug', {code, msg});
});