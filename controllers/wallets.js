const Wallets = require("../models/wallets");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");
const asyncHandler = require("express-async-handler");
const sendMessage = require("../utils/sendMessage");
const crypto = require("crypto");
const createWallet = asyncHandler(async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    const walletExists = await Wallets.findOne({
      username,
      phone,
      password,
    });

    if (walletExists) {
      return res.status(200).json({
        success: false,
        message: "Хэтэвч аль хэдийн үүссэн",
      });
    }

    const result = await Wallets.create({
      username,
      phone,
      password,
    });

    const token = result.getJsonWebToken();

    return res.status(200).json({
      success: true,
      message: "Хэтэвч амжилттай үүслээ",
      data: result,
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({
        success: false,
        message: `Таны дугаар бүртгэлтэй байна`,
      });
    }

    return res.status(200).json({
      success: false,
      message: `Ямар нэгэн зүйл буруу байна. Жишээ нь: ${err}`,
    });
  }
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.phone) {
    throw new MyError("Та нууц үг сэргээх утасны дугаараа дамжуулна уу", 400);
  }

  const wallets = await Wallets.findOne({ phone: req.body.phone });

  if (!wallets) {
    throw new MyError(req.body.phone + " дугаартай  хэрэглэгч олдсонгүй!", 401);
  }

  var d1 = new Date(wallets.updatedAt),
    d2 = new Date(d1);
  d2.setMinutes(d1.getMinutes() + 2880);

  if (new Date() < d2) {
    throw new MyError("3 хоногт 1 удаа нууц үг сэргээх боломжтой", 402);
  }

  const resetToken = wallets.generatePasswordChangeToken();

  await wallets.save();

  // await Wallets.save({ validateBeforeSave: false });

  // Имэйл илгээнэ

  const message = {
    channel: "sms",
    title: "SHOE GALLERY",
    body: `Sain baina uu? Gift Cardny nuuts ug sergeeh code ${resetToken}. SHOE GALLERY`,
    receivers: [`${wallets.phone}`],
    shop_id: "2706",
  };

  await sendMessage({
    message,
  });

  res.status(200).json({
    status: true,
    resetToken,
  });
});

const getMyWallet = asyncHandler(async (req, res, next) => {
  // Оролтыгоо шалгана
  const { walletSuperId } = req.body;

  if (!walletSuperId) {
    throw new MyError("Хэтэвчний ID" + walletSuperId, 400);
  }
  // Тухайн хэрэглэгчийн хайна
  const wallets = await Wallets.findOne({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError("Хэтэвчний ID" + walletSuperId, 401);
  }

  res.status(200).json({
    status: true,
    wallets: {
      _id: wallets._id,
      walletSuperId: wallets.walletSuperId,
      balance: wallets.balance,
      phone: wallets.phone,
      walletType: wallets.walletType,
    },
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { phone, password } = req.body;

  // Оролтыгоо шалгана
  if (!phone || !password) {
    throw new MyError("Утасны дугаар болон нууц үгээ дамжуулна уу", 400);
  }

  // Тухайн хэрэглэгчийн хайна
  const wallets = await Wallets.findOne({ phone }).select("+password");

  if (!wallets) {
    throw new MyError("Утас болон нууц үгээ зөв оруулна уу", 401);
  }
  const ok = await wallets.checkPassword(password);

  if (!ok) {
    throw new MyError("Утас болон нууц үгээ зөв оруулна уу", 401);
  }

  const token = wallets.getJsonWebToken();

  const cookieOption = {
    expires: new Date(Date.now() + 20 * 60 * 1000),
    httpOnly: true,
  };

  res
    .status(200)
    .cookie("Bearer", token, cookieOption)
    .json({
      status: true,
      token,
      wallets: {
        _id: wallets._id,
        walletSuperId: wallets.walletSuperId,
        balance: wallets.balance,
        phone: wallets.phone,
        walletType: wallets.walletType,
      },
    });
});

const logout = asyncHandler(async (req, res, next) => {
  const cookieOption = {
    expires: new Date(Date.now()),
    httpOnly: true,
  };

  res.status(200).cookie("Bearar", null, cookieOption).json({
    status: true,

    data: "logged out...",
  });
});

const getAllWallets = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Wallets);

  const allWallets = await Wallets.find(req.query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    status: true,
    data: allWallets,
    pagination,
  });
});

const getwallets = asyncHandler(async (req, res, next) => {
  const wallets = await Wallets.findById(req.params.id).sort({ createdAt: -1 });

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй!", 400);
  }

  res.status(200).json({
    status: true,
    data: wallets,
  });
});

const updatewallets = asyncHandler(async (req, res, next) => {
  const wallets = await Wallets.findByIdAndUpdate(
    req.params.id,
    {
      phone: req.body.phone,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }
  await wallets.save();
  res.status(200).json({
    status: true,
    data: {
      _id: wallets._id,
      balance: wallets.balance,
      phone: wallets.phone,
      walletType: wallets.walletType,
    },
  });
});

const deletewallets = asyncHandler(async (req, res, next) => {
  const wallets = await Wallets.findById(req.params.id);

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  wallets.remove();

  res.status(200).json({
    status: true,
    data: wallets,
  });
});

const resetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.resetToken || !req.body.password || !req.body.phone) {
    throw new MyError("Та токен болон нууц үгээ дамжуулна уу", 400);
  }

  const encrypted = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body.resetToken))
    .digest("hex");

  const resetToken = `${req.body.resetToken}`;
  const wallets = await Wallets.findOne({
    resetPasswordToken: encrypted,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!wallets) {
    throw new MyError("Сэргээх код хүчингүй байна!", 403);
  }

  wallets.password = req.body.password;
  wallets.resetPasswordToken = undefined;
  wallets.resetPasswordExpire = undefined;
  await wallets.save();
  const token = wallets.getJsonWebToken();
  res.status(200).json({
    status: true,
    token,
    wallets: {
      _id: wallets._id,
      balance: wallets.balance,
      phone: wallets.phone,
      walletType: wallets.walletType,
    },
  });
});

module.exports = {
  getMyWallet,
  deletewallets,
  updatewallets,
  getwallets,
  getAllWallets,
  createWallet,
  resetPassword,
  forgotPassword,
  logout,
  login,
};
