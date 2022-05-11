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
    },
    lastname: {
      $toUpper: {},
      type: String,
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, "Нууц үгээ оруулна уу"],
      select: false,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: [true, "Хэрэглэгчийн эрхийг оруулна уу"],
      enum: ["user", "operator", "admin", "saler"],
      default: "user",
    },
    walletType: {
      type: String,
      required: [true, "Хэтэвчний эрхийг оруулна уу"],
      enum: ["basic", "platnium", "gold"],
      default: "basic",
    },
    pinCode: {
      type: String,
      minlength: 4,
      maxlength: 4,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
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
  const resetToken = Math.floor(100000 + Math.random() * 900000);
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
module.exports = mongoose.model("Wallets", walletSchema);
