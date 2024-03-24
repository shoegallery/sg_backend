const Wallets = require("../models/wallets");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");

let ip = require("ip");

const asyncHandler = require("express-async-handler");
const sendMessage = require("../utils/sendMessage");
const crypto = require("crypto");

////////////////////////////////////////////////////////////
const createWallet = asyncHandler(async (req, res) => {
  try {
    const { phone, uuid } = req.body;

    const ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const wallets = await Wallets.findOne({
      phone,
    });
    const usingSplit = ipAddress.split(",");
    if (!phone || !uuid) {
      return res.status(470).json({
        success: false,
        message: "Ямар нэгэн зүйл буруу байна.",
      });
    }
    let ppp = Math.floor(100000 + Math.random() * 900000);
    

    if (wallets) {
      wallets.phone === 70000000 ? (ppp = parseInt("700000")) : wallets.phone === 70000001 ? (ppp = parseInt("700001")) : wallets.phone == 70000002 ? (ppp = parseInt("700002")) : wallets.phone == 70000003 ? (ppp = parseInt("700003")) : wallets.phone == 70000004 ? (ppp = parseInt("700004")) : ppp = ppp + 1 - 1;
      if (wallets.LoggedUUID === uuid) {
        if (wallets.LoginLock === false) {
          let usePanel;
          let useRole;
          if (wallets.role === "admin" || wallets.role === "operator") {
            usePanel = "officeWorker";
            useRole = wallets.role;
          }
          const token = wallets.getJsonWebToken();
          const cookieOption = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
          };
          wallets.loginToken = undefined;
          wallets.LoginLimitter = 0;
          await wallets.save();
          return res
            .cookie("Bearer", token, cookieOption)
            .status(200)
            .json({
              success: true,
              status: true,
              token,
              message: "Амжилттай",
              wallets: {
                _id: wallets._id,
                walletSuperId: wallets.walletSuperId,
                balance: wallets.balance,
                phone: wallets.phone,
                walletType: wallets.walletType,
                isPanel: usePanel,
                useRole: useRole,
                LoginLock: wallets.LoginLock,
                compilation: wallets.compilation,
                color: wallets.color,
              },
            });
        } else {
          if (wallets.LoginLimitter < 3) {
            wallets.LoginLock = true;
            wallets.BufferIpAddress = usingSplit[0];
            wallets.BufferUUID = uuid;
            wallets.loginTokenExpire = new Date(Date.now() + 15 * 60 * 1000);
            wallets.loginToken = ppp;
            wallets.password = ppp;
            wallets.LoginLimitter = wallets.LoginLimitter + 1;
            await wallets.save();
            const message = {
              channel: "sms",
              title: "SHOE GALLERY",
              body: `Sain baina uu? Point Plus ruu ${ppp} codiig oruulj nevterne uu. - SHOE GALLERY`,
              receivers: [`${wallets.phone}`],
              shop_id: "2706",
            };
            await sendMessage({
              message,
            });

            return res.status(480).json({
              success: false,
              message: "Баталгаажуулах кодыг оруулах шаардлагатай",
            });
          } else {
            wallets.LoginLock = true;
            wallets.Blocked = true;
            await wallets.save();
            return res.status(491).json({
              success: false,
              message: "Таны хаяг түр блоклогдлоо.",
            });
          }
        }
      } else {
        if (wallets.Blocked === false && wallets.authLock === false) {
          if (wallets.LoginLimitter < 3) {
            if (wallets.LoginLimitter < 2) {
              wallets.LoginLock = true;
              wallets.BufferIpAddress = usingSplit[0];
              wallets.BufferUUID = uuid;
              wallets.loginTokenExpire = new Date(Date.now() + 15 * 60 * 1000);
              wallets.loginToken = ppp;
              wallets.password = ppp;
              wallets.LoginLimitter = wallets.LoginLimitter + 1;
              await wallets.save();
              const message = {
                channel: "sms",
                title: "SHOE GALLERY",
                body: `Sain baina uu? Point Plus ruu ${ppp} codiig oruulj nevterne uu. - SHOE GALLERY`,
                receivers: [`${wallets.phone}`],
                shop_id: "2706",
              };

              await sendMessage({
                message,
              });

              return res.status(481).json({
                success: false,
                message: "Баталгаажуулах кодыг оруулах шаардлагатай",
              });
            } else {
              wallets.LoginLock = true;
              wallets.BufferIpAddress = usingSplit[0];
              wallets.BufferUUID = uuid;
              wallets.loginTokenExpire = new Date(Date.now() + 15 * 60 * 1000);
              wallets.loginToken = ppp;
              wallets.password = ppp;
              wallets.LoginLimitter = wallets.LoginLimitter + 1;
              await wallets.save();
              const message = {
                channel: "sms",
                title: "SHOE GALLERY",
                body: `Sain baina uu? Point Plus ruu ${ppp} codiig oruulj nevterne uu. Herev ta oroldoogui bol 80409000 dugaart medegdene uu. - SHOE GALLERY`,
                receivers: [`${wallets.phone}`],
                shop_id: "2706",
              };
              await sendMessage({
                message,
              });

              return res.status(482).json({
                success: false,
                message: "Баталгаажуулах кодыг оруулах шаардлагатай",
              });
            }
          } else {
            wallets.LoginLock = true;
            wallets.Blocked = true;
            await wallets.save();
            return res.status(491).json({
              success: false,
              message: "Таны хаяг түр блоклогдлоо.",
            });
          }
        } else {
          return res.status(492).json({
            success: false,
            message: "Таны хаяг түр блоклогдсон байна.",
          });
        }
      }
    }
    const pp = Math.floor(100000 + Math.random() * 900000);
    const result = await Wallets.create({
      phone,
      password: pp,
      loginToken: pp,
      loginTokenExpire: new Date(Date.now() + 15 * 60 * 1000),
    });

    const message = {
      channel: "sms",
      title: "SHOE GALLERY",
      body: `Sain baina uu? Point Plus hetevch amjilttai uuslee. Daraah ${pp} codiig oruulj nevterne uu. - SHOE GALLERY`,
      receivers: [`${result.phone}`],
      shop_id: "2706",
    };
    await sendMessage({
      message,
    });

    return res.status(499).json({
      success: true,
      status: true,
      message: "Хэтэвч амжилттай үүслээ",
    });
  } catch (err) {
    console.log(err);
    return res.status(495).json({
      success: false,
      message: `Ямар нэгэн зүйл буруу байна. Жишээ нь: ${err}`,
    });
  }
});
///////////////////////////////////////////////////////////////////

