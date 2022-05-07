const Wallets = require("../models/wallets");
const Transactions = require("../models/transactions");

const creditAccount = async ({
  amount,
  username,
  purpose,
  reference,
  summary,
  trnxSummary,
  session,
}) => {
  const wallet = await Wallets.findOne({ username });
  if (!wallet) {
    return {
      status: false,
      statusCode: 404,
      message: `User ${username} doesn\'t exist`,
    };
  }

  const updatedWallet = await Wallets.findOneAndUpdate(
    { username },
    { $inc: { balance: amount } },
    { session }
  );

  const transaction = await Transactions.create(
    [
      {
        trnxType: "CR",
        purpose,
        amount,
        username,
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
  username,
  purpose,
  reference,
  summary,
  trnxSummary,
  session,
}) => {
  const wallet = await Wallets.findOne({ username });
  if (!wallet) {
    return {
      status: false,
      statusCode: 404,
      message: `Хэрэглэгч ${username} байхгүй байна. Шалгана уу`,
    };
  }

  if (Number(wallet.balance) < amount) {
    return {
      status: false,
      statusCode: 400,
      message: `Хэрэглэгч ${username} дансны үлдэгдэл хүрэлцэхгүй байна`,
    };
  }

  const updatedWallet = await Wallets.findOneAndUpdate(
    { username },
    { $inc: { balance: -amount } },
    { session }
  );
  const transaction = await Transactions.create(
    [
      {
        trnxType: "DR",
        purpose,
        amount,
        username,
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
