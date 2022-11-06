const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        coupon_phone: {
            type: Number,
            required: [true],
            min: 10000000,
            max: 99999999,
        },
        coupon_code: {
            type: String,
            required: [true],
        },
        usedIt: {
            type: Boolean,
            default: false,
        },
        whoUsedIt: {
            type: Number,
            min: 10000000,
            max: 99999999,
        },
        amount: { type: Number, required: [true], },
        so_order: { type: String, unique: true, required: [true], },
        CouponExpire: {
            type: Date,
            default: Date.now() + 10 * 24 * 60 * 60 * 1000
        },
        WhoDoIt: { type: Number, required: [true], }
    }, { timestamps: true }
);

const CouponCode = mongoose.model("CouponCode", couponSchema);
module.exports = CouponCode;
