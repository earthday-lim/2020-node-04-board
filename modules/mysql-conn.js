const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

//mode = 'I', 'U', 'S', 'D'
//table = 'tableName'
//field = ['title', 'writer', 'content']
//data = {title: 'A', content: 'B'} // req.body
//file = {filename: '201113-.jpg', originalname: 'abc.jpg', size: 1234} //req.file
//key = id값 
const sqlGen = (table, obj) => {
  let {mode=null, field=[], data={}, file=null, id=null, desc=null } = obj;
  let sql=null, values=[];
  let temp = object.entries(data).filter(v => field.includes(v[0])); //includes() = indexOf() > -1
  console.log(temp);
  
  switch(mode) {
    case 'I':
      sql = `INSERT INTO ${table} SET `;  
    break;
    case 'U':
      sql = `UPDATE ${table} SET`;
      break;
    case 'D':
      sql = `DELETE FROM ${table} WHERE id=${id} `;
      break;
    case 'D':
      sql = `SELECT ${field.length == 0 ? '*' : field.toString()} FROM ${table} `;
      if(id) sql += `WHERE id=${id} `;
      if(desc) sql += `${desc} `; 
      break;
  }
  for (let v of temp) {
    sql += `${v[0]}=?, `;
      values.push(v[1]);
  }
  if(file) {
    sql +=  `savefile=?, realname=?,`
    values.push(file.filename);
    values.push(originalname);
  }
  sql = sql.substr(0, sql.length, -1); //마지막에 쉼표 빼는 것 땜에 한칸 지움처리

  if(mode == 'I', mode == 'U') sql += `WHERE id= ${id}`
  return {sql, values}
}

module.exports = {mysql, pool, sqlGen};