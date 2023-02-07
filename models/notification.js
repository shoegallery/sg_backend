const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        expoNoticationToken: {
            type: String,
        },
    }
);

const notificationList = mongoose.model("notificationList", notificationSchema);
module.exports = notificationList;
