const path = require('path');

const alert = (msg, loc=null) => {
  var html =  `<script> alert('${msg}');`;
  if(loc) html += `location.href='${loc}'`;
  html += `</script>`;
  return html;
}

const uploadFolder = (filename) => {
  return path.join(__dirname, '../uploads', filename.substr(0, 6), filename);
}

module.exports = {alert, uploadFolder}; //객체형태로 보내주면 필요한 것만 구조분해 할당으로 골라올 수 있음
