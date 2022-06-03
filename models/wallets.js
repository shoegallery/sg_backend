const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");



var randtoken = require("rand-token").generator({
  chars: "default",
  source: crypto.randomBytes,
});

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
    walletSuperId: {
      type: String,
      default: function () {
        return randtoken.generate(64);
      },
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
      min: 60000000,
      max: 99999999,
    },
    isStore: {
      type: String,
    },
    gender: { type: String, enum: ["male", "female"] },
    role: {
      type: String,
      required: [true, "Хэрэглэгчийн эрхийг оруулна уу"],
      enum: ["user", "operator", "admin", "saler", "variance"],
      default: "user",
    },
    walletType: {
      type: String,
      required: [true, "Хэтэвчний эрхийг оруулна уу"],
      enum: ["rosegold", "platnium", "golden", "member"],
      default: "member",
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
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(JSON.stringify(resetToken))
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("Wallets", walletSchema);
