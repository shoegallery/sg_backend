const Transactions = require("../models/transactions");
const Wallets = require("../models/transactions");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const { creditAccount, debitAccount } = require("../utils/transactions");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");

const transfer = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { toPhone, fromPhone, amount, summary, id } = req.body;
    if (amount > 0) {
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

module.exports = { transfer };
