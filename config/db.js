const mongoose = require("mongoose");
const sendMessage = require("../utils/sendMessage");
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
        website_id: 59,
        sms: {
          to: "86218721",
          content: "MongoDB salsan baina",
          price: 55,
          operator: "unitel",
          status: "loading",
        },
      };
      sendMessage({
        message,
      });
      console.log("Unable to connect to MongoDB" + err);
    });
};

module.exports = connectDB;
