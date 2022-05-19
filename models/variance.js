const mongoose = require("mongoose");

const variance = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: ["bonus", "giftcard"],
      required: true,
    },
    recieverStore: { type: String },
    recieverPhone: { type: Number },
    amount: {
      type: mongoose.Decimal128,
      required: true,
    },

    senderPhone: { type: Number, required: true },
    who: { type: String, required: true },
    reciever: { type: Number, required: true },
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

const Transactions = mongoose.model("Transactions", variance);
module.exports = Transactions;
