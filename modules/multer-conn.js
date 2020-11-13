const multer = require('multer');
const moment = require('moment');
const path = require('path');
const fs = require('fs');//file system
const fsPro = require('fs/promises');
const { v4: uuidv4 } = require('uuid');//unique한 key값을 받아오는 모듈
const allowExt = ['jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'hwp'];
const imageExt = ['jpg', 'jpeg', 'png', 'gif'];


const makeFolder = () => { //폴더를 만드는 애
	let result = {err: null};
	let folder = path.join(__dirname, '../uploads', moment().format('YYMMDD')); //맞춰진 형태의 폴더를 만들어라
	result.folder = folder; //folder의 문자열이 result.folder에 들어감

	if(!fs.existsSync(folder)) fs.mkdirSync(folder);
	return result;

	/* if(!fs.existsSync(folder)) {
		const err = await fsPro.mkdir(folder);
		if(err) result.err = err;
		return result; //promise로 받아오므로 위에 async를 써줘야 함
	}
	else return result; */

	/* if(!fs.existsSync(folder)) { //folder라는 폴더가 존재하지 않으면 폴더를 만들어라
		fs.mkdir(folder, (err) => { //folder를 만들면서 콜백을 실행(mkdir : makedirectory)
			if(err) result.err = err; //err가 존재한다는 건 folder만들기를 실패했다는 뜻
			return result; //result의 err에 null대신 내가 받을 err가 채워져서 return + folder의 경로명 return 
		}); //callback으로 준 함수들은 stack이 아닌 (event)queue저장소에 저장해뒀다가 조건이 맞춰졌을 때 stack으로 들어와서 실행됨(event loop in node)
	}
	else return result; */ //folder가 존재한다면 null이 담긴 err를 담은 result를 받음
};

const fileFilter = (req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
	if(allowExt.indexOf(ext) > -1) { //성공
		req.allowUpload = {allow: true, ext};
		cb(null, true) //찾았다면 cb의 err자리에 null을 보내고 true
	}
	else {
		req.allowUpload = {allow: false, ext }; //실패
		cb(null, false);
	}
}

var storage = multer.diskStorage({
	destination: (req, file, cb) => { //경로 관장
		const result = makeFolder(); //makeFolder를 실행해서 존재한다면(err를 받았다면)
		result.err ? cb(err) : cb(null, result.folder); //? err 있으면 err있어요 던지고 : 없으면 너가 원하는 폴더명은 이거(result.folder)예요
	},
	filename: (req, file, cb) => { //파일명 관장 / file: 사용자가 올린 파일의 모든 정보 저장된 변수
		let ext = path.extname(file.originalname);//aa.jpg -> .jpg추출. 즉, 확장자를 받아옴(: path.extname())
		let saveName = moment().format('YYMMDD') + '-' + uuidv4() + ext;//파일명의 형식을 정함. 겹치지 않도록. uuidv4() : 난수를 발생
		cb(null, saveName);
	}
});

const upload = multer({ storage, fileFilter, limits: {fileSize: 20480000} }); //내가 customize한 경로와 파일명을 저장

module.exports = { upload, imageExt, allowExt }; //customize를 해서 보내는 upload