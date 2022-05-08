const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandle");
const MyError = require("../utils/myError");
const Wallets = require("../models/wallets");

exports.protect = asyncHandler(async (req, res, next) => {
  // console.log(req.headers);
  let token = null;

  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies) {
    token = req.cookies["amazon-token"];
  }

  if (!token) {
    throw new MyError(
      "Энэ үйлдлийг хийхэд таны эрх хүрэхгүй байна. Та эхлээд логин хийнэ үү. Authorization header-ээр эсвэл Cookie ашиглан токеноо дамжуулна уу.",
      401
    );
  }

  const tokenObj = jwt.verify(token, process.env.JWT_SECRET);
  req.walletsId = tokenObj.id;
  req.walletRole = tokenObj.role;
  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.walletRole)) {
      throw new MyError(
        "Таны эрх [" +
          req.walletRole +
          "] энэ үйлдлийг гүйцэтгэхэд хүрэлцэхгүй!",
        403
      );
    }

    next();
  };
};
