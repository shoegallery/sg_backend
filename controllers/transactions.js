const Transactions = require("../models/transactions");
const Wallets = require("../models/wallets");
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
        !walletSuperId
      ) {
        return res.status(400).json({
          success: false,
          message: `Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId`,
        });
      }

      if (isUser.phone !== fromPhone) {
        return res.status(403).json({
          success: false,
          message:
            "Худалдан авагч та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
        });
      }
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
          phone: fromPhone,
          purpose: "purchase",
          reference,
          summary: `Хэтэвчнээс худалдан авалтын төлбөр амжилттай төлөгдлөө.`,
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
          summary: `${fromPhone} утасны дугаартай худалдан авагчаас худалдан авалтын ${amount} төлбөр баталгаажсан.`,
          trnxSummary: `Хүлээн авагч: ${fromPhone}. Шалгах дугаар:${reference} `,
          session,
          paidAt: `${new Date()}`,
          orderNumber: "",
          bossCheck: false,
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
        return res.status(403).json({
          success: false,
          message: "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
        });
      }
      if (isUser[0].role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
        });
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
        return res.status(400).json({
          success: false,
          message:
            "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId",
        });
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
          orderNumber: "",
          bossCheck: false,
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
          orderNumber: "",
          bossCheck: false,
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
        return res.status(403).json({
          success: false,
          message: "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
        });
      }
      if (isUser[0].role !== "operator") {
        return res.status(403).json({
          success: false,
          message: "Та зөвхөн operator данс руу шилжүүлэг хийнэ!!",
        });
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
        return res.status(400).json({
          success: false,
          message:
            "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary, walletSuperId",
        });
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
          orderNumber: "",
          bossCheck: false,
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
          orderNumber: "",
          bossCheck: false,
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

const userMemberCardCharge = asyncHandler(async (req, res) => {
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
    orderNumber,
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
        !walletSuperId &&
        !orderNumber
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary,WhoCardSelled",
        });
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
        return res.status(403).json({
          success: false,
          message:
            "Та карт зарсан худалдааны зөвлөхийн дугаарыг зөв оруулна уу!!",
        });
      }
      if (
        (isStore.phone !== fromPhone && isStore.role !== "admin") ||
        isStore.role !== "operator"
      ) {
        return res.status(403).json({
          success: false,
          message: "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
        });
      }
      if (isUser[0].role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
        });
      }

      if (isMerchant[0].role == "user") {
        return res.status(403).json({
          success: false,
          message: `Та зөвхөн ажилтны данс бүртгэнэ`,
        });
      }
      if (`${orderNumber}`.length !== 5) {
        return res.status(403).json({
          success: false,
          message: `Буруу`,
        });
      }
      const reference = v4();

      if (amount !== 2000000 && amount !== 3000000 && amount !== 5000000) {
        return res.status(403).json({
          success: false,
          message: `Эдгээрийг сонгоно. 2 сая , 3 сая , 5 сая`,
        });
      }

      const transferResult = await Promise.all([
        debitAccount({
          amount,
          phone: fromPhone,
          purpose: "membercard",
          reference,
          summary: `SO${orderNumber} борлуулалтын дугаартай, ${toPhone} Утасны дугаартай дансыг ${amount} Membercard-аар цэнэглэв.`,
          trnxSummary: `Илгээгч: ${fromPhone}. Шалгах дугаар:${reference} `,
          session,
          whoSelledCard: isMerchant[0].phone,
          paidAt: `${new Date()}`,
          orderNumber: `SO${orderNumber}`,
          bossCheck: false,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "membercard",
          reference,
          summary: `Дэлгүүрээс хэрэглэгчийн хэтэвчийг ${amount} Membercard-аар цэнэглэв.`,
          trnxSummary: `Хүлээн авагч: ${toPhone}. Шалгах дугаар:${reference} `,
          session,
          whoSelledCard: isMerchant[0].phone,
          paidAt: `${new Date()}`,
          orderNumber: `SO${orderNumber}`,
          bossCheck: false,
        }),
        varianceAccount({
          amount,
          phone: toPhone,
          purpose: "membercard",
          reference,
          summary: `SO${orderNumber} борлуулалтын дугаартай, ${toPhone} Утасны дугаартай дансны ${amount} Membercard-ын бонус дүн зах зээлд нийлүүлэгдэв.`,
          trnxSummary: `Илгээгч: ${fromPhone}. Шалгах дугаар:${reference} `,
          session,
          whoSelledCard: isMerchant[0].phone,
          paidAt: `${new Date()}`,
          orderNumber: `SO${orderNumber}`,
          bossCheck: false,
        }),
      ]);
      const failedTxns = transferResult.filter(
        (result) => result.status !== true
      );
      if (failedTxns.length) {
        const errors = failedTxns.map((a) => a.message);
        console.log(errors.codeName);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          // message: errors,
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
        return res.status(403).json({
          success: false,
          message: "Та өөрийнхөө хэтэвчнээс шилжүүлэг хийх ёстой!!",
        });
      }

      if (isUser[0].role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Та зөвхөн хэрэглэгчийн данс руу шилжүүлэг хийнэ!!",
        });
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
        return res.status(403).json({
          success: false,
          message:
            "Дараах утгуудыг оруулна уу: toPhone, fromPhone, amount, summary",
        });
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
          orderNumber: "",
          bossCheck: false,
        }),
        creditAccount({
          amount,
          phone: toPhone,
          purpose: "bonus",
          reference,
          summary: "Таны хэтэвчийг бонусаар амжилттай цэнэглэлээ.",
          trnxSummary: `Хүлээн авагч: ${fromPhone}. Шалгах дугаар:${reference} `,
          session,
          paidAt: `${new Date()}`,
          orderNumber: "",
          bossCheck: false,
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

const getMyWalletTransfers = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;
  const wallets = await Wallets.find({ walletSuperId: walletSuperId });

  if (!wallets) {
    return res.status(400).json({
      success: false,
      message: walletSuperId + " ID-тэй хэтэвч байхгүй!",
    });
  }

  const transactions = await Transactions.find({
    phone: wallets[0].phone,
  }).sort({
    createdAt: -1,
  });

  if (!transactions) {
    return res.status(400).json({
      success: false,
      message: " Утасны дугаартай гүйлгээ алга!",
    });
  }
  res.status(200).json({
    success: true,
    data: transactions,
  });
});

