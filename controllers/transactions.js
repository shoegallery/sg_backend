const Transactions = require("../models/transactions");
const mongoose = require("mongoose");
const { v4 } = require("uuid");
const { creditAccount, debitAccount } = require("../utils/transactions");

const transfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { toUsername, fromUsername, amount, summary, paidAt } = req.body;
    if (amount > 0) {
      const reference = v4();
      if (!toUsername && !fromUsername && !amount && !summary) {
        return res.status(400).json({
          status: false,
          message:
            "Дараах утгуудыг оруулна уу: toUsername, fromUsername, amount, summary",
        });
      }

      const transferResult = await Promise.all([
        debitAccount({
          amount,
          username: fromUsername,
          purpose: "transfer",
          reference,
          summary,
          trnxSummary: `TRFR TO: ${toUsername}. TRNX REF:${reference} `,
          session,
          paidAt: `${new Date()}`,
        }),
        creditAccount({
          amount,
          username: toUsername,
          purpose: "transfer",
          reference,
          summary,
          trnxSummary: `TRFR FROM: ${fromUsername}. TRNX REF:${reference} `,
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
        status: "bad",
        message: `Утга эерэг байх ёстой`,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: "bad",
      message: `Unable to find perform transfer. Please try again. \n Error: ${err}`,
    });
  }
};

module.exports = { transfer };