const getMyWallet = asyncHandler(async (req, res, next) => {
  // Оролтыгоо шалгана
  const { walletSuperId } = req.body;
  console.log(walletSuperId);
  if (!walletSuperId) {
    throw new MyError("Хэтэвчний ID" + walletSuperId, 400);
  }
  // Тухайн хэрэглэгчийн хайна
  const wallets = await Wallets.findOne({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError("Хэтэвчний ID " + walletSuperId + " алга", 401);
  }
  let usePanel;
  let useRole;
  if (wallets.role === "admin" || wallets.role === "operator") {
    usePanel = "officeWorker";
    useRole = wallets.role;
  }

  res.status(200).json({
    status: true,
    wallets: {
      _id: wallets._id,
      walletSuperId: wallets.walletSuperId,
      balance: wallets.balance,
      phone: wallets.phone,
      walletType: wallets.walletType,
      isPanel: usePanel,
      useRole: useRole,
      compilation: wallets.compilation,
      color: wallets.color,
    },
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(483).json({
      success: false,
      message: `Утасны дугаар болон баталгаажуулах кодоо дамжуулна уу`,
    });
  }

  // Тухайн хэрэглэгчийн хайна
  const walletsLogin = await Wallets.findOne({ phone }).select("+password");



  const ppp = Math.floor(100000 + Math.random() * 900000);
  const encrypted = crypto
    .createHash("sha256")
    .update(JSON.stringify(ppp))
    .digest("hex");
  if (!walletsLogin) {
    return res.status(484).json({
      success: false,
      message: `Утасны дугаар болон баталгаажуулах кодоо зөв дамжуулна уу`,
    });
  }

  const ok = await walletsLogin.checkPassword(password);

  if (!ok) {
    console.log(walletsLogin.authLimitter);
    if (walletsLogin.authLimitter < 3) {
      walletsLogin.authLimitter = walletsLogin.authLimitter + 1;
      await walletsLogin.save();
      return res.status(485).json({
        success: false,
        message: `Утасны дугаар болон баталгаажуулах кодоо зөв дамжуулна уу`,
      });
    } else {
      walletsLogin.authLock = true;
      await walletsLogin.save();
      return res.status(486).json({
        success: false,
        message: `Та үйлдэл хийх эрхгүй боллоо`,
      });
    }
  } else {
    const walletsChecked = await Wallets.findOne({
      phone: phone,
      loginToken: password,
      loginTokenExpire: { $gt: Date.now() },
    });
    if (!walletsChecked) {
      return res.status(484).json({
        success: false,
        message: `Баталгаажуулах код хүчингүй байна.`,
      });
    } else {
      if (walletsChecked.authLock === false) {
        const token = walletsChecked.getJsonWebToken();
        const cookieOption = {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        };
        let usePanel;
        let useRole;
        walletsChecked.LoggedIpAddress = walletsChecked.BufferIpAddress;
        walletsChecked.BufferIpAddress = undefined;
        walletsChecked.LoggedUUID = walletsChecked.BufferUUID;
        walletsChecked.BufferUUID = undefined;
        walletsChecked.LoginLimitter = 0;
        walletsChecked.authLimitter = 0;
        walletsChecked.loginToken = undefined;
        walletsChecked.LoginLock = false;
        walletsChecked.password = encrypted;

        await walletsChecked.save();

        if (
          walletsChecked.role === "admin" ||
          walletsChecked.role === "operator"
        ) {
          usePanel = "officeWorker";
          useRole = walletsChecked.role;
        } else {
          usePanel = "none";
          useRole = "none";
        }
        res
          .cookie("Bearer", token, cookieOption)
          .status(200)
          .json({
            status: true,
            token,
            message: "Амжилттай",
            wallets: {
              _id: walletsChecked._id,
              walletSuperId: walletsChecked.walletSuperId,
              balance: walletsChecked.balance,
              phone: walletsChecked.phone,
              walletType: walletsChecked.walletType,
              isPanel: usePanel,
              useRole: useRole,
              LoginLock: walletsChecked.LoginLock,
              compilation: walletsChecked.compilation,
              color: walletsChecked.color,
            },
          });
      } else {
        await walletsChecked.save();
        return res.status(487).json({
          success: false,
          message: `Та үйлдэл хийх эрхгүй байна`,
        });
      }
    }
  }
});

const logout = asyncHandler(async (req, res, next) => {
  const cookieOption = {
    expires: new Date(Date.now()),
    httpOnly: true,
  };

  res.status(200).cookie("Bearar", null, cookieOption).json({
    status: true,
    token: null,
    message: "Log Out...",
    wallets: null,
  });
});
const version = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: true,
    android: process.env.android_version,
    ios: process.env.ios_version,
  });
});

