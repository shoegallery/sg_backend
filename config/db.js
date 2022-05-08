const mongoose = require("mongoose");

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
      console.log("Unable to connect to MongoDB" + err);
    });
};

module.exports = connectDB;
