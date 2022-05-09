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
  try {
    const { toPhone, fromPhone, amount, summary, id } = req.body;
    const isUser = await Wallets.findById(id);
    if (amount > 0) {
      if (isUser.phone !== fromPhone && req.userRole !== "admin") {
        throw new MyError(
          "Худалдан авагч та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      const reference = v4();
      if (!toPhone && !fromPhone && !amount && !summary) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary",
          400
        );
      }
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
        return res.status(400).json({
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
      return res.status(400).json({
        success: false,
        message: `Утга эерэг байх ёстой`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: true,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});
const userCharge = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toPhone, fromPhone, amount, summary, id } = req.body;
    const isUser = await Wallets.findById(id);
    if (amount > 0) {
      if (isUser.phone !== fromPhone && req.userRole !== "admin") {
        throw new MyError(
          "Оператор та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      const reference = v4();
      if (!toPhone && !fromPhone && !amount && !summary) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary",
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
      return res.status(400).json({
        success: false,
        message: `Утга эерэг байх ёстой`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: true,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});
const userChargeBonus = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toPhone, fromPhone, amount, summary, id } = req.body;
    const isUser = await Wallets.findById(id);
    if (amount > 0) {
      if (isUser.phone !== fromPhone && req.userRole !== "admin") {
        throw new MyError(
          "Оператор та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      const reference = v4();
      if (!toPhone && !fromPhone && !amount && !summary) {
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
      return res.status(400).json({
        success: false,
        message: `Утга эерэг байх ёстой`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: true,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});
const userCashOut = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toPhone, fromPhone, amount, summary, id } = req.body;
    const isUser = await Wallets.findById(id);
    if (amount > 0) {
      if (isUser.phone !== fromPhone && req.userRole !== "admin") {
        throw new MyError(
          "Хэрэглэгч та өөрийнхөө хэтэвчнээсээ бэлэн мөнгөө хүлээн авах боломжтой",
          403
        );
      }
      const reference = v4();
      if (!toPhone && !fromPhone && !amount && !summary) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary",
          400
        );
      }
      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "cashOut",
          reference,
          summary: "Хэтэвчнээс бэлэн мөнгө хүлээн авах хүсэлт баталгаажлаа.",
          trnxSummary: `TRFR TO: ${toPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "cashOut",
          reference,
          summary: "Хэрэглэгчийн бэлэн мөнгөний хүсэлт амжилттай.",
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
        return res.status(400).json({
          success: false,
          message: errors,
        });
      }
      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({
        success: true,
        message: "Бэлэн мөнгөний хүсэлт амжилттай",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Утга эерэг байх ёстой`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: true,
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});

const getUserTransfers = asyncHandler(async (req, res, next) => {
  const wallets = await Wallets.findById(req.params.id);
  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }
  const transactions = await Transactions.find({ phone: wallets.phone });
  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});
const getUserTransfersDebit = asyncHandler(async (req, res, next) => {
  const wallets = await Wallets.findById(req.params.id);
  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }
  const transactions = await Transactions.find({
    phone: wallets.phone,
    trnxType: "Орлого",
  });
  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});
const getUserTransfersCredit = asyncHandler(async (req, res, next) => {
  const wallets = await Wallets.findById(req.params.id);
  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }
  const transactions = await Transactions.find({
    phone: wallets.phone,
    trnxType: "Зарлага",
  });
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
const getAllCashOut = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({ purpose: "cashOut" })
    .sort({ createdAt: -1 })
    .skip(pagination.start - 1)
    .limit(limit);
  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllCashOutCredit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "cashOut",
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
const getAllCashOutDebit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
  const pagination = await paginate(page, limit, Wallets);
  const allWallets = await Transactions.find({
    purpose: "cashOut",
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
  userCharge,
  userCashOut,
  userChargeBonus,
  getAllTransfer,
  getAllTransferCredit,
  getAllTransferDebit,
  getUserTransfers,
  getUserTransfersDebit,
  getUserTransfersCredit,
  getAllCharge,
  getAllChargeCredit,
  getAllChargeDebit,
  getAllBonus,
  getAllBonusCredit,
  getAllBonusDebit,
  getAllCashOut,
  getAllCashOutCredit,
  getAllCashOutDebit,
};
