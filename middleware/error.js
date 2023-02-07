const errorHandler = (err, req, res, next) => {


  const error = { ...err };

  error.message = err.message;

  // if (error.name === "CastError") {
  //   error.message = "Энэ ID буруу бүтэцтэй ID байна!";
  //   error.statusCode = 400;
  // }

  // jwt malformed

  if (error.message === "jwt malformed") {
    error.message = "Та логин хийж байж энэ үйлдлийг хийх боломжтой...";
    error.statusCode = 401;
  }

  if (error.name === "JsonWebTokenError" && error.message === "invalid token") {
    error.message = "Буруу токен дамжуулсан байна!";
    error.statusCode = 400;
  }

  if (error.code === "E11000") {
    error.message = "Энэ талбарын утгыг давхардуулж өгч болохгүй!";
    error.statusCode = 400;
  }
  if (error.code === "ERR_HTTP_HEADERS_SENT") {
    error.message = "Хэвийн";
    error.statusCode = 200;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
  });

};

module.exports = errorHandler;
