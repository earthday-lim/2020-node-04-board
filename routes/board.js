const express = require('express');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const createError = require('http-errors');
const router = express.Router();
const { pool } = require('../modules/mysql-conn');
const { alert, uploadFolder } = require('../modules/util');
const { upload, imageExt } = require('../modules/multer-conn');
const { connect } = require('http2');
const { NotExtended } = require('http-errors');

router.get(['/', '/list'], async (req, res, next) => {
	let connect, result, sql, values, pug;
	pug = {title: '게시판 리스트', jsFile: 'board', cssFile: 'board'};
	//node 데이터 가져오기 async await가 있어야 함
	try {
		sql = 'SELECT * FROM board ORDER BY id DESC';
		connect = await pool.getConnection();
		result = await connect.query(sql);
		pug.lists = result[0];
		pug.lists.forEach((v) => { //forEach문 말고 map을 써도 됨
			v.wdate = moment(v.wdate).format('YYYY-MM-DD');
		});
		connect.release();
		res.render('./board/list.pug', pug);
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/write', (req, res, next) => {
	const pug = {title: '게시글 작성', jsFile: 'board', cssFile: 'board'}
	res.render('./board/write.pug', pug);
});

router.post('/save', upload.single('upfile'), async (req, res, next) => { //upload.single('upfile'), : 미들웨어
	let connect, result, sql, values, pug;  
	let {title, content, writer} = req.body; //비구조화 할당
	try {
		values = [title, content, writer];
		sql = 'INSERT INTO board SET title=?, content=?, writer=?';

		if(req.allowUpload){
			if(req.allowUpload.allow) {//file 올렸다 통과해서 업로드 성공
				sql += ', savefile=?, realfile=?';
				values.push(req.file.filename); //savefile의 value
				values.push(req.file.originalname); //reafile의 value
			}else{ //file 올리지 않았다
				res.send(alert(`${req.allowUpload.ext}은(는) 업로드 가능한 파일형식이 아닙니다.`, '/board'));
			}
		}


		connect = await pool.getConnection();
		result = await connect.query(sql, values);
		connect.release();
		res.redirect('/board');
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/view/:id', async (req, res, next) => { //':id' 시멘틱 방식으로 들어옴 -> 'params'로 받음
	let connect, result, sql, values, pug;
	try {
		pug = {title: '게시글 보기', jsFile: 'board', cssFile: 'board'};
		sql = "SELECT * FROM board WHERE id=?";
		values = [req.params.id];
		connect = await pool.getConnection();
		result = await connect.query(sql, values);
		//res.json(result); 항상 디버깅모드에서 배열의 몇번째로 데이터가 들어오는지 확인하는 것
		connect.release();
		pug.list = result[0][0]; //list라는 배열객체 만듦
		pug.list.wdate = moment(pug.list.wdate).format('YYYY-MM-DD'); //moment : https://momentjs.com/
		if(pug.list.savefile) { //pug에 list에 savefile이 존재한다면
			var ext = path.extname(pug.list.savefile).toLowerCase().replace(".", "");
			if(imageExt.indexOf(ext) > -1) { //있다면
				pug.list.imgSrc = `/storage/${pug.list.savefile.substr(0, 6)}/${pug.list.savefile}`;//storage/폴더명/파일명
			}
			pug.list.download = `/storage/${pug.list.savefile.substr(0, 6)}/${pug.list.savefile}`;//storage/폴더명/파일명
		}
		res.render('./board/view.pug', pug);
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/delete/:id', async (req, res, next) => {
	let connect, result, sql, values, pug;
	try {
		sql = 'DELETE FROM board WHERE id=?';
		values = [req.params.id];
		connect = await pool.getConnection();
		result = await connect.query(sql, values);
		res.send(alert('삭제되었습니다.', '/board'));
		//connect.release();
		//res.redirect('/board');
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});


router.get('/update/:id', async (req, res, next) => {
	let connect, result, sql, values, pug;
	try {
		pug = {title: '게시글 수정', jsFile: 'board', cssFile: 'board'};
		sql = "SELECT * FROM board WHERE id=?";
		values = [req.params.id];
		connect = await pool.getConnection();
		result = await connect.query(sql, values);
		//res.json(result); 항상 디버깅모드에서 배열의 몇번째로 데이터가 들어오는지 확인하는 것
		connect.release();
		pug.list = result[0][0]; //list라는 배열객체 만듦
		res.render('./board/write.pug', pug);
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.post('/saveUpdate', upload.single('upfile'), async (req, res, next) => {
	let connect, result, sql, sqlRoot, values, pug;
	let {id, title, writer, content} = req.body; //구조분해 할당, req.body로부터
	try {
		sqlRoot = 'UPDATE board SET title=?, writer=?, content=?';
		values = [title, writer, content];
		if(req.allowUpload){
			if(req.allowUpload.allow) {//file 올렸다 통과해서 업로드 성공
				sql = 'SELECT savefile FROM board WHERE id=' + id;
				connect = await pool.getConnection();
				rs = await connect.query(sql);
				if(rs[0][0].savefile > 0) fs.removeSync(uploadFolder(rs[0][0].savefile));
				sqlRoot += ',savefile=?, realfile=?';
				values.push(req.file.filename);
				values.push(req.file.originalname);
			}else{ //file 올리지 않았다
				res.send(alert(`${req.allowUpload.ext}은(는) 업로드 가능한 파일형식이 아닙니다.`, '/board'));
			}
		}
		sqlRoot += 'WHERE id=' + id;
		connect = await pool.getConnection();
		result = await connect.query(sqlRoot, values);
		connect.release();
		if(rs[0].affectedRows == 1) res.send(alert('수정되었습니다', '/board'));
		else res.send(alert('수정에 실패하였습니다.', '/board'));
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/download', (req, res, next) => {
	let {file: saveFile, name: realFile} = req.query; //req.query.file을 받아오는데 saveFile이라는 이름으로 해
	res.download(uploadFolder(saveFile), realFile); //res.send,render,download,json()
});

router.get('/fileRemove/:id', async (req, res, next) => {
	// res.json({code: 200});
	let connect, rs, sql, values, list, pug;
	try{
		sql = 'SELECT * FROM board WHERE id=' + req.params.id;
		connect = await pool.getConnection();
		rs = await connect.query(sql);
		connect.release();
		list = rs[0][0];
		if(list.savefile) {
			let savefile = path.join(__dirname, '../uploads', list.savefile.substr(0, 6), list.savefile);
			fs.removeSync(uploadFolder(list.savefile));
			try{
				fs.removeSync(savefile);
				sql = 'UPDATE board SET savefile=NULL, realfile=NULL';
				connect = await pool.getConnection();
				rs = await connect.query(sql);
				connect.release();
				res.json({code: 200});
			}catch(e){
				res.json({code: 500, err: e});
			}
		};
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

module.exports = router;