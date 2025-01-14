const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    trnxType: {
      type: String,
      required: true,
      enum: ["Орлого", "Зарлага", "Урамшуулал"],
    },
    purpose: {
      type: String,
      enum: [
        "deposit",
        "transfer",
        "reversal",
        "purchase",
        "charge",
        "bonus",
        "membercard",
        "giftcard",
        "operatorCharge",
        "coupon",
        "loan",
      ],
      required: true,
    },
    recieverStore: { type: String },
    recieverPhone: { type: Number },
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
    whoSelledCard: { type: Number, required: true, default: 9913410734 },
    bossCheck: { type: Boolean, default: false },
    orderNumber: { type: String },
  },
  { timestamps: true }
);

const Transactions = mongoose.model("Transactions", transactionSchema);
module.exports = Transactions;
