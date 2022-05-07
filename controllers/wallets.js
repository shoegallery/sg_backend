const Wallets = require("../models/wallets");

const createWallet = async (req, res) => {
  try {
    const { username } = req.body;

    const walletExists = await Wallets.findOne({ username });

    if (walletExists) {
      return res.status(200).json({
        status: "bad",
        message: "Хэтэвч аль хэдийн үүссэн",
      });
    }

    const result = await Wallets.create({ username });
    console.log(result);
    return res.status(200).json({
      status: "ok",
      message: "Хэтэвч амжилттай үүслээ",
      data: result,
    });
  } catch (err) {
    return res.status(200).json({
      status: "ok",
      message: `Ямар нэгэн зүйл дутуу байна. Жишээ нь: ${err}`,
    });
  }
};

module.exports = { createWallet };
