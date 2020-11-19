function onBlur() {
  var userid = document.joinForm.userid.value;
  if(userid.length < 8) {
    $(".valid").html('아이디는 8자 이상이어야 합니다.');
  }else{
    $.get('/user/idchk'+userid, function(r) {
      if(r.code == 200) {
        if(r.isUsed) {
          $(".valid").html('멋진 아이디네요!').css("display", "block");
          $("input[name='useridValid']").val('valid');
        }
        else { 
          $(".valid").html('사용할 수 없습니다.').css("display", "block");
          $("input[name='useridValid']").val('');
        }
      }
      else console.log(r);
    });
  }
}

$("form[name='joinForm'] input [name='userid']").on("blur", onBlur);

function onJoin(f) {
  if(f.useridValid.value.trim() == '' || f.userpw.value.trim() == '' || f.username.value.trim() == '') {
    alert('올바르게 작성해 주세요.');
    return false;
  }
  return true;
}

function onLogin(f) {
  if(f.userid.value.trim() == '' || f.userpw.value.trim() == '') {
    alert('올바르게 작성해 주세요.');
    return false;
  }
  return true;
}

