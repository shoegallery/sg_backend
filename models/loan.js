const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    loan: {
      type: Object,
    },
    amount: {
      type: mongoose.Decimal128,
    },
    phoneNumber: { type: Number },
    close: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Loan = mongoose.model("Loan", loanSchema);
module.exports = Loan;