const testcheck = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: true,
    message: "yes",
  });
});


const checkLogged = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: true,
  });
});
const getAllWallets = asyncHandler(async (req, res, next) => {
  const select = req.query.select;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const allWallets = await Wallets.find(req.query, select).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    status: true,
    data: allWallets,
  });
});
const getAllWalletsUser = asyncHandler(async (req, res, next) => {
  const select = req.query.select;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const allWallets = await Wallets.find({ role: "user" }).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    status: true,
    data: allWallets,
  });
});
const getAllWalletsStore = asyncHandler(async (req, res, next) => {
  const select = req.query.select;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const allWallets = await Wallets.find({ role: "store" }).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    status: true,
    data: allWallets,
  });
});

const getAllWalletsOperator = asyncHandler(async (req, res, next) => {
  const select = req.query.select;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const allWallets = await Wallets.find({ role: "operator" }).sort({
    updatedAt: -1,
  });
  res.status(200).json({
    status: true,
    data: allWallets,
  });
});
const getAllWalletsVariance = asyncHandler(async (req, res, next) => {
  const select = req.query.select;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const allWallets = await Wallets.find({ role: "variance" }).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    status: true,
    data: allWallets,
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

const myInfo = asyncHandler(async (req, res, next) => {
  const { phone, walletSuperId, gender, color, interest } = req.body;
  if (!phone || !walletSuperId || !gender || !color || !interest) {
    return res.status(483).json({
      success: false,
      message: `параметр бүрэн дамжуулна уу`,
    });
  }
  const walletsChecked = await Wallets.findOne({
    phone: phone,
    walletSuperId: walletSuperId,
  });

  if (!walletsChecked) {
    return res.status(483).json({
      success: false,
      message: `Хэрэглэгч алга`,
    });
  }
  walletsChecked.color = color;
  walletsChecked.interest = interest;
  walletsChecked.gender = gender;
  await walletsChecked.save();
  res.status(200).json({
    status: "ok",
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

module.exports = {
  testcheck,
  version,
  getMyWallet,
  deletewallets,
  updatewallets,
  getwallets,
  getAllWallets,
  createWallet,
  myInfo,
  logout,
  checkLogged,
  login,
  getAllWalletsOperator,
  getAllWalletsVariance,
  getAllWalletsStore,
  getAllWalletsUser,
};
