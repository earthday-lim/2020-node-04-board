const express = require('express');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const createError = require('http-errors');
const router = express.Router();
const { pool, sqlGen } = require('../modules/mysql-conn');
const { alert, uploadFolder, imgFolder, extGen } = require('../modules/util');
const { upload, imageExt } = require('../modules/multer-conn');

router.get(['/', '/list'], async (req, res, next) => {
	let connect, result, pug;
	pug = {title: '게시판 리스트', jsFile: 'board', cssFile: 'board'};
	//node 데이터 가져오기 async await가 있어야 함
	try {
		let temp = sqlGen('board', {
			mode: 'S',
			desc: 'ORDER BY id DESC'
		});
		connect = await pool.getConnection();
		result = await connect.query(temp.sql);
		connect.release();
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
	let connect, result, pug;  
	//let {title, content, writer} = req.body; //비구조화 할당 =Gen nonecessary
	try {
		if(req.allowUpload.allow === false)
			res.send(alert(`${req.allowUpload.ext}은(는) 업로드 가능한 파일형식이 아닙니다.`, '/board'));
		else {
			let temp = sqlGen('board', {
			mode: 'I', 
			field: ['title', 'writer', 'content'],
			data: req.body,
			fiel: req.file
		});
		// values = [title, content, writer]; =Gen nonecessary
		// sql = 'INSERT INTO board SET title=?, content=?, writer=?'; =Gen nonecessary

		/* =Gen nonecessary
		 if(req.allowUpload){
			if(req.allowUpload.allow) {//file 올렸다 통과해서 업로드 성공
				sql += ', savefile=?, realfile=?';
				values.push(req.file.filename); //savefile의 value
				values.push(req.file.originalname); //reafile의 value
			}else{ //file 올리지 않았다
				
			}
		} */
			connect = await pool.getConnection();
			result = await connect.query(temp.sql, temp.values);
			connect.release();
			res.redirect('/board');
		}
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
	
});

router.get('/view/:id', async (req, res, next) => { //':id' 시멘틱 방식으로 들어옴 -> 'params'로 받음
	let connect, result, pug;
	try {
		pug = {title: '게시글 보기', jsFile: 'board', cssFile: 'board'};
		// sql = "SELECT * FROM board WHERE id=?";
		// values = [req.params.id];
		let temp = sqlGen('board', {
			mode: 'S',
			id: req.params.id,
		});
		connect = await pool.getConnection();
		result = await connect.query(temp.sql); //values가 id하나이므로 굳이 필요없음
		//res.json(result); 항상 디버깅모드에서 배열의 몇번째로 데이터가 들어오는지 확인하는 것
		connect.release();
		pug.list = result[0][0]; //list라는 배열객체 만듦
		pug.list.wdate = moment(pug.list.wdate).format('YYYY-MM-DD'); //moment : https://momentjs.com/ 
		if(pug.list.savefile) { //pug에 list에 savefile이 존재한다면
			if(imageExt.includes(extGen(pug.list.savefile))) { //있다면
				pug.list.imgSrc = imgFolder(pug.lsit.savefile);//storage/폴더명/파일명
			}
			pug.list.download = imgFolder(pug.lsit.savefile);//storage/폴더명/파일명
		}
		res.render('./board/view.pug', pug);
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/delete/:id', async (req, res, next) => {
	let connect, result, temp;
	try {
		connect = await pool.getConnection();
		temp = sqlGen('board', {mode: 'S', id: req.params.id, field: ['savefile']});
		// sql = 'DELETE FROM board WHERE id=?';
		// values = [req.params.id];
		result = await connect.query(temp.sql);
		if(result[0][0].savefile) await fs.remove(uploadFolder(result[0][0].savefile));
		temp = sqlGen('board', {
			mode: 'D',
			id: req.params.id
		});
		result = await connect.query(temp.sql);
		connect = await pool.getConnection();
		connect.release();
		res.send(alert('삭제되었습니다.', '/board'));
		//connect.release();
		//res.redirect('/board');
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});


router.get('/update/:id', async (req, res, next) => {
	let connect, result, pug, temp;
	try {
		pug = {title: '게시글 수정', jsFile: 'board', cssFile: 'board'};
		// sql = "SELECT * FROM board WHERE id=?";
		// values = [req.params.id];
		temp = sqlGen('board', {mode: 'S', id: req.params.id});
		connect = await pool.getConnection();
		result = await connect.query(temp.sql);
		//res.json(result); 항상 디버깅모드에서 배열의 몇번째로 데이터가 들어오는지 확인하는 것
		connect.release();
		pug.list = result[0][0]; //list라는 배열객체 만듦
		res.render('./board/write.pug', pug);
	}catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.post('/saveUpdate', upload.single('upfile'), async (req, res, next) => {
	let connect, result, temp;
	// let {id, title, writer, content} = req.body; //구조분해 할당, req.body로부터
	try {
		if(req.allow === false) {
			res.send(alert(`${req.allowUpload.ext}은(는) 업로드 가능한 파일형식이 아닙니다.`, '/board'));
		}else{
			connect = await pool.getConnection();
			if(req.file) { //기존에 올린 파일이 존재 시 삭제
				temp = sqlGen('board', {mode: 'S', id: req.body.id, field: ['savefile']});
				rs = await connect.query(temp.sql);
				if(result[0][0].savefile) await fs.remove(uploadFolder(result[0][0].savefile));
			}
			
			// sqlRoot = 'UPDATE board SET title=?, writer=?, content=?';
			// values = [title, writer, content];
			temp = sqlGen('board', {mode: 'U', id: req.body.id, field: ['title', 'writer', 'content'], data: req.body, file: req.file});
			result = await connect.query(temp.sql, temp.values);
			connect.release();
		}

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
	let connect, rs, list, temp;
	try{
		connect = await pool.getConnection();
		// sql = 'SELECT * FROM board WHERE id=' + req.params.id;
		temp = sqlGen('board', {mode: 'S', id: req.params.id});
		rs = await connect.query(temp.sql);
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
				res.json({code: 200}); //api통신할 때는 next로 에러를 보내는 게 아니다 클라이언트로 보내줘야 한다
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