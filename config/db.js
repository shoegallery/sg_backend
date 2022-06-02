const mongoose = require("mongoose");
const sendMessage = require("../utils/sendMessage")
const connectDB = async () => {
  mongoose
    .connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connected to MongoDB!");
    })
    .catch((err) => {
      const message = {
        channel: "sms",
        title: "SHOE GALLERY",
        body: `MongoDB salsan baina`,
        receivers: ["86218721"],
        shop_id: "2706",
      };
      sendMessage({
        message,
      });
      console.log("Unable to connect to MongoDB" + err);
    });
};

module.exports = connectDB;