const getAllUniversalStatement = asyncHandler(async (req, res, next) => {
  const { beginDate, endDate, purpose, trnxType } = req.body;
  const allWallets = await Transactions.find({
    purpose: purpose,
    trnxType: trnxType,
    createdAt: {
      $gte: new Date(beginDate + "T00:00:00.000Z"),
      $lt: new Date(endDate + "T23:59:59.999Z"),
    },
  }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: allWallets,
  });
});

const statisticData = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;

  const isStore = await Wallets.find({ walletSuperId: walletSuperId });

  if (!walletSuperId) {
    return res.status(400).json({
      success: false,
      message: "Дараах утгa оруулна уу: walletSuperId",
    });
  }

  if (isStore[0].role !== "operator" && isStore[0].role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Эрхгүй",
    });
  }

  const groupMonthTransActions = await Transactions.aggregate([
    {
      $group: {
        _id: [
          { date: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } },
          { purpose: "$purpose" },
          { trnxType: "$trnxType" },
        ],
        sum: { $sum: "$amount" },
      },
    },
  ]);
  const totalTransActions = await Transactions.aggregate([
    {
      $group: {
        _id: [{ purpose: "$purpose" }, { trnxType: "$trnxType" }],
        sum: { $sum: "$amount" },
      },
    },
  ]);
  const totalWallets = await Wallets.aggregate([
    {
      $group: {
        _id: [{ role: "$role" }],
        sum: { $sum: "$balance" },
      },
    },
  ]);
  const lastTenTransActions = await Transactions.find({})
    .sort({ createdAt: -1 })
    .limit(10);
  const allSelledCard = await Transactions.aggregate([
    { $match: { purpose: "membercard", trnxType: "Зарлага" } },
    {
      $group: {
        _id: { amount: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: [
      {
        groupMonthTransActions: groupMonthTransActions,
        lastTenTransActions: lastTenTransActions,
        totalTransActions: totalTransActions,
        totalWallets: totalWallets,
        allSelledCard: allSelledCard,
      },
    ],
  });
});

const ecoSystem = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;
  const isStore = await Wallets.find({ walletSuperId: walletSuperId });

  if (!walletSuperId) {
    return res.status(400).json({
      success: false,
      message: "Дараах утгa оруулна уу: walletSuperId",
    });
  }
  if (isStore[0].role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Эрхгүй",
    });
  }
  var stackTwo = [];
  var stackThree = [];
  var membercardValue = 0;
  var purchaseValue = 0;
  var bonusValue = 0;
  var operatorChargeValue = 0;
  var problemStack = 0;
  var resp = null;
  const totalTransActions = await Transactions.aggregate([
    {
      $group: {
        _id: [{ purpose: "$purpose" }, { trnxType: "$trnxType" }],
        sum: { $sum: "$amount" },
      },
    },
  ]);
  const totalWallets = await Wallets.aggregate([
    {
      $group: {
        _id: [{ role: "$role" }],
        sum: { $sum: "$balance" },
      },
    },
  ]);
  ////////////////////////////////////////
  totalTransActions.map((el) => {
    stackTwo.push({
      purpose: el._id[0].purpose,
      trnxType: el._id[1].trnxType,
      value: parseInt(el.sum.toString()),
    });
  });

  totalWallets.map((el) => {
    stackThree.push({
      role: el._id[0].role,
      value: parseInt(el.sum.toString()),
    });
  });

  stackTwo.map((elem) => {
    if (elem.purpose === "membercard") {
      if (elem.trnxType === "Орлого") {
        membercardValue = membercardValue + parseInt(elem.value);
      } else if (elem.trnxType === "Зарлага") {
        membercardValue = membercardValue - parseInt(elem.value);
      } else if (elem.trnxType === "Урамшуулал") {
        membercardValue = membercardValue - parseInt(elem.value);
      }
    } else if (elem.purpose === "purchase") {
      if (elem.trnxType === "Орлого") {
        purchaseValue = purchaseValue + parseInt(elem.value);
      } else if (elem.trnxType === "Зарлага") {
        purchaseValue = purchaseValue - parseInt(elem.value);
      }
    } else if (elem.purpose === "bonus") {
      if (elem.trnxType === "Орлого") {
        bonusValue = bonusValue + parseInt(elem.value);
      } else if (elem.trnxType === "Зарлага") {
        bonusValue = bonusValue - parseInt(elem.value);
      }
    } else if (elem.purpose === "operatorCharge") {
      if (elem.trnxType === "Орлого") {
        operatorChargeValue = operatorChargeValue + parseInt(elem.value);
      } else if (elem.trnxType === "Зарлага") {
        operatorChargeValue = operatorChargeValue - parseInt(elem.value);
      }
    }
  });

  stackThree.map((lu) => {
    if (lu.role === "user") {
      problemStack = problemStack + parseInt(lu.value);
    } else if (lu.role === "variance") {
      problemStack = problemStack - parseInt(lu.value);
    } else if (lu.role === "saler") {
      problemStack = problemStack + parseInt(lu.value);
    } else if (lu.role === "operator") {
      problemStack = problemStack + parseInt(lu.value);
    } else if (lu.role === "admin") {
      problemStack = problemStack + parseInt(lu.value);
    }
  });
  resp = null;
  if (
    problemStack - 1000000000 === 0 &&
    membercardValue === 0 &&
    operatorChargeValue === 0 &&
    bonusValue === 0 &&
    purchaseValue === 0
  ) {
    resp = "success";
  } else {
    resp = "warning";
    console.log("warning");
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

  res.status(200).json({
    success: true,
    data: resp,
  });
});

