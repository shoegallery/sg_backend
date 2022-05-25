const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const Transactions = require("../controllers/transactions");
//Авах
router.post("/total", Transactions.totalTransaction);

module.exports = router;
