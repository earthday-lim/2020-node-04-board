//crypt : 단방향 암호화
//cipher : 양방향 암복호화
//session : 서버가 가지는 전역변수
//cookie : 클라이언트가 가지는 전역변수
//CORS (Cross Origin Resource Share) : 통신 규칙
//proxy : forward proxy
//proxy : reverse proxy

const crypto = require('crypto');
let password = 'abcd1234';
let salt = 'dfsgebwds21sf23';
let hash = crypto.createHash('sha512').update(password).digest('base64');
console.log('hash');
//단방향 암호화방식의 sha412방식으로 : crypto.createHash('sha512')
//.update(password) : password를 암호화해줘
//표현방식은 base64로 해줘 : .digest('base64')

const cipher = crypto.createCipher('aes-256-c ', salt);
let result = cipher.update('아버지를 아버지라...', 'utf-8', 'base64'); //utf-8을 base64방식으로 표현해줘
result += cipher.final('base64');
console.log(result);

let decipher = crypto.createDecipher('aes-256-cbc', salt);
let result2 = decipher.update(result, 'base64', 'utf-8');////base64를 utf-8방식으로 표현해줘
result2 += decipher.final('utf-8');
console.log(result2);