const bonusSalary = asyncHandler(async (req, res, next) => {
  const { beginDate, endDate, trnxType, purpose } = req.body;
  const bonusSalaryData = await Transactions.aggregate([
    {
      $match: {
        purpose: purpose,
        trnxType: trnxType,
        createdAt: {
          $gte: new Date(beginDate + "T00:00:00.000Z"),
          $lt: new Date(endDate + "T23:59:59.999Z"),
        },
      },
    },
    {
      $group: {
        _id: [
          {
            date: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
              },
            },
          },
          { whoSelledCard: "$whoSelledCard" },
        ],
        count: { $sum: "$amount" },
      },
    },
  ]);
  res.status(200).json({
    success: true,
    data: bonusSalaryData,
  });
});
const bossUnchecked = asyncHandler(async (req, res, next) => {
  const { walletSuperId } = req.body;

  const isStore = await Wallets.find({ walletSuperId: walletSuperId });
  if (!walletSuperId) {
    return res.status(400).json({
      success: false,
      message: "Дараах утгa оруулна уу: walletSuperId",
    });
  }
  if (isStore[0].role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Эрхгүй",
    });
  }
  const allWallets = await Transactions.find({
    purpose: "membercard",
    trnxType: "Зарлага",
    bossCheck: false,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: allWallets,
  });
});
const bossChecked = asyncHandler(async (req, res, next) => {
  const { walletSuperId, id } = req.body;

  const isStore = await Wallets.find({ walletSuperId: walletSuperId });
  if (!walletSuperId) {
    return res.status(400).json({
      success: false,
      message: "Дараах утгa оруулна уу: walletSuperId",
    });
  }
  if (isStore[0].role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Эрхгүй",
    });
  }
  const wallets = await Transactions.findById(id);

  if (!wallets) {
    throw new MyError("id байхгүй", 403);
  }
  if (wallets.bossCheck === true) {
    throw new MyError("болохгүй", 403);
  }
  wallets.bossCheck = true;
  await wallets.save();
  res.status(200).json({
    success: true,
  });
});

module.exports = {
  /* {Системийн auto хяналт}*/
  ecoSystem,

  /* {Чек тэй холбоотой}*/
  bossChecked,
  bossUnchecked,

  /* {Чек тэй холбоотой}*/
  bonusSalary,
  statisticData,
  // Админы хийх зүйлс
  getAllUniversalStatement,

  userPurchase,
  operatorCharge,

  getMyWalletTransfers,
  userCharge,
  userChargeBonus,
  userMemberCardCharge,
};
