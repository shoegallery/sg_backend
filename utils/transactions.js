const Wallets = require("../models/wallets");
const Transactions = require("../models/transactions");
const reward = 1.2;
const creditAccount = async ({
  amount,
  phone,
  purpose,
  reference,
  summary,
  trnxSummary,
  session,
}) => {
  if (purpose === "charge") {
    amount = amount * reward;
  }

  const wallet = await Wallets.findOne({ phone });
  if (!wallet) {
    return {
      status: false,
      statusCode: 404,
      message: `User ${phone} doesn\'t exist`,
    };
  }

  const updatedWallet = await Wallets.findOneAndUpdate(
    { phone },
    { $inc: { balance: amount } },
    { session }
  );

  const transaction = await Transactions.create(
    [
      {
        trnxType: "Орлого",
        purpose,
        amount,
        phone,
        reference,
        balanceBefore: Number(wallet.balance),
        balanceAfter: Number(wallet.balance) + Number(amount),
        summary,
        trnxSummary,
      },
    ],
    { session }
  );

  console.log(`Credit successful`);
  return {
    status: true,
    statusCode: 201,
    message: "Credit successful",
    data: { updatedWallet, transaction },
  };
};

const debitAccount = async ({
  amount,
  phone,
  purpose,
  reference,
  summary,
  trnxSummary,
  session,
}) => {
  if (purpose === "cashOut") {
    amount = amount * reward;
  }
  const wallet = await Wallets.findOne({ phone });
  if (!wallet) {
    return {
      status: false,
      statusCode: 404,
      message: `Хүлээн авагч ${phone} байхгүй байна. Шалгана уу`,
    };
  }

  if (Number(wallet.balance) < amount) {
    return {
      status: false,
      statusCode: 400,
      message: `Илгээгч ${phone} дансны үлдэгдэл хүрэлцэхгүй байна`,
    };
  }

  const updatedWallet = await Wallets.findOneAndUpdate(
    { phone },
    { $inc: { balance: -amount } },
    { session }
  );
  const transaction = await Transactions.create(
    [
      {
        trnxType: "Зарлага",
        purpose,
        amount,
        phone,
        reference,
        balanceBefore: Number(wallet.balance),
        balanceAfter: Number(wallet.balance) - Number(amount),
        summary,
        trnxSummary,
      },
    ],
    { session }
  );

  console.log(`Debit successful`);
  return {
    status: true,
    statusCode: 201,
    message: "Debit successful",
    data: { updatedWallet, transaction },
  };
};

module.exports = {
  creditAccount,
  debitAccount,
};
