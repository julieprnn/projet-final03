
var HTTP_CODE = {
  400 : 'Bad Request',
  401 : 'Unauthorized',
  403 : 'Forbidden',
  404 : 'Not Found',
  405 : 'Method Not Allowed',
  406 : 'Not Acceptable',
  409 : 'Conflict',
  412 : 'Precondition Failed',
  500 : 'Internal Server Error'
}

function handlingRes(res, statusCode, msg, data) {
  console.log("\n");
  if (!msg){
    msg = HTTP_CODE[statusCode];
  }
  if (!data) {
    res.status(statusCode).send({
    "status": statusCode,
    "message": msg
    });
    console.log('# ', statusCode, ':', msg);
  }
  else {
    res.status(statusCode).send({
      "status": statusCode,
      "message": msg,
      "data" : data
      });
      console.log('# ', statusCode, ':', msg, "\n", data);
  }
}

exports.default = handlingRes;

