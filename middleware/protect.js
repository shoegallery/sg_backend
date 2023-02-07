const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandle");
const MyError = require("../utils/myError");

exports.protect = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies) {
    token = req.cookies["Bearer"];
  }

  if (!token) {
    throw new MyError("Энэ үйлдлийг хийхэд таны эрх хүрэхгүй байна.", 401);
  }

  const tokenObj = jwt.verify(token, process.env.JWT_SECRET);

  req.walletsId = tokenObj.id;
  req.walletRole = tokenObj.role;
  req.exp = tokenObj.exp;

  if (parseInt(Date.now() / 1000) > req.exp) {
    throw new MyError("Энэ үйлдлийг хийхэд таны эрх хүрэхгүй байна.", 400);
  }
  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.walletRole)) {
      throw new MyError("Энэ үйлдлийг хийхэд таны эрх хүрэхгүй байна.", 403);
    }
    next();
  };
};
