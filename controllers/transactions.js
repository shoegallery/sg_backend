const Transactions = require("../models/transactions");
const Wallets = require("../models/wallets");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const {
  creditAccount,
  debitAccount,
  varianceAccount,
} = require("../utils/transactions");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");
const asyncHandler = require("express-async-handler");
const sendMessage = require("../utils/sendMessage");
const userPurchase = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const {
    toPhone,
    fromPhone,
    amount,
    summary,
    id,
    walletSuperId,
    OrderNumber,
  } = req.body;

  const isUser = await Wallets.findById(id);
  const isStore = await Wallets.find({ phone: toPhone });
  try {
    if (amount > 0 && isUser.walletSuperId == walletSuperId) {
      if (
        !toPhone &&
        !fromPhone &&
        !amount &&
        !summary &&
        !id &&
        !walletSuperId &&
        !OrderNumber
      ) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId, OrderNumber",
          400
        );
      }
      if (OrderNumber == undefined) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId, OrderNumber",
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
          trnxSummary: `Илгээгч: ${toPhone}. Шалгах дугаар:${reference} `,
          session,
          paidAt: `${new Date()}`,

        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "purchase",
          reference,
          summary: `${fromPhone} утасны дугаартай худалдан авагчаас ${OrderNumber} захиалгын худалдан авалтын ${amount} төлбөр баталгаажсан.`,
          trnxSummary: `Хүлээн авагч: ${fromPhone}. Шалгах дугаар:${reference} `,
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
      message: `Ямар нэгэн зүйл буруу байна`,
    });
  }
});

const userCharge = asyncHandler(async (req, res) => {
  const { toPhone, fromPhone, amount, summary, walletSuperId, id } = req.body;
  const isUser = await Wallets.find({ phone: toPhone });
  const isStore = await Wallets.findById(id);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (amount > 0 && isStore.walletSuperId == walletSuperId) {
      if (
        (isStore.phone !== fromPhone && isStore.role !== "admin") ||
        isStore.role !== "operator"
      ) {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      if (isUser[0].role !== "user") {
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
          trnxSummary: `Илгээгч: ${toPhone}. Шалгах дугаар:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "charge",
          reference,
          summary: "Дэлгүүрээс хэрэглэгчийн хэтэвчийг цэнэглэв.",
          trnxSummary: `Хүлээн авагч: ${fromPhone}. Шалгах дугаар:${reference} `,
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
      message: `Ямар нэгэн зүйл буруу байна.`,
    });
  }
});

const operatorCharge = asyncHandler(async (req, res) => {
  const { toPhone, fromPhone, amount, summary, walletSuperId, id } = req.body;
  const isUser = await Wallets.find({ phone: toPhone });
  const isStore = await Wallets.findById(id);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (amount > 0 && isStore.walletSuperId == walletSuperId) {
      if (isStore.phone !== fromPhone && isStore.role !== "admin") {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      if (isUser[0].role !== "operator") {
        throw new MyError("Та зөвхөн operator данс руу шилжүүлэг хийнэ!!", 403);
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
          purpose: "operatorCharge",
          reference,
          summary: "Operator Хэтэвчийг амжилттай цэнэглэв.",
          trnxSummary: `Хүлээн авагч: ${toPhone}. Шалгах дугаар:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "operatorCharge",
          reference,
          summary: "Admin Operator-ийн хэтэвчийг цэнэглэв.",
          trnxSummary: `Илгээгч: ${fromPhone}. Шалгах дугаар:${reference} `,
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
        message: "Оператор цэнэглэлт амжилттай",
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
      message: `Ямар нэгэн зүйл буруу байна.`,
    });
  }
});

