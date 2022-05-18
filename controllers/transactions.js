const Transactions = require("../models/transactions");
const Wallets = require("../models/wallets");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const { creditAccount, debitAccount } = require("../utils/transactions");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");
const asyncHandler = require("express-async-handler");

const userPurchase = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { toPhone, fromPhone, amount, summary, id, walletSuperId } = req.body;
  const isUser = await Wallets.findById(id);
  const isStore = await Wallets.find({ phone: toPhone });
  try {
    if (amount > 0 && isUser.walletSuperId === walletSuperId) {
      if (
        !toPhone &&
        !fromPhone &&
        !amount &&
        !summary &&
        !id &&
        !walletSuperId
      ) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId",
          400
        );
      }

      if (isUser.phone !== fromPhone) {
        throw new MyError(
          "Худалдан авагч та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      if (isStore[0].role !== "saler") {
        throw new MyError(
          "Худалдан авагч та дэлгүүрийн данс руу шилжүүлэг хийнэ!!",
          403
        );
      }
      const reference = v4();
      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "purchase",
          reference,
          summary: "Хэтэвчнээс худалдан авалтын төлбөр амжилттай төлөгдлөө.",
          trnxSummary: `TRFR TO: ${toPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "purchase",
          reference,
          summary: "Худалдан авагчаас худалдан авалтын төлбөр баталгаажсан.",
          trnxSummary: `TRFR FROM: ${fromPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
      ]);
      const failedTxns = transferResult.filter(
        (result) => result.status !== true
      );
      if (failedTxns.length) {
        const errors = failedTxns.map((a) => a.message);
        await session.abortTransaction();
        session.endSession();
        return res.status(406).json({
          success: false,
          message: errors,
        });
      }
      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({
        success: true,
        message: "Худалдан авалт амжилттай",
      });
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Боломжгүй`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(405).json({
      success: false,
      message: `Хүлээн авах хэрэглэгч олдсонгүй. Хүлээн авагч хэрэглэгчийн утасны дугаарыг шалгана уу`,
    });
  }
});
const userCharge = asyncHandler(async (req, res) => {
  const { toPhone, fromPhone, amount, summary, walletSuperId, id } = req.body;
  const isReceiver = await Wallets.find({ phone: toPhone });
  const isUser = await Wallets.findById(id);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (amount > 0 && isUser.walletSuperId === walletSuperId) {
      if (
        (isUser.phone !== fromPhone && isUser.role !== "admin") ||
        isUser.role !== "operator"
      ) {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      if (isReceiver[0].role !== "user") {
        throw new MyError(
          "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
          403
        );
      }
      const reference = v4();
      if (
        !toPhone &&
        !fromPhone &&
        !amount &&
        !summary &&
        !id &&
        !walletSuperId
      ) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId",
          400
        );
      }

      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "charge",
          reference,
          summary: "Хэтэвчийг амжилттай цэнэглэв.",
          trnxSummary: `TRFR TO: ${toPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "charge",
          reference,
          summary: "Дэлгүүрээс хэрэглэгчийн хэтэвчийг цэнэглэв.",
          trnxSummary: `TRFR FROM: ${fromPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
      ]);
      const failedTxns = transferResult.filter(
        (result) => result.status !== true
      );
      if (failedTxns.length) {
        const errors = failedTxns.map((a) => a.message);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: errors,
        });
      }
      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({
        success: true,
        message: "Цэнэглэлт амжилттай",
      });
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Боломжгүй`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});
const userGiftCardCharge = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  try {
    const { toPhone, fromPhone, amount, summary, id, walletSuperId } = req.body;
    const isUser = await Wallets.findById(id);

    var walletNewType;
    if (amount > 0 && isUser.walletSuperId === walletSuperId) {
      const getWalletType = await Wallets.find({ phone: toPhone });

      if (
        (isUser.phone !== fromPhone && isUser.role !== "admin") ||
        isUser.role !== "operator"
      ) {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      if (getWalletType[0].role !== "user") {
        throw new MyError(
          "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
          403
        );
      }

      const reference = v4();
      if (
        !toPhone &&
        !fromPhone &&
        !amount &&
        !summary &&
        !id &&
        !walletSuperId
      ) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary",
          400
        );
      }

      if (amount !== 2000000 && amount !== 3000000 && amount !== 5000000) {
        throw new MyError("Дараах багцнаас л сонгоно  : 2сая , 3сая , 5сая");
      }

      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "giftcard",
          reference,
          summary: `Хэтэвчийг амжилттай ${amount}  Giftcartaar цэнэглэв.`,
          trnxSummary: `TRFR TO: ${toPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "giftcard",
          reference,
          summary: `Дэлгүүрээс хэрэглэгчийн хэтэвчийг ${amount} Giftcartaar цэнэглэв.`,
          trnxSummary: `TRFR FROM: ${fromPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
      ]);
      const failedTxns = transferResult.filter(
        (result) => result.status !== true
      );
      if (failedTxns.length) {
        const errors = failedTxns.map((a) => a.message);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: errors,
        });
      }

      await session.commitTransaction();
      session.endSession();

      if (amount === 2000000) {
        walletNewType = "rosegoldd";
      } else if (amount === 3000000) {
        walletNewType = "golden";
      } else if (amount === 5000000) {
        walletNewType = "platnium";
      } else {
        walletNewType = "member";
      }

      await Wallets.findByIdAndUpdate(
        getWalletType[0].id,
        {
          walletType: walletNewType,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      return res.status(201).json({
        success: true,
        message: "Giftcart цэнэглэлт амжилттай",
      });
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Боломжгүй`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({
      success: false,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});

const userChargeBonus = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toPhone, fromPhone, amount, summary, id, walletSuperId } = req.body;

    const isUser = await Wallets.findById(id);
    const isReceiver = await Wallets.find({ phone: toPhone });

    if (amount > 0 && isUser.walletSuperId === walletSuperId) {
      if (
        (isUser.phone !== fromPhone && isUser.role !== "admin") ||
        isUser.role !== "operator"
      ) {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }

      if (isReceiver[0].role !== "user") {
        throw new MyError(
          "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
          403
        );
      }

      const reference = v4();
      if (
        !toPhone &&
        !fromPhone &&
        !amount &&
        !summary &&
        !id &&
        !walletSuperId
      ) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary",
          400
        );
      }
      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "bonus",
          reference,
          summary: "Таны хэтэвчийг бонусаар амжилттай цэнэглэгдлээ.",
          trnxSummary: `TRFR TO: ${toPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "bonus",
          reference,
          summary: "Дэлгүүрээс хэрэглэгчийн хэтэвчийг бонусаар цэнэглэв.",
          trnxSummary: `TRFR FROM: ${fromPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
      ]);
      const failedTxns = transferResult.filter(
        (result) => result.status !== true
      );
      if (failedTxns.length) {
        const errors = failedTxns.map((a) => a.message);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: errors,
        });
      }
      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({
        success: true,
        message: "Бонус цэнэглэлт амжилттай",
      });
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Боломжгүй`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});

const getUserTransfers = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;
  const wallets = await Wallets.find({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }

  const transactions = await Transactions.find({
    phone: wallets[0].phone,
  }).sort({
    createdAt: -1,
  });

  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }

  res.status(200).json({
    success: true,
    data: transactions,
  });
});
const getUserTransfersDebit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;

  const { walletSuperId } = req.body;
  const wallets = await Wallets.find({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }
  const pagination = await paginate(page, limit, Wallets);
  const transactions = await Transactions.find({
    phone: wallets[0].phone,
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});
const getUserTransfersCredit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const { walletSuperId } = req.body;
  const wallets = await Wallets.find({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }
  const pagination = await paginate(page, limit, Wallets);
  const transactions = await Transactions.find({
    phone: wallets[0].phone,
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);

  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});

const getAllTransfer = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const select = req.query.select;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find(req.query, select)
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllTransferCredit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({ trnxType: "Зарлага" })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllTransferDebit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({ trnxType: "Орлого" })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllCharge = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({ purpose: "charge" })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllChargeCredit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "charge",
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllChargeDebit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "charge",
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});

const getAllBonus = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({ purpose: "bonus" })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllBonusCredit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "bonus",
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllBonusDebit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "bonus",
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});

const getAllGiftCard = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({ purpose: "giftcard" })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllGiftCardCredit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "giftcard",
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllGiftCardDebit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "giftcard",
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});

module.exports = {
  userPurchase,

  getUserTransfers,
  getUserTransfersDebit,
  getUserTransfersCredit,

  getAllTransfer,
  getAllTransferCredit,
  getAllTransferDebit,

  userCharge,
  getAllCharge,
  getAllChargeCredit,
  getAllChargeDebit,

  userChargeBonus,
  getAllBonus,
  getAllBonusCredit,
  getAllBonusDebit,

  userGiftCardCharge,
  getAllGiftCard,
  getAllGiftCardDebit,
  getAllGiftCardCredit,
};
