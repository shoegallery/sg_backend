const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
      unique: true,
    },
    balance: {
      type: mongoose.Decimal128,
      required: true,
      default: 0.0,
    },
    firstname: {
      $toUpper: {},
      type: String,
      required: true,
    },
    lastname: {
      $toUpper: {},
      type: String,
      required: true,
    },
    password: {
      type: String,
      minlength: 4,
      required: [true, "Нууц үгээ оруулна уу"],
      select: false,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: "{VALUE} бол имэйл биш",
        isAsync: false,
      },
      unique: true,
    },
  },
  { timestamps: true }
);

walletSchema.pre("save", async function (next) {
  // Нууц үг өөрчлөгдөөгүй бол дараачийн middleware рүү шилж
  if (!this.isModified("password")) next();
  // Нууц үг өөрчлөгдсөн
  console.time("salt");

  const salt = await bcrypt.genSalt(10);

  console.timeEnd("salt");

  console.time("hash");
  this.password = await bcrypt.hash(this.password, salt);
  console.timeEnd("hash");
});

walletSchema.methods.getJsonWebToken = function () {
  const token = jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRESIN,
    }
  );
  return token;
};

walletSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

walletSchema.methods.generatePasswordChangeToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const Wallets = mongoose.model("Wallets", walletSchema);
module.exports = Wallets;