const userGiftCardCharge = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const {
    toPhone,
    fromPhone,
    amount,
    summary,
    id,
    walletSuperId,
    WhoCardSelled,
  } = req.body;

  try {
    const isStore = await Wallets.findById(id);
    var walletNewType;
    if (amount > 0 && isStore.walletSuperId == walletSuperId) {
      if (
        !toPhone &&
        !fromPhone &&
        !amount &&
        !summary &&
        !id &&
        !walletSuperId
      ) {
        throw new MyError(
          "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary,WhoCardSelled",
          400
        );
      }
      var WhoCardSelledNumber;
      if (req.body.WhoCardSelled == undefined) {
        WhoCardSelledNumber = 9913410734;
      } else {
        WhoCardSelledNumber = WhoCardSelled;
      }
      const isUser = await Wallets.find({ phone: toPhone });
      const isMerchant = await Wallets.find({ phone: WhoCardSelledNumber });

      if (false == isMerchant) {
        throw new MyError(
          "Та карт зарсан худалдааны зөвлөхийн дугаарыг зөв оруулна уу!!",
          403
        );
      }
      if (
        (isStore.phone !== fromPhone && isStore.role !== "admin") ||
        isStore.role !== "operator"
      ) {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }
      if (isUser[0].role !== "user") {
        throw new MyError(
          "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
          403
        );
      }

      if (isMerchant[0].role == "user") {
        return res.status(403).json({
          success: false,
          message: `Та зөвхөн ажилтны данс бүртгэнэ`,
        });
      }
      const reference = v4();

      if (amount !== 2000000 && amount !== 3000000 && amount !== 5000000) {
        throw new MyError("Дараах багцнаас л сонгоно  : 2сая , 3сая , 5сая");
      }

      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "giftcard",
          reference,
          summary: `${toPhone} Хэтэвчийг амжилттай ${amount}  Giftcartaar цэнэглэв.`,
          trnxSummary: `Илгээгч: ${fromPhone}. Шалгах дугаар:${reference} `,
          session,
          whoSelledCard: isMerchant[0].phone,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "giftcard",
          reference,
          summary: `Дэлгүүрээс хэрэглэгчийн хэтэвчийг ${amount} Giftcartaar цэнэглэв.`,
          trnxSummary: `Хүлээн авагч: ${toPhone}. Шалгах дугаар:${reference} `,
          session,
          whoSelledCard: isMerchant[0].phone,
          paidAt: `${new Date()}`,
        }),
        varianceAccount({
          amount,
          phone: toPhone,
          purpose: "giftcard",
          reference,
          summary: `${toPhone} дугаартай хэрэглэгчийн ${amount} Giftcart-ын бонус дүн зах зээлд нийлүүлэгдэв.`,
          trnxSummary: `Илгээгч: ${fromPhone}. Шалгах дугаар:${reference} `,
          session,
          whoSelledCard: isMerchant[0].phone,
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

      if (amount == 2000000) {
        walletNewType = "rosegold";
      } else if (amount == 3000000) {
        walletNewType = "golden";
      } else if (amount == 5000000) {
        walletNewType = "platnium";
      } else {
        walletNewType = "member";
      }

      await Wallets.findByIdAndUpdate(
        isUser[0].id,
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
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({
      success: false,
      message: `Ямар нэгэн зүйл буруу байна.`,
      err,
    });
  }
});

