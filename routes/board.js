const express = require('express');
const router = express.Router();
const {pool} = require('../modules/mysql-conn');

router.get(['/', '/list'], (req, res, next) => {
  const pug = {title: '게시판 리스트', jsFile: 'board', cssFile: 'board'}
  res.render('./board/list.pug', pug);
});

router.get('/write', (req, res, next) => {
  const pug = {title: '게시글 작성', jsFile: 'board', cssFile: 'board'}
  res.render('./board/write.pug', pug);
});

router.post('/save', async (req, res, next) => {
  const {title, content, writer} = req.body; //비구조화 할당
  var values = [title, content, writer];
  var sql = 'INSERT INTO board SET title=?, writer=?, content=?';
  try {
    const connect = await pool.getConnection();
    const result = await connect.query(sql, values);
    connect.release();
    res.json(result);
  }catch(e){
    next(e);
  }
});

module.exports = router;