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
  if (purpose === "giftcard") {
    if (amount === 2000000) {
      amount = 2500000;
    } else if (amount === 3000000) {
      amount = 4000000;
    } else if (amount === 5000000) {
      amount = 7000000;
    }
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

  return {
    status: true,
    statusCode: 201,
    message: "Debit successful",
    data: { updatedWallet, transaction },
  };
};

const varianceAccount = async ({
  amount,
  phone,
  purpose,
  reference,
  summary,
  trnxSummary,
  session,
}) => {
  console.log(purpose);
  try {
    let mainAmount = amount;
    if (purpose === "giftcard" || purpose === "bonus") {
      if (purpose === "giftcard") {
        if (amount === 2000000) {
          amount = 2500000;
        } else if (amount === 3000000) {
          amount = 4000000;
        } else if (amount === 5000000) {
          amount = 7000000;
        }
      }
      amount = amount - mainAmount;
      phone = 9913410734;
      const wallet = await Wallets.findOne({ phone });
      if (!wallet) {
        return {
          status: false,
          statusCode: 404,
          message: `Хүлээн авагч ${phone} байхгүй байна. Шалгана уу`,
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
            trnxType: "Илүү",
            purpose,
            amount,
            phone,
            reference,
            balanceBefore: Number(wallet.balance),
            balanceAfter: Number(wallet.balance) + amount,
            summary,
            trnxSummary,
          },
        ],
        { session }
      );

      return {
        status: true,
        statusCode: 201,
        message: "Debit successful",
        data: { updatedWallet, transaction },
      };
    }
  } catch (error) {
    console.log(error);
    return {
      status: false,
      statusCode: 400,
      message: `Ямар нэгэн зүйл буруу ` + error,
      err,
    };
  }
};

module.exports = {
  creditAccount,
  debitAccount,
  varianceAccount,
};
