const Transactions = require("../models/transactions");
const Wallets = require("../models/wallets");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const { creditAccount, debitAccount } = require("../utils/transactions");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");

const asyncHandler = require("express-async-handler");

const transfer = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { toPhone, fromPhone, amount, summary, id } = req.body;
    const isUser = await Wallets.findById(id);

    if (amount > 0) {
      if (isUser.phone !== fromPhone && req.userRole !== "admin") {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
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
          purpose: "transfer",
          reference,
          summary,
          trnxSummary: `TRFR TO: ${toPhone}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "transfer",
          reference,
          summary,
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
          status: false,
          message: errors,
        });
      }

      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({
        status: "ok",
        message: "Шилжүүлэг амжилттай",
      });
    } else {
      return res.status(400).json({
        status: "002",
        message: `Утга эерэг байх ёстой`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: "002",
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
});

const getAllTransfer = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Wallets);

  const allWallets = await Transactions.find(req.query, select)
    .sort(sort)
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
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Wallets);

  const allWallets = await Transactions.find({ trnxType: "Зарлага" })
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});
const getAllTransferProfit = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Wallets);

  const allWallets = await Transactions.find({ trnxType: "Орлого" })
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: allWallets,
    pagination,
  });
});

const getUserAllTransfers = asyncHandler(async (req, res, next) => {
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

module.exports = {
  transfer,
  getAllTransfer,
  getAllTransferCredit,
  getAllTransferProfit,
  getUserAllTransfers,
};
