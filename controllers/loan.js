const Transactions = require("../models/transactions");
const Wallets = require("../models/wallets");
const Loan = require("../models/loan");
const mongoose = require("mongoose");
const { v4, stringify } = require("uuid");
const {
  creditAccount,
  debitAccount,
  varianceAccount,
} = require("../utils/transactions");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");
const asyncHandler = require("express-async-handler");
const sendMessage = require("../utils/sendMessage");
var axios = require("axios");
const sumArray = require("sum-any-array");
const voucher_codes = require("voucher-code-generator");

const generateLoan = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let { walletSuperId, phone, body, amount, toPhone } = req.body;
  toPhone = 70000003;
  const isUser = await Wallets.find({ walletSuperId: walletSuperId });
  const isStore = await Wallets.find({ phone: toPhone });

  if (isStore[0].role !== "saler") {
    return res.status(403).json({
      success: false,
      message: "Худалдан авагч та дэлгүүрийн данс руу шилжүүлэг хийнэ!!",
    });
  }
  const reference = v4();
  const transferResult = await Promise.all([
    debitAccount({
      amount,
      phone: phone,
      purpose: "loan",
      reference,
      summary: `${phone} хэтэвч рүү хуваан төлөх мөнгө шилжсэн.`,
      trnxSummary: `Илгээгч: ${toPhone}. Шалгах дугаар:${reference} `,
      session,
      paidAt: `${new Date()}`,
      orderNumber: "",
      bossCheck: false,
    }),
    creditAccount({
      amount,
      phone: toPhone,
      purpose: "loan",
      reference,
      summary: `${phone} утасны дугаартай худалдан авагчаас хуваан төлөлтийн ${amount} төлбөр баталгаажсан.`,
      trnxSummary: `Хүлээн авагч: ${phone}. Шалгах дугаар:${reference} `,
      session,
      paidAt: `${new Date()}`,
      orderNumber: "",
      bossCheck: false,
    }),
  ]);

  const failedTxns = transferResult.filter((result) => result.status !== true);
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

  const sessions = await mongoose.startSession();
  sessions.startTransaction();
  let result;
  result = await Loan.create({
    loan: body,
    amount: amount,
    phoneNumber: phone,
  });
  await sessions.abortTransaction();
  sessions.endSession();

  return res.status(201).json({
    success: true,
    message: "Худалдан авалт амжилттай",
  });
});
const endLoan = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let { walletSuperId, phone, amount, toPhone, id } = req.body;

  toPhone = 70000001;

  const reference = v4();
  const transferResult = await Promise.all([
    debitAccount({
      amount,
      phone: phone,
      purpose: "purchase",
      reference,
      summary: `${phone} хэтэвчээс зээлийн төлбөр төлөгдсөн.`,
      trnxSummary: `Илгээгч: ${toPhone}. Шалгах дугаар:${reference} `,
      session,
      paidAt: `${new Date()}`,
      orderNumber: "",
      bossCheck: false,
    }),
    creditAccount({
      amount,
      phone: toPhone,
      purpose: "purchase",
      reference,
      summary: `${phone} утасны дугаартай худалдан авагчаас хуваан төлөлтийн ${amount} зээл хаав.`,
      trnxSummary: `Хүлээн авагч: ${phone}. Шалгах дугаар:${reference} `,
      session,
      paidAt: `${new Date()}`,
      orderNumber: "",
      bossCheck: false,
    }),
  ]);

  const failedTxns = transferResult.filter((result) => result.status !== true);
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

  const sessions = await mongoose.startSession();
  sessions.startTransaction();
  const loanss = await Loan.findById(id);
  console.log(loanss);
  loanss.close = true;
  await loanss.save();
  await sessions.abortTransaction();
  sessions.endSession();

  return res.status(201).json({
    success: true,
    message: "Худалдан авалт амжилттай",
  });
});
const myLoan = asyncHandler(async (req, res) => {
  const { walletSuperId } = req.body;

  const wallets = await Wallets.find({ walletSuperId: walletSuperId });
  console.log(wallets);
  if (!wallets) {
    return res.status(400).json({
      success: false,
      message: walletSuperId + " ID-тэй хэтэвч байхгүй!",
    });
  } else {
    const transactions = await Loan.find({
      phoneNumber: wallets[0].phone,
    }).sort({
      createdAt: -1,
    });
    console.log(transactions);
    if (!transactions) {
      return res.status(400).json({
        success: false,
        message: " Утасны дугаартай гүйлгээ алга!",
      });
    } else {
      res.status(200).json({
        success: true,
        data: transactions,
      });
    }
  }
});
module.exports = { generateLoan, myLoan, endLoan };
