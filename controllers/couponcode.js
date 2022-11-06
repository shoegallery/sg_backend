const Transactions = require("../models/transactions");
const Wallets = require("../models/wallets");
const CouponCode = require("../models/coupon");
const mongoose = require("mongoose");
const { v4, stringify } = require("uuid");
const {
    creditAccount,
    debitAccount,
    varianceAccount,
} = require("../utils/transactions");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate");
const asyncHandler = require("express-async-handler");
const sendMessage = require("../utils/sendMessage");
var axios = require("axios");
const sumArray = require('sum-any-array');
const voucher_codes = require('voucher-code-generator');


const odooData = asyncHandler(async (req, res) => {
    const { walletSuperId, month, year } = req.body;

    const response_data = [];
    const wallets = await Wallets.findOne({ walletSuperId: walletSuperId });
    if (!wallets) {
        throw new MyError("Хүчингүй " + walletSuperId, 401);
    }
    var odoo_data = JSON.stringify({
        jsonrpc: "2.0",
        params: {
            db: "sg",
            login: "tamir-office",
            password: "tamir123",
        },
    });
    await axios({
        method: "POST",
        url: `http://43.231.115.114:8079/web/session/authenticate`,
        headers: {
            "Content-Type": "application/json",
        },
        data: odoo_data,
    })
        .then(function (login_response) {
            if (login_response.data.result.is_admin == true) {
                var login_season = login_response.data.result.session_id;
                var data_s = JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {
                        model: "sale.order.line",
                        fields: ["order_id", "phone_number", "sale_date", "price_subtotal"],
                        domain: [
                            ["state", "in", ["done"]],
                            ["phone_number", "!=", false],
                            ["phone_number", "!=", "0"],
                            ["is_return", "=", false],
                            ["year", "=", year],
                            ["month", "=", month],
                            ["price_subtotal", ">", 299999],
                        ],
                        context: {
                            lang: "mn_MN",
                            tz: "UTC",
                            uid: 76,
                            params: {
                                action: 452,
                            },
                            bin_size: true,
                        },
                        offset: 0,
                        limit: "",
                        sort: "",
                    },
                    id: 339315687,
                });
                axios({
                    method: "POST",
                    url: `http://43.231.115.114:8079/web/dataset/search_read`,
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: `session_id = ${login_season}`,
                    },
                    data: data_s,
                })
                    .then(function (response) {
                        response.data.result.records.map((el) => {
                            response_data.push({
                                SO: el.order_id[1],
                                phone_number: parseInt(el.phone_number.replace("-", "").replace(" ", "")),
                                amount: el.price_subtotal,
                            });
                        });

                        if (response_data.length === response.data.result.records.length) {
                            const getValue = (item) => item.amount;
                            return res.status(200).json({
                                success: true,
                                option: { year: year, month: month, length: response.data.result.records.length, sum: sumArray(response_data, getValue), },
                                message: response_data,
                            });
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            }
        })
        .catch(function (error) {
            console.log(error);
        });
});
const generate_coupon = asyncHandler(async (req, res) => {
    const { walletSuperId, data } = req.body;
    const wallets = await Wallets.findOne({ walletSuperId: walletSuperId });
    var result;
    const session = await mongoose.startSession();
    if (!wallets) {
        throw new MyError("Хүчингүй " + walletSuperId + " алга", 401);
    }
    else {
        data.map(async (lu) => {
            const duplicate = await CouponCode.findOne({ so_order: lu.SO });
            if (!duplicate) {
                result = await CouponCode.create({
                    amount: 30000,
                    coupon_phone: lu.phone_number,
                    usedIt: false,
                    coupon_code: voucher_codes.generate({
                        length: 5,
                        count: 1,
                        charset: voucher_codes.charset("alphabetic")
                    })[0],
                    so_order: lu.SO
                });
                if (result) {
                    const message = {
                        channel: "sms",
                        title: "SHOE GALLERY",
                        body: `Sain baina uu? Ta daraah coupon codiig (${result.coupon_code}) ShoeGallery WALLET app-d ashiglan hudaldan avaltaasaa 30000MNT hunguluuleerei. SHOE GALLERY | 80409000`,
                        receivers: [`${result.coupon_phone}`],
                        shop_id: "2706",
                    };
                    // await sendMessage({
                    //     message,
                    // });
                    console.log(message)
                }
            }
        })
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
            message: ok
        });
    }

});
const test = asyncHandler(async (req, res, next) => {
    var stack = [];
    const couponUsed = await CouponCode.aggregate([
        {
            $group: {
                _id: [{ usedIt: "$usedIt" }],
                sum: { $sum: "$amount" }
            },

        },
    ]);
    console.log(couponUsed[0])
    couponUsed[0]._id[0].usedIt === true ? console.log(couponUsed[0].sum) : console.log(couponUsed[1].sum)

    res.status(200).json({
        success: true,
        data: couponUsed,
    });
});


module.exports = { odooData, generate_coupon, test };
