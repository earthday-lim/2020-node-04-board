const express = require('express');
const router = express.Router();
const createError = require('http-errors'); //error쉽게 만들 수 있게 하는 애
const bcrypt = require('bcrypt');
const { sqlGen } = require('../modules/mysql-conn');
const { alert } = require('../modules/util');

router.get('/join', () => (req, res, next) => {
  const pug = {title: '회원 가입', js: 'user-fr', css: 'user-fr'}
  res.render('user/join', pug);
});



router.get('/idchk/:userid', async (req, res, next) => {
  try {
    let rs = await sqlGen('users', 'S', {
      where: ['userid', req.params.userid],
      field: ['userid']
    });
    if(rs[0][0].length > 0) res.json({code: 200, isUsed: false});
    else res.json({code: 200, isUsed: true});
  }catch(e) {
    res.json({code: 500, error: e.sqlMessage || e}); //booldook깃헙 퍼블2반 modules/mysql-conn으로 mysql-conn바꾸기 version up
  }
});

router.post('/save', async (req, res, next) => {
  req.body.userpw = await bcrypt.hash(req.body.userpw + process.env.BCRYPT_SALT, Number(process.env.BCRYPT_ROUND));
  try {
    let rs = await sqlGen('users', 'I', {
      field : ['userid', 'userpw', 'username'],
      data : req.body
    });
    if(rs[0].affectedRows == 1) {
      res.send(alert('회원가입이 완료되었습니다. 로그인 해주세요.', '/user/login'));
    }
    else res.send(alert('회원가입이 실패했습니다. 다시 시도해주세요.', '/user/join'));
  }catch(e){
    next(createError(500, e.sqlMessage || e));
  }
});

router.get('/login', (req, res, next) => {
  const pug = {title: '회원 로그인', js: 'user-fr', css: 'user-fr'}
  res.render('user/login', pug);
});

router.post('/logon', async (req, res, next) => {
  try{
    let rs = await sqlGen('users', 'S', {
      where: ['userid', req.body.userid],
    });
    if(rs[0].length > 0){
      let compare = await bcrypt.compare(req.body.userpw + process.env.BCRYPT_SALT, rs[0][0].userpw);
      if(compare) { //일치한다면 회원이구나
        //세션처리
        res.send(alert('로그인되었습니다.', '/board'));
      }else{ //일치하지 않는다면 비회원이구나
        res.send(alert('정보가 올바르지 않습니다.', '/user/login'));
      }
    }else{
      res.send(alert('정보가 올바르지 않습니다.', '/user/login'));
    }
  }catch(e){
    next(createError(500, e.sqlMessage || e));
  }
});

module.exports = router;