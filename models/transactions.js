const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    trnxType: {
      type: String,
      required: true,
      enum: ["Орлого", "Зарлага"],
    },
    purpose: {
      type: String,
      enum: [
        "deposit",
        "transfer",
        "reversal",
        "cashOut",
        "purchase",
        "charge",
        "credit",
        "bonus",
        "giftcard",
      ],
      required: true,
    },
    amount: {
      type: mongoose.Decimal128,
      required: true,
      default: 0.0,
    },
    walletUsername: {
      type: String,
      ref: "Wallets",
    },
    phone: { type: Number, required: true },
    reference: { type: String, required: true },
    balanceBefore: {
      type: mongoose.Decimal128,
      required: true,
    },
    balanceAfter: {
      type: mongoose.Decimal128,
      required: true,
    },
    summary: { type: String, required: true },
    trnxSummary: { type: String, required: true },
  },
  { timestamps: true }
);

const Transactions = mongoose.model("Transactions", transactionSchema);
module.exports = Transactions;