const userChargeBonus = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toPhone, fromPhone, amount, summary, id, walletSuperId } = req.body;

    const isStore = await Wallets.findById(id);
    const isUser = await Wallets.find({ phone: toPhone });

    if (amount > 0 && isStore.walletSuperId == walletSuperId) {
      if (
        (isStore.phone !== fromPhone && isStore.role !== "admin") ||
        isStore.role !== "operator"
      ) {
        throw new MyError(
          "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
          403
        );
      }

      if (isUser[0].role !== "user") {
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
          summary: summary,
          trnxSummary: `Илгээгч: ${toPhone}. Шалгах дугаар:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "bonus",
          reference,
          summary: "Таны хэтэвчийг бонусаар амжилттай цэнэглэгдлээ.",
          trnxSummary: `Хүлээн авагч: ${fromPhone}. Шалгах дугаар:${reference} `,
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
      message: `Ямар нэгэн зүйл буруу байна.`,
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


  const { walletSuperId } = req.body;
  const wallets = await Wallets.find({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }

  const transactions = await Transactions.find({
    phone: wallets[0].phone,
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })

  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});
const getUserTransfersCredit = asyncHandler(async (req, res, next) => {

  const { walletSuperId } = req.body;
  const wallets = await Wallets.find({ walletSuperId: walletSuperId });

  if (!wallets) {
    throw new MyError(req.params.id + " ID-тэй хэтэвч байхгүй!", 400);
  }

  const transactions = await Transactions.find({
    phone: wallets[0].phone,
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })


  if (!transactions) {
    throw new MyError(req.body.phone + " Утасны дугаартай гүйлгээ алга!", 400);
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});

const getAllTransfer = asyncHandler(async (req, res, next) => {

  const select = req.query.select;


  const allWallets = await Transactions.find(req.query, select)
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllTransferCredit = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({ trnxType: "Зарлага" })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllTransferDebit = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({ trnxType: "Орлого" })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllCharge = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({ purpose: "charge" })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllChargeCredit = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({
    purpose: "charge",
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllChargeDebit = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({
    purpose: "charge",
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});

const getAllBonus = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({ purpose: "bonus" })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllBonusCredit = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({
    purpose: "bonus",
    trnxType: "Зарлага",
  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllBonusDebit = asyncHandler(async (req, res, next) => {



  const allWallets = await Transactions.find({
    purpose: "bonus",
    trnxType: "Орлого",
  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});

const getAllGiftCard = asyncHandler(async (req, res, next) => {
  const allWallets = await Transactions.find({ purpose: "giftcard" })
    .sort({ createdAt: -1 })
  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllGiftCardCredit = asyncHandler(async (req, res, next) => {




  const allWallets = await Transactions.find({
    purpose: "giftcard",
    trnxType: "Зарлага",

  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});
const getAllGiftCardDebit = asyncHandler(async (req, res, next) => {
  const allWallets = await Transactions.find({
    purpose: "giftcard",
    trnxType: "Орлого",

  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});

const getAllUniversalStatement = asyncHandler(async (req, res, next) => {
  const { beginDate, endDate, purpose, trnxType } = req.body;
  const allWallets = await Transactions.find({
    purpose: purpose,
    trnxType: trnxType,
    createdAt: {
      $gte: new Date(beginDate + "T00:00:00.000Z"),
      $lt: new Date(endDate + "T23:59:59.999Z")
    }
  })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: allWallets,

  });
});

const statisticData = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;

  const isStore = await Wallets.find({ walletSuperId: walletSuperId });

  if (!walletSuperId) {
    throw new MyError("Дараах утгa оруулна уу: walletSuperId", 400);
  }

  if (isStore[0].role !== "operator" && isStore[0].role !== "admin") {
    throw new MyError("Эрхгүй", 403);
  }

  const groupMonthTransActions = await Transactions.aggregate([{
    $group: {
      _id: [{ date: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } }, { purpose: "$purpose" }, { trnxType: "$trnxType" }],
      sum: { $sum: "$amount" },

    }
  }]);
  const totalTransActions = await Transactions.aggregate([{
    $group: {
      _id: [{ purpose: "$purpose" }, { trnxType: "$trnxType" }],
      sum: { $sum: "$amount" },
    }
  }]);
  const totalWallets = await Wallets.aggregate([{
    $group: {
      _id: [{ role: "$role" }],
      sum: { $sum: "$balance" },
    }
  }]);
  const lastTenTransActions = await Transactions.find({}).sort({ createdAt: -1 }).limit(10);
  const allSelledCard = await Transactions.aggregate([{ $match: { purpose: "giftcard", trnxType: "Зарлага" } }, {
    $group: {
      _id: { amount: "$amount" },
      "count": { "$sum": 1 }
    }
  }]);

  res.status(200).json({
    success: true,
    data: [{
      groupMonthTransActions: groupMonthTransActions,
      lastTenTransActions: lastTenTransActions,
      totalTransActions: totalTransActions,
      totalWallets: totalWallets,
      allSelledCard: allSelledCard

    }]

    ,
  });
});



const ecoSystem = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;

  const isStore = await Wallets.find({ walletSuperId: walletSuperId });

  if (!walletSuperId) {
    throw new MyError("Дараах утгa оруулна уу: walletSuperId", 400);
  }
  if (isStore[0].role !== "admin") {
    throw new MyError("Эрхгүй", 403);
  }
  var stackTwo = []
  var stackThree = []
  var giftcardValue = 0
  var purchaseValue = 0
  var bonusValue = 0
  var operatorChargeValue = 0
  var problemStack = 0
  var resp = null
  const totalTransActions = await Transactions.aggregate([{
    $group: {
      _id: [{ purpose: "$purpose" }, { trnxType: "$trnxType" }],
      sum: { $sum: "$amount" },
    }
  }]);
  const totalWallets = await Wallets.aggregate([{
    $group: {
      _id: [{ role: "$role" }],
      sum: { $sum: "$balance" },
    }
  }]);


  ////////////////////////////////////////
  totalTransActions.map(el => {
    stackTwo.push({ purpose: el._id[0].purpose, trnxType: el._id[1].trnxType, value: parseInt(el.sum.toString()) })
  })

  totalWallets.map(el => {
    stackThree.push({ role: el._id[0].role, value: parseInt(el.sum.toString()) })
  })

  stackTwo.map(elem => {
    if (elem.purpose === "giftcard") {
      if (elem.trnxType === "Орлого") {
        giftcardValue = giftcardValue + parseInt(elem.value)

      } else if (elem.trnxType === "Зарлага") {
        giftcardValue = giftcardValue - parseInt(elem.value)
      }
      else if (elem.trnxType === "Урамшуулал") {
        giftcardValue = giftcardValue - parseInt(elem.value)
      }
    }
    else if (elem.purpose === "purchase") {
      if (elem.trnxType === "Орлого") {
        purchaseValue = purchaseValue + parseInt(elem.value)
      } else if (elem.trnxType === "Зарлага") {
        purchaseValue = purchaseValue - parseInt(elem.value)
      }
    }
    else if (elem.purpose === "bonus") {
      if (elem.trnxType === "Орлого") {
        bonusValue = bonusValue + parseInt(elem.value)
      } else if (elem.trnxType === "Зарлага") {
        bonusValue = bonusValue - parseInt(elem.value)
      }
    }
    else if (elem.purpose === "operatorCharge") {
      if (elem.trnxType === "Орлого") {
        operatorChargeValue = operatorChargeValue + parseInt(elem.value)

      } else if (elem.trnxType === "Зарлага") {
        operatorChargeValue = operatorChargeValue - parseInt(elem.value)

      }
    }
  })

  stackThree.map(lu => {
    if (lu.role === "user") {
      problemStack = problemStack + parseInt(lu.value)
    }
    else if (lu.role === "variance") {
      problemStack = problemStack - parseInt(lu.value)
    }
    else if (lu.role === "saler") {
      problemStack = problemStack + parseInt(lu.value)
    }
    else if (lu.role === "operator") {
      problemStack = problemStack + parseInt(lu.value)

    }
    else if (lu.role === "admin") {
      problemStack = problemStack + parseInt(lu.value)
    }
  })
  resp = null
  if (problemStack - 100000000 === 0 && giftcardValue === 0 && operatorChargeValue === 0 && bonusValue === 0 && purchaseValue === 0) {
    resp = "success"
  } else {
    resp = "warning"
    const message = {
      channel: "sms",
      title: "SHOE GALLERY",
      body: `Warning!!! ShoeGallery Wallet systemd hacker nevtersen baina baina. Serveriig buren untraasan.`,
      receivers: ["86218721", "88034666"],
      shop_id: "2706",
    };
    await sendMessage({
      message,
    });
  }


  ///////////////////////////////////////

  res.status(200).json({
    success: true,
    data: resp
  });
});























const bonusSalary = asyncHandler(async (req, res, next) => {

  const { beginDate, endDate, trnxType, purpose } = req.body;

  const bonusSalaryData = await Transactions.aggregate([{
    $match: {
      purpose: purpose,
      trnxType: trnxType, createdAt: {
        $gte: new Date(beginDate + "T00:00:00.000Z"),
        $lt: new Date(endDate + "T23:59:59.999Z")
      }
    }
  }, {
    $group: {
      _id: [{
        date: {
          $dateToString: {
            format: "%Y-%m", date: "$createdAt",
          }
        },
      }, { whoSelledCard: "$whoSelledCard" }],
      count: { $sum: "$amount" }
    }
  }]);

  // const totalTransActions = await Transactions.aggregate([{
  //   $group: {
  //     _id: [{ purpose: "$purpose" }, { trnxType: "$trnxType" }],
  //     sum: { $sum: "$amount" },
  //   }
  // }]);
  // const totalWallets = await Wallets.aggregate([{
  //   $group: {
  //     _id: [{ role: "$role" }],
  //     sum: { $sum: "$balance" },
  //   }
  // }]);
  // const lastTenTransActions = await Transactions.find({}).sort({ createdAt: -1 }).limit(10);

  res.status(200).json({
    success: true,
    data: bonusSalaryData

  });
});


// const totalTransaction = asyncHandler(async (req, res, next) => {
//   const { walletSuperId, id } = req.body;

//   const isStore = await Wallets.findById(id);

//   if (!walletSuperId) {
//     throw new MyError("Дараах утгa оруулна уу: walletSuperId", 400);
//   }
//   console.log(isStore.role);
//   if (isStore.role !== "operator" && isStore.role !== "admin") {
//     throw new MyError("Эрхгүй", 403);
//   }
//   const totalGifcardDebit = await Transactions.find(
//     {
//       purpose: "giftcard",
//       trnxType: "Орлого",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   const totalBonusDebit = await Transactions.find(
//     {
//       purpose: "bonus",
//       trnxType: "Орлого",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   const totalChargeDebit = await Transactions.find(
//     {
//       purpose: "charge",
//       trnxType: "Орлого",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );

//   const totalPurchaseDebit = await Transactions.find(
//     {
//       purpose: "purchase",
//       trnxType: "Орлого",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   const totalVarianceDebit = await Transactions.find(
//     {
//       purpose: "giftcard",
//       trnxType: "Урамшуулал",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   console.log(totalPurchaseDebit);
//   const totalOperatorChargeDebit = await Transactions.find(
//     {
//       purpose: "operatorCharge",
//       trnxType: "Зарлага",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );

//   const totalGifcardCredit = await Transactions.find(
//     {
//       purpose: "giftcard",
//       trnxType: "Зарлага",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   const totalPurchaseCredit = await Transactions.find(
//     {
//       purpose: "purchase",
//       trnxType: "Зарлага",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );

//   const totalOperatorChargeCredit = await Transactions.find(
//     {
//       purpose: "operatorCharge",
//       trnxType: "Зарлага",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );

//   const totalBonusCredit = await Transactions.find(
//     {
//       purpose: "bonus",
//       trnxType: "Зарлага",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   const totalChargeCredit = await Transactions.find(
//     {
//       purpose: "charge",
//       trnxType: "Зарлага",
//     },
//     {
//       $group: {
//         total: { $sum: "$amount" },
//       },
//     }
//   );
//   res.status(200).json({
//     success: true,
//     data: {
//       totalGifcardDebit: totalGifcardDebit,
//       totalGifcardCredit: totalGifcardCredit,
//       totalVarianceDebit: totalVarianceDebit,

//       totalBonusDebit: totalBonusDebit,
//       totalBonusCredit: totalBonusCredit,

//       totalChargeDebit: totalChargeDebit,
//       totalChargeCredit: totalChargeCredit,

//       totalPurchaseDebit: totalPurchaseDebit,
//       totalPurchaseCredit: totalPurchaseCredit,

//       totalOperatorChargeDebit: totalOperatorChargeDebit,
//       totalOperatorChargeCredit: totalOperatorChargeCredit,
//     },
//   });
// });

module.exports = {
  ecoSystem,
  bonusSalary,
  statisticData,
  userPurchase,
  getAllUniversalStatement,
  operatorCharge,

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
