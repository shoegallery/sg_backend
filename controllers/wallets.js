const Wallets = require("../models/wallets");
const asyncHandler = require("express-async-handler");

const createWallet = asyncHandler(async (req, res) => {
  try {
    const { username, firstname, lastname, phone, email, password } = req.body;

    const walletExists = await Wallets.findOne({
      username,
      firstname,
      lastname,
      phone,
      email,
      password,
    });

    if (walletExists) {
      return res.status(200).json({
        status: "002",
        message: "Хэтэвч аль хэдийн үүссэн",
      });
    }

    const result = await Wallets.create({
      username,
      firstname,
      lastname,
      phone,
      email,
      password,
    });
    console.log(result);
    return res.status(200).json({
      status: "ok",
      message: "Хэтэвч амжилттай үүслээ",
      data: result,
    });
  } catch (err) {
    return res.status(200).json({
      status: "ok",
      message: `Ямар нэгэн зүйл буруу байна. Жишээ нь: ${err}`,
    });
  }
});

module.exports = { createWallet };
