const express = require('express');
const moment = require('moment');
const router = express.Router();
const {pool} = require('../modules/mysql-conn');

router.get(['/', '/list'], async (req, res, next) => {
  const pug = {title: '게시판 리스트', jsFile: 'board', cssFile: 'board'};
  //node 데이터 가져오기 async await가 있어야 함
  try {
    var sql = 'SELECT * FROM board ORDER BY id DESC';
    const connect = await pool.getConnection();
    const result = await connect.query(sql);
    pug.lists = result[0];
    pug.lists.forEach((v) => { //forEach문 말고 map을 써도 됨
      v.wdate = moment(v.wdate).format('YYYY-MM-DD');
    });
    connect.release();
    res.render('./board/list.pug', pug);
  }catch(e){
    next(e);
  }
});

router.get('/write', (req, res, next) => {
  const pug = {title: '게시글 작성', jsFile: 'board', cssFile: 'board'}
  res.render('./board/write.pug', pug);
});

router.post('/save', async (req, res, next) => {
  const {title, content, writer} = req.body; //비구조화 할당
  var values = [title, content, writer];
  var sql = 'INSERT INTO board SET title=?, content=?, writer=?';
  try {
    const connect = await pool.getConnection();
    const result = await connect.query(sql, values);
    connect.release();
    res.redirect('/board');
  }catch(e){
    next(e);
  }
});

module.exports = router;