const mongoose = require("mongoose");

const connectDB = async () => {
  mongoose
    .connect(process.env.DATABASE_URL, {})
    .then(() => {
      console.log("Successfully connected to MongoDB!");
    })
    .catch((err) => {
      console.log("Unable to connect to MongoDB" + err);
    });
};

module.exports = connectDB;
